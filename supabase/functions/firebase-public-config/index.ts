import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse } from "../_shared/security.ts";
import { getFirebaseServiceAccount, getGoogleAccessToken } from "../_shared/firebase.ts";

let cache: { value: Record<string, string>; expiresAt: number } | null = null;

async function fetchFirebaseWebConfig(): Promise<Record<string, string>> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  const configured = Deno.env.get("FIREBASE_WEB_CONFIG");
  let webConfig: Record<string, string> | null = configured ? JSON.parse(configured) : null;

  if (!webConfig) {
    const account = getFirebaseServiceAccount();
    const accessToken = await getGoogleAccessToken("https://www.googleapis.com/auth/cloud-platform");
    const appsResponse = await fetch(
      `https://firebase.googleapis.com/v1beta1/projects/${account.project_id}/webApps`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!appsResponse.ok) {
      throw new HttpError(503, "Não foi possível consultar o aplicativo Web do Firebase");
    }
    const apps = (await appsResponse.json()).apps || [];
    if (!apps.length) throw new HttpError(503, "Nenhum aplicativo Web está configurado no Firebase");

    const preferred = apps.find((app: { displayName?: string }) =>
      /saj\s*tem/i.test(app.displayName || "")
    ) || apps[0];
    const configResponse = await fetch(
      `https://firebase.googleapis.com/v1beta1/${preferred.name}/config`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!configResponse.ok) throw new HttpError(503, "Não foi possível carregar a configuração Web do Firebase");
    webConfig = await configResponse.json();
  }

  const value = {
    apiKey: webConfig.apiKey,
    authDomain: webConfig.authDomain,
    projectId: webConfig.projectId,
    storageBucket: webConfig.storageBucket,
    messagingSenderId: webConfig.messagingSenderId,
    appId: webConfig.appId,
    ...(webConfig.measurementId ? { measurementId: webConfig.measurementId } : {}),
    ...(Deno.env.get("FIREBASE_WEB_VAPID_KEY")
      ? { vapidKey: Deno.env.get("FIREBASE_WEB_VAPID_KEY")! }
      : {}),
  };

  if (!value.apiKey || !value.projectId || !value.messagingSenderId || !value.appId) {
    throw new HttpError(503, "Configuração Web do Firebase incompleta");
  }
  cache = { value, expiresAt: Date.now() + 60 * 60 * 1000 };
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  try {
    if (req.method !== "GET" && req.method !== "POST") throw new HttpError(405, "Método não permitido");
    enforceRateLimit(req, "firebase-public-config", 60, 60_000);
    return jsonResponse(req, await fetchFirebaseWebConfig());
  } catch (error) {
    return errorResponse(req, error);
  }
});
