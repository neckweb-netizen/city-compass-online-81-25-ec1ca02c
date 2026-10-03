import { useEffect, useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function AiAvailabilityControl() {
  const [enabled, setEnabled] = useState(false);
  const [savedEnabled, setSavedEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase
      .from('ai_settings' as never)
      .select('enabled')
      .eq('id', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setLoading(false);
        if (error || !data) {
          setUnavailable(true);
          return;
        }
        const value = Boolean((data as { enabled?: boolean }).enabled);
        setEnabled(value);
        setSavedEnabled(value);
      });
    return () => { active = false; };
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from('ai_settings' as never)
      .update({ enabled } as never)
      .eq('id', true);
    setSaving(false);
    if (error) {
      toast.error('Não foi possível alterar a IA. Confirme o segundo fator da conta administradora.');
      return;
    }
    setSavedEnabled(enabled);
    window.dispatchEvent(new CustomEvent('sajtem:ai-availability-changed'));
    toast.success(enabled ? 'Assistente ativado no site.' : 'Assistente desativado no site.');
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-xl"><Bot className="h-5 w-5" /> Disponibilidade da IA</CardTitle>
          {!loading && !unavailable && <Badge variant={savedEnabled ? 'default' : 'secondary'}>{savedEnabled ? 'Ativa no site' : 'Desativada'}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando estado da IA...</p>
        ) : unavailable ? (
          <p role="alert" className="text-sm text-destructive">Não foi possível carregar esta configuração. Confirme o MFA da conta administradora.</p>
        ) : <>
          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <Label htmlFor="admin-ai-enabled" className="text-base font-semibold">Mostrar e permitir o assistente</Label>
              <p className="mt-1 text-sm text-muted-foreground">Quando desligado, o botão da IA desaparece do site e novas conversas são bloqueadas no servidor.</p>
            </div>
            <Switch id="admin-ai-enabled" checked={enabled} onCheckedChange={setEnabled} aria-label="Ativar ou desativar a IA no site" />
          </div>
          <Button onClick={() => void save()} disabled={saving || enabled === savedEnabled}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar estado da IA'}
          </Button>
        </>}
      </CardContent>
    </Card>
  );
}
