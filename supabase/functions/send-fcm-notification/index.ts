import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";
import { corsHeaders, errorResponse, HttpError, jsonResponse } from "../_shared/security.ts";
import { FirebaseSendError, sendFirebaseNotification } from "../_shared/firebase.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface WorkerInput {
  action?: "process";
  campaignId?: string;
}

interface Campaign {
  id: string;
  created_by: string | null;
  title: string;
  message: string;
  category: string;
  priority: string;
  image_url: string | null;
  icon_url: string | null;
  action_url: string | null;
  action_label: string | null;
  audience_type: string;
  target_user_ids: string[];
  channels: { in_app?: boolean; push?: boolean };
  metadata: Record<string, unknown>;
}

interface Preference {
  user_id: string;
  in_app_enabled: boolean;
  push_enabled: boolean;
  system_enabled: boolean;
  marketing_enabled: boolean;
  events_enabled: boolean;
  community_enabled: boolean;
}

function isCategoryEnabled(category: string, preference?: Preference): boolean {
  if (!preference) return true;
  if (category === "marketing") return preference.marketing_enabled;
  if (category === "events") return preference.events_enabled;
  if (category === "community") return preference.community_enabled;
  return preference.system_enabled;
}

async function authorizeWorker(req: Request): Promise<void> {
  const authorization = req.headers.get("authorization");
  if (authorization === `Bearer ${serviceRoleKey}`) return;

  const provided = req.headers.get("x-notification-worker-key");
  if (!provided) throw new HttpError(401, "Worker não autorizado");
  const { data, error } = await admin
    .from("notification_internal_settings")
    .select("secret_value")
    .eq("setting_key", "worker_secret")
    .maybeSingle();
  if (error || !data || data.secret_value !== provided) throw new HttpError(401, "Worker não autorizado");
}

async function getCampaignRecipients(campaign: Campaign): Promise<string[]> {
  let query = admin.from("usuarios").select("id");
  if (campaign.audience_type === "users") query = query.eq("tipo_conta", "usuario");
  if (campaign.audience_type === "businesses") query = query.eq("tipo_conta", "empresa");
  if (campaign.audience_type === "admins") query = query.in("tipo_conta", ["admin_geral", "admin_cidade"]);
  if (campaign.audience_type === "specific") query = query.in("id", campaign.target_user_ids || []);
  const cityId = typeof campaign.metadata?.city_id === "string" ? campaign.metadata.city_id : null;
  if (cityId) query = query.eq("cidade_id", cityId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => row.id);
}

async function materializeCampaign(campaign: Campaign): Promise<void> {
  const recipientIds = await getCampaignRecipients(campaign);
  if (!recipientIds.length) {
    await admin.from("notification_campaigns").update({
      status: "failed",
      last_error: "Nenhum destinatário encontrado",
      completed_at: new Date().toISOString(),
      total_recipients: 0,
    }).eq("id", campaign.id);
    return;
  }

  const { data: preferencesData, error: preferencesError } = await admin
    .from("notification_preferences")
    .select("user_id, in_app_enabled, push_enabled, system_enabled, marketing_enabled, events_enabled, community_enabled")
    .in("user_id", recipientIds);
  if (preferencesError) throw preferencesError;
  const preferences = new Map<string, Preference>((preferencesData || []).map((item) => [item.user_id, item as Preference]));
  const eligible = recipientIds.filter((userId) => isCategoryEnabled(campaign.category, preferences.get(userId)));
  const rows = eligible.map((userId) => {
    const preference = preferences.get(userId);
    const inAppEnabled = campaign.channels?.in_app !== false && (preference?.in_app_enabled ?? true);
    return {
      campaign_id: campaign.id,
      created_by: campaign.created_by,
      user_id: userId,
      title: campaign.title,
      message: campaign.message,
      category: campaign.category,
      priority: campaign.priority,
      image_url: campaign.image_url,
      icon_url: campaign.icon_url,
      action_url: campaign.action_url,
      action_label: campaign.action_label,
      metadata: campaign.metadata || {},
      archived_at: inAppEnabled ? null : new Date().toISOString(),
    };
  });

  for (let offset = 0; offset < rows.length; offset += 500) {
    const { error } = await admin
      .from("notifications")
      .upsert(rows.slice(offset, offset + 500), {
        onConflict: "campaign_id,user_id",
        ignoreDuplicates: true,
      });
    if (error) throw error;
  }

  const { count: deliveries, error: deliveryCountError } = await admin
    .from("notification_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id);
  if (deliveryCountError) throw deliveryCountError;
  await admin.from("notification_campaigns").update({
    total_recipients: eligible.length,
    total_deliveries: deliveries || 0,
  }).eq("id", campaign.id);
}

async function claimCampaigns(campaignId?: string): Promise<Campaign[]> {
  const { data, error } = await admin.rpc("claim_notification_campaigns", {
    p_campaign_id: campaignId || null,
    p_limit: campaignId ? 1 : 5,
  });
  if (error) throw error;
  return (data || []) as Campaign[];
}

async function processCampaigns(campaignId?: string): Promise<string[]> {
  const campaigns = await claimCampaigns(campaignId);
  const ids: string[] = [];
  for (const campaign of campaigns) {
    ids.push(campaign.id);
    try {
      await materializeCampaign(campaign);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao preparar campanha";
      await admin.from("notification_campaigns").update({
        status: "failed",
        last_error: message.slice(0, 1000),
        completed_at: new Date().toISOString(),
      }).eq("id", campaign.id);
    }
  }
  return ids;
}

async function processDelivery(delivery: Record<string, unknown>, notifications: Map<string, any>, devices: Map<string, any>) {
  const notification = notifications.get(String(delivery.notification_id));
  const device = devices.get(String(delivery.device_id));
  const now = new Date().toISOString();
  if (!notification || !device || !device.enabled || device.revoked_at) {
    await admin.from("notification_deliveries").update({
      status: "skipped",
      error_code: "DEVICE_UNAVAILABLE",
      error_message: "Dispositivo indisponível",
      updated_at: now,
    }).eq("id", delivery.id);
    return { sent: 0, failed: 1 };
  }

  try {
    const providerMessageId = await sendFirebaseNotification(
      device.registration_id,
      device.target_type,
      {
        title: notification.title,
        body: notification.message || "",
        imageUrl: notification.image_url,
        iconUrl: notification.icon_url,
        actionUrl: notification.action_url,
        notificationId: notification.id,
        category: notification.category,
        priority: notification.priority,
        metadata: notification.metadata || {},
      },
    );
    await admin.from("notification_deliveries").update({
      status: "sent",
      provider_message_id: providerMessageId,
      error_code: null,
      error_message: null,
      sent_at: now,
      updated_at: now,
    }).eq("id", delivery.id);
    await admin.from("notification_devices").update({ last_seen_at: now }).eq("id", device.id);
    return { sent: 1, failed: 0 };
  } catch (error) {
    const attempts = Number(delivery.attempt_count || 1);
    const firebaseError = error instanceof FirebaseSendError ? error : null;
    const code = firebaseError?.code || "SEND_ERROR";
    const permanent = ["UNREGISTERED", "NOT_FOUND", "INVALID_ARGUMENT", "SENDER_ID_MISMATCH"].includes(code)
      || firebaseError?.status === 404;
    if (permanent) {
      await admin.from("notification_devices").update({ enabled: false, revoked_at: now }).eq("id", device.id);
    }
    const retry = !permanent && attempts < 5;
    const nextAttempt = new Date(Date.now() + Math.min(60, 2 ** attempts) * 60_000).toISOString();
    await admin.from("notification_deliveries").update({
      status: permanent ? "skipped" : "failed",
      error_code: code.slice(0, 120),
      error_message: (error instanceof Error ? error.message : "Falha FCM").slice(0, 1000),
      next_attempt_at: retry ? nextAttempt : now,
      updated_at: now,
    }).eq("id", delivery.id);
    return { sent: 0, failed: 1 };
  }
}

async function processDeliveryBatch(limit = 100): Promise<{ claimed: number; sent: number; failed: number; campaignIds: string[] }> {
  const { data: deliveries, error } = await admin.rpc("claim_notification_deliveries", { p_limit: limit });
  if (error) throw error;
  if (!deliveries?.length) return { claimed: 0, sent: 0, failed: 0, campaignIds: [] };

  const notificationIds = Array.from(new Set(deliveries.map((item: any) => item.notification_id)));
  const deviceIds = Array.from(new Set(deliveries.map((item: any) => item.device_id).filter(Boolean)));
  const [{ data: notificationRows, error: notificationError }, { data: deviceRows, error: deviceError }] = await Promise.all([
    admin.from("notifications").select("*").in("id", notificationIds),
    admin.from("notification_devices").select("*").in("id", deviceIds),
  ]);
  if (notificationError) throw notificationError;
  if (deviceError) throw deviceError;
  const notificationMap = new Map((notificationRows || []).map((item: any) => [item.id, item]));
  const deviceMap = new Map((deviceRows || []).map((item: any) => [item.id, item]));
  let sent = 0;
  let failed = 0;
  for (let offset = 0; offset < deliveries.length; offset += 20) {
    const results = await Promise.all(
      deliveries.slice(offset, offset + 20).map((delivery: any) => processDelivery(delivery, notificationMap, deviceMap)),
    );
    for (const result of results) {
      sent += result.sent;
      failed += result.failed;
    }
  }
  return {
    claimed: deliveries.length,
    sent,
    failed,
    campaignIds: Array.from(new Set(deliveries.map((item: any) => item.campaign_id).filter(Boolean))),
  };
}

async function refreshCampaign(campaignId: string): Promise<void> {
  const [{ count: sent }, { count: terminalFailed }, { count: pending }, { count: retryableFailed }] = await Promise.all([
    admin.from("notification_deliveries").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("status", "sent"),
    admin.from("notification_deliveries").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).or("status.eq.skipped,and(status.eq.failed,attempt_count.gte.5)"),
    admin.from("notification_deliveries").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).in("status", ["queued", "processing"]),
    admin.from("notification_deliveries").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("status", "failed").lt("attempt_count", 5),
  ]);
  const unfinished = (pending || 0) + (retryableFailed || 0);
  const finalStatus = unfinished === 0 ? ((terminalFailed || 0) > 0 ? "partial" : "completed") : "processing";
  await admin.from("notification_campaigns").update({
    total_sent: sent || 0,
    total_failed: terminalFailed || 0,
    status: finalStatus,
    completed_at: finalStatus === "processing" ? null : new Date().toISOString(),
  }).eq("id", campaignId).neq("status", "cancelled");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  try {
    if (req.method !== "POST") throw new HttpError(405, "Método não permitido");
    await authorizeWorker(req);
    const input = await req.json().catch(() => ({ action: "process" })) as WorkerInput;
    const campaignIds = new Set(await processCampaigns(input.campaignId));
    let claimed = 0;
    let sent = 0;
    let failed = 0;
    for (let batch = 0; batch < 5; batch += 1) {
      const result = await processDeliveryBatch(100);
      claimed += result.claimed;
      sent += result.sent;
      failed += result.failed;
      result.campaignIds.forEach((id) => campaignIds.add(id));
      if (result.claimed < 100) break;
    }
    await Promise.all(Array.from(campaignIds).map(refreshCampaign));
    return jsonResponse(req, { success: true, claimed, sent, failed, campaigns: Array.from(campaignIds) });
  } catch (error) {
    return errorResponse(req, error);
  }
});
