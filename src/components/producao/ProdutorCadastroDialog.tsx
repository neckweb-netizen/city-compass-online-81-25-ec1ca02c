import { useMemo, useState } from 'react';
import { Loader2, Tractor } from 'lucide-react';
import { toast } from 'sonner';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const initialForm = {
  nome_publico: '',
  tipo: 'produtor_individual',
  descricao: '',
  comunidade: '',
  telefone_whatsapp: '',
  produtos: '',
  certificacoes: '',
  entrega: false,
  varejo: true,
  atacado: false,
  consentimento: false,
};

const listFromText = (value: string) => [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))].slice(0, 30);

export function ProdutorCadastroDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const valid = useMemo(() => form.nome_publico.trim().length >= 3 && listFromText(form.produtos).length > 0 && form.consentimento, [form]);

  const begin = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !valid || saving) return;
    setSaving(true);
    const { error } = await supabase.from('produtores_locais' as any).insert({
      usuario_id: user.id,
      nome_publico: form.nome_publico.trim(),
      tipo: form.tipo,
      descricao: form.descricao.trim() || null,
      comunidade: form.comunidade.trim() || null,
      telefone_whatsapp: form.telefone_whatsapp.replace(/\D/g, '') || null,
      produtos: listFromText(form.produtos),
      certificacoes: listFromText(form.certificacoes),
      entrega: form.entrega,
      varejo: form.varejo,
      atacado: form.atacado,
      consentimento_publicacao: form.consentimento,
      status: 'pendente',
    });
    setSaving(false);

    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Você já possui um cadastro de produtor em análise.' : 'Não foi possível enviar o cadastro.');
      return;
    }

    toast.success('Cadastro enviado para análise.');
    setForm(initialForm);
    setOpen(false);
  };

  return (
    <>
      <Button type="button" size="lg" onClick={begin} className="rounded-full">
        <Tractor className="mr-2 h-5 w-5" /> Sou produtor
      </Button>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Cadastrar produção local</DialogTitle>
            <DialogDescription>O perfil será publicado somente depois da análise administrativa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="nome-produtor">Nome público</Label><Input id="nome-produtor" maxLength={100} required value={form.nome_publico} onChange={e => setForm({ ...form, nome_publico: e.target.value })} placeholder="Nome da propriedade, associação ou produtor" /></div>
            <div className="space-y-2"><Label>Tipo de cadastro</Label><Select value={form.tipo} onValueChange={tipo => setForm({ ...form, tipo })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="produtor_individual">Produtor individual</SelectItem><SelectItem value="agricultura_familiar">Agricultura familiar</SelectItem><SelectItem value="associacao">Associação</SelectItem><SelectItem value="cooperativa">Cooperativa</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="produtos-produtor">O que você produz?</Label><Input id="produtos-produtor" maxLength={400} required value={form.produtos} onChange={e => setForm({ ...form, produtos: e.target.value })} placeholder="Ex.: mandioca, farinha, laranja, mel" /><p className="text-xs text-muted-foreground">Separe os produtos por vírgula.</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="comunidade-produtor">Comunidade ou região</Label><Input id="comunidade-produtor" maxLength={100} value={form.comunidade} onChange={e => setForm({ ...form, comunidade: e.target.value })} placeholder="Sem endereço exato" /></div><div className="space-y-2"><Label htmlFor="whatsapp-produtor">WhatsApp público</Label><Input id="whatsapp-produtor" inputMode="tel" maxLength={20} value={form.telefone_whatsapp} onChange={e => setForm({ ...form, telefone_whatsapp: e.target.value })} placeholder="75 99999-9999" /></div></div>
            <div className="space-y-2"><Label htmlFor="certificacoes-produtor">Certificações</Label><Input id="certificacoes-produtor" maxLength={250} value={form.certificacoes} onChange={e => setForm({ ...form, certificacoes: e.target.value })} placeholder="Ex.: orgânico, CAF ativo" /></div>
            <div className="space-y-2"><Label htmlFor="descricao-produtor">Apresentação</Label><Textarea id="descricao-produtor" maxLength={700} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Conte um pouco sobre sua produção e período de safra." /></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {([['varejo', 'Venda no varejo'], ['atacado', 'Venda no atacado'], ['entrega', 'Faz entrega']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><Checkbox checked={form[key]} onCheckedChange={checked => setForm({ ...form, [key]: checked === true })} />{label}</label>)}
            </div>
            <label className="flex items-start gap-3 rounded-xl bg-muted p-3 text-sm"><Checkbox className="mt-0.5" checked={form.consentimento} onCheckedChange={checked => setForm({ ...form, consentimento: checked === true })} /><span>Autorizo a publicação dessas informações no SAJ TEM. Não informei endereço residencial exato nem dados pessoais sensíveis.</span></label>
            <Button type="submit" className="w-full" disabled={!valid || saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? 'Enviando...' : 'Enviar para análise'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
