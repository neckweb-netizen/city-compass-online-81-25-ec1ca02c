interface FirebaseServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export interface FirebaseNotificationPayload {
  title: string;
  body: string;
  imageUrl?: string | null;
  iconUrl?: string | null;
  actionUrl?: string | null;
  notificationId: string;
  category: string;
  priority: string;
  metadata?: Record<string, unknown>;
}

export class FirebaseSendError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let cachedAccessToken: { value: string; expiresAt: number; scope: string } | null = null;

function base64UrlEncode(input: ArrayBuffer): string {
  const bytes = new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64Decode(value: string): ArrayBuffer {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

export function getFirebaseServiceAccount(): FirebaseServiceAccount {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY não configurada");
  const account = JSON.parse(raw) as FirebaseServiceAccount;
  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new Error("Credencial Firebase incompleta");
  }
  return account;
}

async function createSignedJwt(account: FirebaseServiceAccount, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })).buffer);
  const claims = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    iss: account.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).buffer);
  const unsigned = `${header}.${claims}`;
  const pem = account.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    base64Decode(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64UrlEncode(signature)}`;
}

export async function getGoogleAccessToken(scope = "https://www.googleapis.com/auth/firebase.messaging"): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.scope === scope && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }
  const account = getFirebaseServiceAccount();
  const assertion = await createSignedJwt(account, scope);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Falha ao autenticar no Firebase (${response.status})`);
  const data = await response.json();
  cachedAccessToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(300, Number(data.expires_in || 3600)) * 1000,
    scope,
  };
  return cachedAccessToken.value;
}

function stringData(payload: FirebaseNotificationPayload): Record<string, string> {
  const data: Record<string, string> = {
    notification_id: payload.notificationId,
    category: payload.category,
    priority: payload.priority,
    action_url: payload.actionUrl || "/notificacoes",
  };
  for (const [key, value] of Object.entries(payload.metadata || {})) {
    if (value === null || value === undefined) continue;
    data[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return data;
}

export async function sendFirebaseNotification(
  registrationId: string,
  targetType: "fid" | "token",
  payload: FirebaseNotificationPayload,
): Promise<string> {
  const account = getFirebaseServiceAccount();
  const accessToken = await getGoogleAccessToken();
  const icon = payload.iconUrl || "https://sajtem.vercel.app/Logo.png";
  const data = stringData(payload);
  const message: Record<string, unknown> = {
    [targetType === "fid" ? "fid" : "token"]: registrationId,
    notification: {
      title: payload.title,
      body: payload.body,
      ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
    },
    data,
    webpush: {
      headers: {
        Urgency: payload.priority === "urgent" || payload.priority === "high" ? "high" : "normal",
        TTL: "86400",
      },
      notification: {
        title: payload.title,
        body: payload.body,
        icon,
        badge: icon,
        tag: payload.notificationId,
        renotify: payload.priority === "urgent",
        requireInteraction: payload.priority === "urgent",
        vibrate: [200, 100, 200],
        ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
        data,
      },
      ...(payload.actionUrl?.startsWith("https://") ? { fcm_options: { link: payload.actionUrl } } : {}),
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = body?.error?.details?.find?.((item: { errorCode?: string }) => item.errorCode)?.errorCode
      || body?.error?.status
      || `HTTP_${response.status}`;
    throw new FirebaseSendError(response.status, code, body?.error?.message || "Falha no envio FCM");
  }
  return body.name || "sent";
}
