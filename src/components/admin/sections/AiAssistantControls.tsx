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
  visitor_daily_limit: number;
  max_message_length: number;
};

type Plan = { id: string; nome: string; ativo: boolean; prioridade_busca: number };
type Company = { id: string; nome: string; plano_atual_id: string | null; plano_data_vencimento: string | null };
type CompanyGrant = { company_id: string; manual_grant_until: string | null; manual_grant_reason: string | null };

const fields: { key: keyof Pick<Settings, 'daily_request_limit' | 'visitor_daily_limit' | 'max_message_length'>; label: string; hint: string; min: number; max: number }[] = [
  { key: 'daily_request_limit', label: 'Consultas por dia no site', hint: 'Teto global diário de buscas.', min: 1, max: 100000 },
  { key: 'visitor_daily_limit', label: 'Consultas por visitante por dia', hint: 'Limite por visitante ou conta.', min: 1, max: 1000 },
  { key: 'max_message_length', label: 'Caracteres por mensagem', hint: 'Evita entradas grandes e abuso.', min: 50, max: 2000 },
];

export function AiAssistantControls() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [grants, setGrants] = useState<CompanyGrant[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [grantUntil, setGrantUntil] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingKnowledge, setTestingKnowledge] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const [configResult, plansResult, companiesResult, grantsResult] = await Promise.all([
        supabase.from('ai_settings' as never).select('enabled,maintenance,daily_request_limit,visitor_daily_limit,max_message_length').eq('id', true).maybeSingle(),
        supabase.from('planos').select('id,nome,ativo,prioridade_busca').order('prioridade_busca', { ascending: false }),
        supabase
          .from('empresas')
          .select('id,nome,plano_atual_id,plano_data_vencimento')
          .eq('ativo', true)
          .eq('status_aprovacao', 'aprovado')
          .not('plano_atual_id', 'is', null)
          .order('nome')
          .limit(200),
        supabase.from('ai_company_access' as never).select('company_id,manual_grant_until,manual_grant_reason'),
      ]);
      if (!active) return;
      setLoading(false);
      if (configResult.error || plansResult.error || companiesResult.error || grantsResult.error) {
        toast.error('Não foi possível carregar a configuração da IA. Confirme o MFA.');
        return;
      }
      setSettings(configResult.data as Settings | null);
      setPlans((plansResult.data || []) as Plan[]);
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
    const { error } = await supabase.from('ai_settings' as never).update({ ...settings } as never).eq('id', true);
    setSaving(false);
    if (error) toast.error('Não foi possível salvar. Confirme que seu MFA está ativo.');
    else toast.success('Limites e estado da IA salvos.');
  }

  async function testKnowledge() {
    setTestingKnowledge(true);
    const { data, error } = await supabase.functions.invoke('assistente-ia', { body: { action: 'knowledge_diagnostic' } });
    setTestingKnowledge(false);
    if (error) return toast.error('Não foi possível testar o armazenamento. Confirme o MFA e a publicação da função.');
    if (data?.reachable) return toast.success(data.hasKnowledgeFiles
      ? 'Base de conhecimento conectada; há arquivos disponíveis.'
      : 'Base de conhecimento conectada. Ainda não há arquivos.');
    const reasons: Record<string, string> = {
      missing_secret: 'Falta pelo menos um dos quatro secrets AI_R2_ no Supabase.',
      invalid_endpoint: 'AI_R2_ENDPOINT não é um endpoint S3 válido do R2.',
      access_denied: 'A chave não tem permissão para listar o bucket da IA.',
      bucket_not_found: 'Bucket não encontrado. Confira a conta, o endpoint e o nome.',
    };
    toast.error(reasons[data?.reason] || 'Não foi possível conectar à base de conhecimento.');
  }

  async function saveGrant(remove = false) {
    if (!selectedCompany) {
      toast.error('Escolha uma empresa.');
      return;
    }
    const company = companies.find(item => item.id === selectedCompany);
    if (!company) {
      toast.error('Empresa indisponível.');
      return;
    }
    const grantDate = new Date(grantUntil);
    const planExpiresAt = company.plano_data_vencimento ? new Date(company.plano_data_vencimento) : null;
    if (!remove && (!grantReason.trim() || !Number.isFinite(grantDate.getTime()) || grantDate.getTime() <= Date.now())) {
      toast.error('Informe um motivo e uma data futura para a concessão.');
      return;
    }
    if (!remove && planExpiresAt && grantDate.getTime() > planExpiresAt.getTime()) {
      toast.error('A concessão não pode ultrapassar a vigência do plano da empresa.');
      return;
    }
    setSaving(true);
    const existing = grants.some(item => item.company_id === selectedCompany);
    const values = {
      manual_grant_until: remove ? null : grantDate.toISOString(),
      manual_grant_reason: remove ? null : grantReason.trim(),
    };
    const query = existing
      ? supabase.from('ai_company_access' as never).update(values as never).eq('company_id', selectedCompany)
      : supabase.from('ai_company_access' as never).insert({ company_id: selectedCompany, ...values } as never);
    const { data, error } = await query.select('company_id,manual_grant_until,manual_grant_reason').maybeSingle();
    setSaving(false);
    if (error || !data) {
      console.error('Falha ao salvar concessão administrativa da IA:', error);
      toast.error('Não foi possível salvar a concessão. Confirme o MFA.');
      return;
    }
    const saved = data as CompanyGrant;
    setGrants(previous => [...previous.filter(item => item.company_id !== selectedCompany), saved]);
    toast.success(remove ? 'Concessão removida.' : 'Concessão registrada para prioridade comercial.');
  }

  const selectedCompanyData = companies.find(company => company.id === selectedCompany);
  const selectedCompanyPlan = plans.find(plan => plan.id === selectedCompanyData?.plano_atual_id);
  const selectedGrant = grants.find(item => item.company_id === selectedCompany);
  const grantActive = Boolean(selectedGrant?.manual_grant_until && new Date(selectedGrant.manual_grant_until).getTime() > Date.now());

  return (
    <Card className="min-w-0 border-primary/30">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-start gap-2 text-lg sm:items-center sm:text-xl"><Bot className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" /> Assistente IA: descoberta e limites</CardTitle>
        <p className="text-sm text-muted-foreground">Todas as empresas ativas e aprovadas podem aparecer. Planos comerciais vigentes têm prioridade nas buscas, segundo a prioridade de busca configurada em cada plano. Prioridade paga não significa melhor qualidade.</p>
      </CardHeader>
      <CardContent className="min-w-0 space-y-6 px-4 sm:px-6">
        {loading ? <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : !settings ? (
          <p role="alert" className="text-sm text-destructive">Configuração indisponível. Verifique a migração e o segundo fator da conta administradora.</p>
        ) : <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3 sm:p-4">
              <div className="min-w-0"><Label htmlFor="ai-enabled">Assistente ativo</Label><p className="text-xs text-muted-foreground">Permite novas consultas ao assistente.</p></div>
              <Switch className="shrink-0" id="ai-enabled" checked={settings.enabled} onCheckedChange={enabled => setSettings({ ...settings, enabled })} />
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3 sm:p-4">
              <div className="min-w-0"><Label htmlFor="ai-maintenance">Modo manutenção</Label><p className="text-xs text-muted-foreground">Bloqueia novas consultas sem apagar dados.</p></div>
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
          <p className="text-xs text-muted-foreground">Respostas baseadas em conteúdo revisado, sem modelos externos. Perguntas sem resposta ajudam a ampliar a base.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><Button className="w-full sm:w-auto" disabled={saving} onClick={() => void saveSettings()}>Salvar limites</Button><Button className="w-full sm:w-auto" variant="outline" disabled={testingKnowledge} onClick={() => void testKnowledge()}>{testingKnowledge ? 'Verificando...' : 'Testar base de conhecimento'}</Button></div>
          <div className="space-y-3 border-t pt-5">
            <h3 className="font-semibold">Hierarquia comercial dos planos</h3>
            <p className="text-sm text-muted-foreground">Esta lista é informativa. A ordem efetiva exige plano ativo, vigência e pagamento válido ou concessão administrativa vigente. Empresas sem isso continuam participando, mas sem prioridade comercial.</p>
            {plans.map(plan => <div key={plan.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span className="min-w-0 font-medium">{plan.nome}{!plan.ativo ? ' (inativo)' : ''}</span>
              <span className="shrink-0 text-muted-foreground">Prioridade {plan.prioridade_busca ?? 0}</span>
            </div>)}
          </div>
          <div className="space-y-3 border-t pt-5">
            <h3 className="font-semibold">Prioridade manual por empresa</h3>
            <p className="text-sm text-muted-foreground">Use quando uma empresa tiver plano comercial atribuído manualmente. A empresa já aparece na IA por estar aprovada; esta concessão só conta para a prioridade comercial do plano.</p>
            <Label htmlFor="ai-grant-company">Empresa</Label>
            <select
              id="ai-grant-company"
              value={selectedCompany}
              onChange={event => {
                const id = event.target.value;
                setSelectedCompany(id);
                const existing = grants.find(item => item.company_id === id);
                setGrantReason(existing?.manual_grant_reason || '');
                if (existing?.manual_grant_until) {
                  const date = new Date(existing.manual_grant_until);
                  setGrantUntil(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                } else {
                  setGrantUntil('');
                }
              }}
              className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione uma empresa</option>
              {companies.map(company => <option value={company.id} key={company.id}>{company.nome}</option>)}
            </select>
            {selectedCompanyData && (
              <div role="status" aria-live="polite" className="space-y-1 rounded-lg border border-primary/20 bg-muted/40 p-3 text-sm">
                <p className="font-semibold">Situação da prioridade</p>
                <p>Plano: {selectedCompanyPlan?.nome || 'Não identificado'}.</p>
                <p>Prioridade do plano: {selectedCompanyPlan?.prioridade_busca ?? 0}.</p>
                <p>Vigência do plano: {selectedCompanyData.plano_data_vencimento ? new Date(selectedCompanyData.plano_data_vencimento).toLocaleDateString('pt-BR') : 'sem data'}.</p>
                <p>Concessão manual: {grantActive ? `vigente até ${new Date(selectedGrant!.manual_grant_until!).toLocaleDateString('pt-BR')}` : 'não concedida ou vencida'}.</p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="ai-grant-date">Conceder até</Label>
                <Input className="min-w-0" id="ai-grant-date" type="datetime-local" value={grantUntil} onChange={event => setGrantUntil(event.target.value)} />
              </div>
              <div className="min-w-0 space-y-1">
                <Label htmlFor="ai-grant-reason">Motivo administrativo</Label>
                <Input className="min-w-0" id="ai-grant-reason" maxLength={200} value={grantReason} onChange={event => setGrantReason(event.target.value)} placeholder="Ex.: plano atribuído manualmente" />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button className="w-full sm:w-auto" disabled={saving || !selectedCompany} onClick={() => void saveGrant()}>Conceder prioridade</Button>
              <Button className="w-full sm:w-auto" variant="outline" disabled={saving || !selectedCompany || !selectedGrant?.manual_grant_until} onClick={() => void saveGrant(true)}>Remover concessão</Button>
            </div>
          </div>
        </>}
      </CardContent>
    </Card>
  );
}
