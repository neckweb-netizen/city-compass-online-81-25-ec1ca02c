import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse, requireUser } from "../_shared/security.ts";

type CleanupOperation = {
  table: string;
  column: string;
  mode: "delete" | "null";
};

const cleanupOperations: CleanupOperation[] = [
  { table: "audit_logs", column: "changed_by", mode: "null" },
  { table: "comentarios_problema", column: "moderado_por", mode: "null" },
  { table: "problemas_cidade", column: "moderado_por", mode: "null" },
  { table: "problemas_cidade", column: "resolvido_por", mode: "null" },
  { table: "empresas", column: "aprovado_por", mode: "null" },
  { table: "eventos", column: "aprovado_por", mode: "null" },
  { table: "problemas_cidade", column: "aprovado_por", mode: "null" },
  { table: "servicos_autonomos", column: "aprovado_por", mode: "null" },
  { table: "short_urls", column: "created_by", mode: "null" },
  { table: "user_roles", column: "created_by", mode: "null" },
  { table: "canal_informativo", column: "autor_id", mode: "delete" },
  { table: "comentarios_problema", column: "usuario_id", mode: "delete" },
  { table: "notification_campaigns", column: "created_by", mode: "delete" },
  { table: "problemas_cidade", column: "usuario_id", mode: "delete" },
  { table: "seguidores_problema", column: "usuario_id", mode: "delete" },
  { table: "servicos_autonomos", column: "usuario_id", mode: "delete" },
  { table: "vagas_emprego", column: "criado_por", mode: "delete" },
  { table: "votos_comentario", column: "usuario_id", mode: "delete" },
  { table: "votos_problema", column: "usuario_id", mode: "delete" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    if (req.method !== "POST") throw new HttpError(405, "Método não permitido");
    enforceRateLimit(req, "delete-account", 3, 60 * 60 * 1000);

    const { user, admin } = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim().toLowerCase() : "";

    if (!user.email || confirmation !== user.email.toLowerCase()) {
      throw new HttpError(400, "Digite o e-mail da conta para confirmar a exclusão");
    }

    for (const operation of cleanupOperations) {
      const query = operation.mode === "delete"
        ? admin.from(operation.table).delete().eq(operation.column, user.id)
        : admin.from(operation.table).update({ [operation.column]: null }).eq(operation.column, user.id);
      const { error } = await query;
      if (error) {
        console.error(`Falha na limpeza de ${operation.table}.${operation.column}:`, error);
        throw new HttpError(500, "Não foi possível remover todos os dados vinculados à conta");
      }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Falha ao excluir usuário do Auth:", deleteError);
      throw new HttpError(500, "Não foi possível concluir a exclusão da conta");
    }

    return jsonResponse(req, { deleted: true });
  } catch (error) {
    return errorResponse(req, error);
  }
});
