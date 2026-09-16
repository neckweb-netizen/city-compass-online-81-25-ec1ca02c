import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bot, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Settings = {
  enabled: boolean;
  maintenance: boolean;
  daily_request_limit: number;
  daily_model_limit: number;
  visitor_daily_limit: number;
  max_message_length: number;
  model: string;
};

type Plan = { id: string; nome: string; ativo: boolean };
type Entitlement = { plan_id: string; feature: string; enabled: boolean };
type Company = { id: string; nome: string; plano_atual_id: string; plano_data_vencimento: string };
type CompanyGrant = { company_id: string; manual_grant_until: string | null; manual_grant_reason: string | null };

const fields: { key: keyof Pick<Settings, 'daily_request_limit' | 'daily_model_limit' | 'visitor_daily_limit' | 'max_message_length'>; label: string; hint: string; min: number; max: number }[] = [
  { key: 'daily_request_limit', label: 'Consultas por dia no site', hint: 'Teto global diário, incluindo buscas sem Gemini.', min: 1, max: 100000 },
  { key: 'daily_model_limit', label: 'Chamadas ao Gemini por dia', hint: 'Teto separado para proteger o custo da chave.', min: 0, max: 10000 },
  { key: 'visitor_daily_limit', label: 'Consultas por visitante por dia', hint: 'Limite compartilhado por identidade anônima ou conta.', min: 1, max: 1000 },
  { key: 'max_message_length', label: 'Caracteres por mensagem', hint: 'Evita entradas grandes e gasto desnecessário de tokens.', min: 50, max: 2000 },
];

export function AiAssistantControls() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [grants, setGrants] = useState<CompanyGrant[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [grantUntil, setGrantUntil] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingKey, setTestingKey] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const [configResult, plansResult, entitlementsResult, companiesResult, grantsResult] = await Promise.all([
        supabase.from('ai_settings' as never).select('enabled,maintenance,daily_request_limit,daily_model_limit,visitor_daily_limit,max_message_length,model').eq('id', true).maybeSingle(),
        supabase.from('planos').select('id,nome,ativo').order('nome'),
        supabase.from('ai_plan_entitlements' as never).select('plan_id,feature,enabled').eq('feature', 'discovery'),
        supabase.from('empresas').select('id,nome,plano_atual_id,plano_data_vencimento').eq('ativo', true).eq('status_aprovacao', 'aprovado').gt('plano_data_vencimento', new Date().toISOString()).not('plano_atual_id', 'is', null).order('nome').limit(100),
        supabase.from('ai_company_access' as never).select('company_id,manual_grant_until,manual_grant_reason'),
      ]);
      if (!active) return;
      setLoading(false);
      const error = configResult.error || plansResult.error || entitlementsResult.error || companiesResult.error || grantsResult.error;
      if (error) {
        toast.error('Não foi possível carregar a configuração da IA. Confirme o MFA e a migração.');
        return;
      }
      setSettings(configResult.data as Settings | null);
      setPlans((plansResult.data || []) as Plan[]);
      setEntitlements((entitlementsResult.data || []) as Entitlement[]);
      setCompanies((companiesResult.data || []) as Company[]);
      setGrants((grantsResult.data || []) as CompanyGrant[]);
    }
    void load();
    return () => { active = false; };
  }, []);

  async function saveSettings() {
    if (!settings) return;
    for (const field of fields) {
      const value = settings[field.key];
      if (!Number.isInteger(value) || value < field.min || value > field.max) {
        toast.error(`${field.label}: informe um número entre ${field.min} e ${field.max}.`);
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase.from('ai_settings' as never).update({
      enabled: settings.enabled,
      maintenance: settings.maintenance,
      daily_request_limit: settings.daily_request_limit,
      daily_model_limit: settings.daily_model_limit,
      visitor_daily_limit: settings.visitor_daily_limit,
      max_message_length: settings.max_message_length,
    } as never).eq('id', true);
    setSaving(false);
    if (error) toast.error('Não foi possível salvar. Confirme que seu MFA está ativo.');
    else toast.success('Limites e estado da IA salvos.');
  }

  async function setDiscovery(planId: string, enabled: boolean) {
    setSaving(true);
    const existing = entitlements.some(item => item.plan_id === planId && item.feature === 'discovery');
    const query = existing
      ? supabase.from('ai_plan_entitlements' as never)
        .update({ enabled, updated_at: new Date().toISOString() } as never)
        .eq('plan_id', planId).eq('feature', 'discovery')
      : supabase.from('ai_plan_entitlements' as never)
        .insert({ plan_id: planId, feature: 'discovery', enabled } as never);
    const { data, error } = await query.select('plan_id').maybeSingle();
    setSaving(false);
    if (error || !data) {
      console.error('Falha ao atualizar benefício de IA do plano:', error);
      toast.error('Não foi possível atualizar o plano. Confira sua sessão e tente novamente.');
      return;
    }
    setEntitlements(previous => [...previous.filter(item => item.plan_id !== planId), { plan_id: planId, feature: 'discovery', enabled }]);
    toast.success(enabled ? 'Plano habilitado para descoberta pela IA.' : 'Plano removido da descoberta pela IA.');
  }

  async function testKey() {
    setTestingKey(true);
    const { data, error } = await supabase.functions.invoke('assistente-ia', { body: { action: 'diagnostic' } });
    setTestingKey(false);
    if (error) toast.error('O teste não conseguiu acessar a função. Confira a publicação e o MFA.');
    else if (data?.reachable) toast.success('Chave Gemini configurada e conexão funcionando.');
    else toast.error(data?.configured ? 'A chave existe, mas a chamada ao Gemini falhou.' : 'GEMINI_API_KEY não foi encontrada na função.');
  }

  async function saveGrant(remove = false) {
    if (!selectedCompany) return toast.error('Escolha uma empresa.');
    const company = companies.find(item => item.id === selectedCompany);
    if (!company) return toast.error('Empresa indisponível.');
    if (!remove && (!grantReason.trim() || !Number.isFinite(new Date(grantUntil).getTime()) || new Date(grantUntil).getTime() <= Date.now())) {
      return toast.error('Informe um motivo e uma data futura para a concessão.');
    }
    if (!remove && new Date(grantUntil).getTime() > new Date(company.plano_data_vencimento).getTime()) {
      return toast.error('A concessão não pode ultrapassar a vigência do plano da empresa.');
    }
    setSaving(true);
    const existing = grants.some(item => item.company_id === selectedCompany);
    const values = {
      manual_grant_until: remove ? null : new Date(grantUntil).toISOString(),
      manual_grant_reason: remove ? null : grantReason.trim(),
    };
    const query = existing
      ? supabase.from('ai_company_access' as never).update(values as never).eq('company_id', selectedCompany)
      : supabase.from('ai_company_access' as never).insert({ company_id: selectedCompany, ...values } as never);
    const { data, error } = await query.select('company_id,manual_grant_until,manual_grant_reason').maybeSingle();
    setSaving(false);
    if (error || !data) {
      console.error('Falha ao salvar concessão de IA:', error);
      return toast.error('Não foi possível salvar a concessão. Confira sua sessão e tente novamente.');
    }
    const saved = data as CompanyGrant;
    setGrants(previous => [...previous.filter(item => item.company_id !== selectedCompany), saved]);
    toast.success(remove ? 'Concessão removida.' : 'Concessão registrada. A empresa participa se as demais regras estiverem válidas.');
  }

  const selectedPlanId = companies.find(company => company.id === selectedCompany)?.plano_atual_id;
  const planEnabled = plans.some(plan => plan.id === selectedPlanId && plan.ativo)
    && entitlements.some(item => item.plan_id === selectedPlanId && item.feature === 'discovery' && item.enabled);
  const manualGrant = grants.find(item => item.company_id === selectedCompany);
  const grantActive = Boolean(manualGrant?.manual_grant_until && new Date(manualGrant.manual_grant_until).getTime() > Date.now());

  return (
    <Card className="min-w-0 border-primary/30">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-start gap-2 text-lg sm:items-center sm:text-xl"><Bot className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" /> Assistente IA: planos e limites</CardTitle>
        <p className="text-sm text-muted-foreground">Defina aqui quais planos podem aparecer nas recomendações. A IA não escolhe a elegibilidade: o banco verifica plano vigente, aprovação e permissões a cada busca.</p>
      </CardHeader>
      <CardContent className="min-w-0 space-y-6 px-4 sm:px-6">
        {loading ? <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : !settings ? (
          <p role="alert" className="text-sm text-destructive">Configuração indisponível. Verifique a migração e o segundo fator da conta administradora.</p>
        ) : <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3 sm:p-4">
              <div className="min-w-0"><Label htmlFor="ai-enabled">Assistente ativo</Label><p className="text-xs text-muted-foreground">Comece desligado; ligue após configurar a chave e testar a função.</p></div>
              <Switch className="shrink-0" id="ai-enabled" checked={settings.enabled} onCheckedChange={enabled => setSettings({ ...settings, enabled })} />
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3 sm:p-4">
              <div className="min-w-0"><Label htmlFor="ai-maintenance">Modo manutenção</Label><p className="text-xs text-muted-foreground">Bloqueia imediatamente novas consultas sem apagar dados.</p></div>
              <Switch className="shrink-0" id="ai-maintenance" checked={settings.maintenance} onCheckedChange={maintenance => setSettings({ ...settings, maintenance })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(field => <div key={field.key} className="min-w-0 space-y-1">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input id={field.key} type="number" min={field.min} max={field.max} value={settings[field.key]}
                onChange={event => setSettings({ ...settings, [field.key]: Number(event.target.value) })} />
              <p className="text-xs text-muted-foreground">{field.hint}</p>
            </div>)}
          </div>
          <p className="text-xs text-muted-foreground">Modelo previsto: {settings.model}. A chave fica exclusivamente nos secrets da função Supabase; não a cole neste painel.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><Button className="w-full sm:w-auto" disabled={saving} onClick={() => void saveSettings()}>Salvar limites</Button><Button className="w-full sm:w-auto" variant="outline" disabled={testingKey} onClick={() => void testKey()}>{testingKey ? 'Testando...' : 'Testar chave Gemini'}</Button></div>
          <div className="space-y-3 border-t pt-5">
            <h3 className="font-semibold">Planos que participam da descoberta</h3>
            <p className="text-sm text-muted-foreground">Este botão habilita o <strong>tipo de plano</strong>, não concede acesso individual a empresas sem pagamento. Para planos atribuídos manualmente, use a concessão com motivo e prazo na seção abaixo.</p>
            {plans.map(plan => <div key={plan.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0"><Label htmlFor={`ai-plan-${plan.id}`}>{plan.nome}</Label><p className="text-xs text-muted-foreground">{plan.ativo ? 'Plano ativo' : 'Plano inativo'}</p></div>
              <Switch className="shrink-0" id={`ai-plan-${plan.id}`} disabled={saving || !plan.ativo}
                checked={entitlements.some(item => item.plan_id === plan.id && item.enabled)}
                onCheckedChange={enabled => void setDiscovery(plan.id, enabled)} />
            </div>)}
          </div>
          <div className="space-y-3 border-t pt-5">
            <h3 className="font-semibold">Empresas com plano atribuído manualmente</h3>
            <p className="text-sm text-muted-foreground">Sem pagamento confirmado, a empresa só pode ser descoberta pela IA se você conceder uma autorização com motivo e validade. O plano ainda precisa estar habilitado acima; a empresa deve continuar aprovada e com vigência ativa.</p>
            <Label htmlFor="ai-grant-company">Empresa</Label>
            <select id="ai-grant-company" value={selectedCompany} onChange={event => {
              const id = event.target.value;
              setSelectedCompany(id);
              const existing = grants.find(item => item.company_id === id);
              setGrantReason(existing?.manual_grant_reason || '');
              if (existing?.manual_grant_until) {
                const date = new Date(existing.manual_grant_until);
                setGrantUntil(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
              } else setGrantUntil('');
            }} className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Selecione uma empresa</option>
              {companies.map(company => <option value={company.id} key={company.id}>{company.nome}</option>)}
            </select>
            {selectedCompany && <p className="text-xs text-muted-foreground">Plano: {plans.find(plan => plan.id === companies.find(company => company.id === selectedCompany)?.plano_atual_id)?.nome || 'Não identificado'}. Vigência da empresa até {new Date(companies.find(company => company.id === selectedCompany)?.plano_data_vencimento || '').toLocaleDateString('pt-BR')}.</p>}
            {selectedCompany && <div role="status" aria-live="polite" className="space-y-1 rounded-lg border border-primary/20 bg-muted/40 p-3 text-sm">
              <p className="font-semibold">Situação da empresa na IA</p>
              <p>Plano na IA: {planEnabled ? 'habilitado' : 'não habilitado'}.</p>
              <p>Concessão manual: {grantActive ? `vigente até ${new Date(manualGrant!.manual_grant_until!).toLocaleDateString('pt-BR')}` : 'não concedida ou vencida'}.</p>
              {!grantActive && <p className="text-muted-foreground">Se esta empresa não possui pagamento válido, ela ainda não aparece nas recomendações. Preencha o motivo e a data abaixo e clique em “Conceder acesso”.</p>}
              {grantActive && !planEnabled && <p className="text-muted-foreground">Ative também o plano acima para que ela possa participar.</p>}
            </div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1"><Label htmlFor="ai-grant-date">Conceder até</Label><Input className="min-w-0" id="ai-grant-date" type="datetime-local" value={grantUntil} onChange={event => setGrantUntil(event.target.value)} /></div>
              <div className="min-w-0 space-y-1"><Label htmlFor="ai-grant-reason">Motivo administrativo</Label><Input className="min-w-0" id="ai-grant-reason" maxLength={200} value={grantReason} onChange={event => setGrantReason(event.target.value)} placeholder="Ex.: plano atribuído manualmente" /></div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><Button className="w-full sm:w-auto" disabled={saving || !selectedCompany} onClick={() => void saveGrant()}>Conceder acesso</Button><Button className="w-full sm:w-auto" variant="outline" disabled={saving || !selectedCompany || !grants.some(item => item.company_id === selectedCompany && item.manual_grant_until)} onClick={() => void saveGrant(true)}>Remover concessão</Button></div>
          </div>
        </>}
      </CardContent>
    </Card>
  );
}
