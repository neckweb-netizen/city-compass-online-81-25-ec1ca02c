import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse, requireUser } from "../_shared/security.ts";

type AudienceType = "all" | "users" | "businesses" | "admins" | "specific";
type Category = "system" | "marketing" | "events" | "security" | "account" | "community";
type Priority = "low" | "normal" | "high" | "urgent";

interface CampaignInput {
  action?: "send" | "cancel";
  campaignId?: string;
  title?: string;
  message?: string;
  category?: Category;
  priority?: Priority;
  imageUrl?: string | null;
  iconUrl?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  audienceType?: AudienceType;
  targetUserIds?: string[];
  channels?: { in_app?: boolean; push?: boolean };
  scheduledAt?: string | null;
  metadata?: Record<string, unknown>;
}

const categories = new Set<Category>(["system", "marketing", "events", "security", "account", "community"]);
const priorities = new Set<Priority>(["low", "normal", "high", "urgent"]);
const audiences = new Set<AudienceType>(["all", "users", "businesses", "admins", "specific"]);

function cleanText(value: unknown, field: string, max: number, required = false): string | null {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new HttpError(400, `${field} é obrigatório`);
  if (result.length > max) throw new HttpError(400, `${field} deve ter no máximo ${max} caracteres`);
  return result || null;
}

function cleanUrl(value: unknown, field: string): string | null {
  const result = cleanText(value, field, 2048);
  if (!result) return null;
  if (result.startsWith("/")) return result;
  try {
    const url = new URL(result);
    if (url.protocol !== "https:") throw new Error("protocol");
    return url.toString();
  } catch {
    throw new HttpError(400, `${field} deve ser um link HTTPS ou um caminho do site`);
  }
}

async function countRecipients(
  admin: any,
  audienceType: AudienceType,
  targetUserIds: string[],
  cityId: string | null,
): Promise<number> {
  let query = admin.from("usuarios").select("id", { count: "exact", head: true });
  if (audienceType === "users") query = query.eq("tipo_conta", "usuario");
  if (audienceType === "businesses") query = query.eq("tipo_conta", "empresa");
  if (audienceType === "admins") query = query.in("tipo_conta", ["admin_geral", "admin_cidade"]);
  if (audienceType === "specific") query = query.in("id", targetUserIds);
  if (cityId) query = query.eq("cidade_id", cityId);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  try {
    if (req.method !== "POST") throw new HttpError(405, "Método não permitido");
    enforceRateLimit(req, "admin-notifications", 30, 60_000);
    const { user, profile, admin } = await requireUser(req, ["admin_geral", "admin_cidade"]);
    const input = await req.json() as CampaignInput;

    if (input.action === "cancel") {
      if (!input.campaignId) throw new HttpError(400, "Campanha inválida");
      const { data, error } = await admin
        .from("notification_campaigns")
        .update({ status: "cancelled" })
        .eq("id", input.campaignId)
        .in("status", ["draft", "scheduled", "queued"])
        .select("id, status")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new HttpError(409, "A campanha não pode mais ser cancelada");
      return jsonResponse(req, { campaign: data });
    }

    const title = cleanText(input.title, "Título", 120, true)!;
    const message = cleanText(input.message, "Mensagem", 1000, true)!;
    const category = input.category || "system";
    const priority = input.priority || "normal";
    const audienceType = input.audienceType || "all";
    if (!categories.has(category)) throw new HttpError(400, "Categoria inválida");
    if (!priorities.has(priority)) throw new HttpError(400, "Prioridade inválida");
    if (!audiences.has(audienceType)) throw new HttpError(400, "Público inválido");

    const targetUserIds = Array.from(new Set((input.targetUserIds || []).filter((id) => /^[0-9a-f-]{36}$/i.test(id))));
    if (audienceType === "specific" && !targetUserIds.length) throw new HttpError(400, "Selecione pelo menos um destinatário");
    if (targetUserIds.length > 500) throw new HttpError(400, "Selecione no máximo 500 destinatários");

    const channels = {
      in_app: input.channels?.in_app !== false,
      push: input.channels?.push !== false,
    };
    if (!channels.in_app && !channels.push) throw new HttpError(400, "Ative pelo menos um canal de envio");

    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new HttpError(400, "Agendamento inválido");
    const isScheduled = Boolean(scheduledAt && scheduledAt.getTime() > Date.now() + 30_000);
    const cityId = profile?.tipo_conta === "admin_cidade" ? profile.cidade_id : null;
    const totalRecipients = await countRecipients(admin, audienceType, targetUserIds, cityId);
    if (!totalRecipients) throw new HttpError(400, "Nenhum destinatário encontrado para esse público");

    const { data: campaign, error } = await admin
      .from("notification_campaigns")
      .insert({
        created_by: user.id,
        title,
        message,
        category,
        priority,
        image_url: cleanUrl(input.imageUrl, "Imagem"),
        icon_url: cleanUrl(input.iconUrl, "Ícone"),
        action_url: cleanUrl(input.actionUrl, "Link"),
        action_label: cleanText(input.actionLabel, "Texto da ação", 60),
        audience_type: audienceType,
        target_user_ids: targetUserIds,
        channels,
        metadata: { ...(input.metadata || {}), ...(cityId ? { city_id: cityId } : {}) },
        status: isScheduled ? "scheduled" : "queued",
        scheduled_at: isScheduled ? scheduledAt!.toISOString() : new Date().toISOString(),
        total_recipients: totalRecipients,
      })
      .select("*")
      .single();
    if (error) throw error;

    if (!isScheduled) {
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      await fetch(`${supabaseUrl}/functions/v1/send-fcm-notification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process", campaignId: campaign.id }),
      }).catch((workerError) => console.error("Falha ao acionar worker:", workerError));
    }

    return jsonResponse(req, { campaign, queued: !isScheduled, scheduled: isScheduled }, 201);
  } catch (error) {
    return errorResponse(req, error);
  }
});
