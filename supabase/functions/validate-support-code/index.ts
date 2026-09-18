import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse, requireUser } from "../_shared/security.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return jsonResponse(req, { error: "Método não permitido" }, 405);

  try {
    const { user, profile, admin } = await requireUser(req, ["admin_geral", "admin_cidade"]);
    await enforceRateLimit(req, "validate-support-code", 20, 600_000, user.id);
    const body = await req.json();
    const codigo = typeof body?.codigo === "string" ? body.codigo.trim().toUpperCase() : "";
    if (!/^[A-Z0-9]{4}$/.test(codigo)) {
      throw new HttpError(400, "Código inválido");
    }

    let query = admin.from("empresas")
      .select("id, nome, telefone, usuario_id, cidade_id, ativo, status_aprovacao, plano_data_vencimento, plano:planos!empresas_plano_atual_id_fkey(nome, suporte_prioritario), usuario:usuarios!empresas_usuario_id_fkey(nome, telefone)")
      .eq("codigo_suporte", codigo);
    if (profile?.tipo_conta === "admin_cidade") {
      if (!profile.cidade_id) throw new HttpError(403, "Permissão insuficiente");
      query = query.eq("cidade_id", profile.cidade_id);
    }
    const { data: empresa, error } = await query.maybeSingle();
    if (error) throw error;
    if (!empresa) return jsonResponse(req, { valido: false, motivo: "codigo_nao_encontrado" });

    const plano = Array.isArray(empresa.plano) ? empresa.plano[0] : empresa.plano;
    const usuario = Array.isArray(empresa.usuario) ? empresa.usuario[0] : empresa.usuario;
    const valido = Boolean(
      empresa.ativo && empresa.status_aprovacao === "aprovado" &&
      plano?.suporte_prioritario &&
      (!empresa.plano_data_vencimento || new Date(empresa.plano_data_vencimento) >= new Date())
    );
    return jsonResponse(req, {
      valido,
      motivo: valido ? "sucesso" : "suporte_indisponivel",
      empresa: {
        id: empresa.id, nome: empresa.nome,
        telefone: usuario?.telefone || empresa.telefone,
        usuario_nome: usuario?.nome || empresa.nome,
        plano: plano?.nome ?? null,
      },
    });
  } catch (error) {
    return errorResponse(req, error);
  }
});
