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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const [configResult, plansResult, entitlementsResult] = await Promise.all([
        supabase.from('ai_settings' as never).select('enabled,maintenance,daily_request_limit,daily_model_limit,visitor_daily_limit,max_message_length,model').eq('id', true).maybeSingle(),
        supabase.from('planos').select('id,nome,ativo').order('nome'),
        supabase.from('ai_plan_entitlements' as never).select('plan_id,feature,enabled').eq('feature', 'discovery'),
      ]);
      if (!active) return;
      setLoading(false);
      const error = configResult.error || plansResult.error || entitlementsResult.error;
      if (error) {
        toast.error('Não foi possível carregar a configuração da IA. Confirme o MFA e a migração.');
        return;
      }
      setSettings(configResult.data as Settings | null);
      setPlans((plansResult.data || []) as Plan[]);
      setEntitlements((entitlementsResult.data || []) as Entitlement[]);
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
    const { error } = await supabase.from('ai_plan_entitlements' as never).upsert({
      plan_id: planId,
      feature: 'discovery',
      enabled,
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'plan_id,feature' });
    setSaving(false);
    if (error) {
      toast.error('Não foi possível atualizar o plano. Confirme o MFA.');
      return;
    }
    setEntitlements(previous => [...previous.filter(item => item.plan_id !== planId), { plan_id: planId, feature: 'discovery', enabled }]);
    toast.success(enabled ? 'Plano habilitado para descoberta pela IA.' : 'Plano removido da descoberta pela IA.');
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Assistente IA: planos e limites</CardTitle>
        <p className="text-sm text-muted-foreground">Defina aqui quais planos podem aparecer nas recomendações. A IA não escolhe a elegibilidade: o banco verifica plano vigente, aprovação e permissões a cada busca.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : !settings ? (
          <p role="alert" className="text-sm text-destructive">Configuração indisponível. Verifique a migração e o segundo fator da conta administradora.</p>
        ) : <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div><Label htmlFor="ai-enabled">Assistente ativo</Label><p className="text-xs text-muted-foreground">Comece desligado; ligue após configurar a chave e testar a função.</p></div>
              <Switch id="ai-enabled" checked={settings.enabled} onCheckedChange={enabled => setSettings({ ...settings, enabled })} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div><Label htmlFor="ai-maintenance">Modo manutenção</Label><p className="text-xs text-muted-foreground">Bloqueia imediatamente novas consultas sem apagar dados.</p></div>
              <Switch id="ai-maintenance" checked={settings.maintenance} onCheckedChange={maintenance => setSettings({ ...settings, maintenance })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(field => <div key={field.key} className="space-y-1">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input id={field.key} type="number" min={field.min} max={field.max} value={settings[field.key]}
                onChange={event => setSettings({ ...settings, [field.key]: Number(event.target.value) })} />
              <p className="text-xs text-muted-foreground">{field.hint}</p>
            </div>)}
          </div>
          <p className="text-xs text-muted-foreground">Modelo previsto: {settings.model}. A chave fica exclusivamente nos secrets da função Supabase; não a cole neste painel.</p>
          <Button disabled={saving} onClick={() => void saveSettings()}>Salvar limites</Button>
          <div className="space-y-3 border-t pt-5">
            <h3 className="font-semibold">Planos que participam da descoberta</h3>
            <p className="text-sm text-muted-foreground">Ativar um plano não publica automaticamente todas as empresas: cada perfil ainda deve estar aprovado, ativo e dentro da vigência, com pagamento válido ou concessão administrativa explícita.</p>
            {plans.map(plan => <div key={plan.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div><Label htmlFor={`ai-plan-${plan.id}`}>{plan.nome}</Label><p className="text-xs text-muted-foreground">{plan.ativo ? 'Plano ativo' : 'Plano inativo'}</p></div>
              <Switch id={`ai-plan-${plan.id}`} disabled={saving || !plan.ativo}
                checked={entitlements.some(item => item.plan_id === plan.id && item.enabled)}
                onCheckedChange={enabled => void setDiscovery(plan.id, enabled)} />
            </div>)}
          </div>
        </>}
      </CardContent>
    </Card>
  );
}
