import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type Article = {
  id: string;
  title: string;
  answer: string;
  keywords: string[];
  sourceUrl: string | null;
  active: boolean;
  updatedAt: string;
};

type Draft = Omit<Article, 'keywords' | 'sourceUrl' | 'updatedAt'> & { keywords: string; sourceUrl: string };
const emptyDraft = (): Draft => ({ id: crypto.randomUUID(), title: '', answer: '', keywords: '', sourceUrl: '', active: true });

export function AiKnowledgeControls() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [etag, setEtag] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: requestError } = await supabase.functions.invoke('assistente-ia', { body: { action: 'knowledge_read' } });
    setLoading(false);
    if (requestError || !Array.isArray(data?.articles)) {
      setError(true);
      return;
    }
    setError(false);
    setArticles(data.articles as Article[]);
    setEtag(typeof data.etag === 'string' ? data.etag : null);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function edit(article: Article) {
    setDraft({ ...article, keywords: article.keywords.join(', '), sourceUrl: article.sourceUrl || '' });
  }

  async function save() {
    const keywords = draft.keywords.split(',').map(value => value.trim()).filter(Boolean);
    if (!draft.title.trim() || !draft.answer.trim() || draft.title.length > 120 || draft.answer.length > 3500 || keywords.length > 12) {
      return toast.error('Preencha título e resposta; respeite os limites indicados.');
    }
    setSaving(true);
    const { data, error: requestError } = await supabase.functions.invoke('assistente-ia', {
      body: { action: 'knowledge_save', etag, article: {
        id: draft.id, title: draft.title.trim(), answer: draft.answer.trim(), keywords,
        sourceUrl: draft.sourceUrl.trim() || null, active: draft.active,
      } },
    });
    setSaving(false);
    if (requestError || !Array.isArray(data?.articles)) {
      toast.error('Não foi possível salvar no R2. Confira o MFA, a permissão de escrita e atualize a lista.');
      return;
    }
    setArticles(data.articles as Article[]);
    setEtag(typeof data.etag === 'string' ? data.etag : null);
    setDraft(emptyDraft());
    toast.success('Artigo salvo na base privada da IA.');
  }

  return (
    <Card className="min-w-0 border-primary/30">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">Base de conhecimento da IA</CardTitle>
        <p className="text-sm text-muted-foreground">Textos revisados ficam no bucket privado R2. O assistente só os utiliza quando não encontra uma empresa correspondente; regras de plano e dados atuais de empresas continuam no banco.</p>
      </CardHeader>
      <CardContent className="space-y-5 px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={loading} onClick={() => void load()}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando</> : 'Atualizar artigos'}</Button>
          <Button variant="outline" onClick={() => setDraft(emptyDraft())}><Plus className="mr-2 h-4 w-4" /> Novo artigo</Button>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">Não foi possível ler a base. Confirme o MFA e o acesso ao R2.</p>}
        {!loading && !error && <p className="text-sm text-muted-foreground">{articles.length} artigo(s) cadastrado(s). Até 200 artigos e 1 MB neste índice inicial.</p>}
        {articles.length > 0 && <div className="grid gap-2 sm:grid-cols-2">
          {articles.map(article => <button key={article.id} type="button" onClick={() => edit(article)}
            className={`min-w-0 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${draft.id === article.id ? 'border-primary' : ''}`}>
            <span className="block truncate font-medium">{article.title}</span>
            <span className="text-xs text-muted-foreground">{article.active ? 'Ativo' : 'Desativado'} · Atualizado em {new Date(article.updatedAt).toLocaleDateString('pt-BR')}</span>
          </button>)}
        </div>}
        <div className="space-y-3 border-t pt-5">
          <h3 className="font-semibold">{articles.some(article => article.id === draft.id) ? 'Editar artigo' : 'Novo artigo'}</h3>
          <p className="text-xs text-muted-foreground">Cadastre informações sobre o site, ferramentas e orientações verificadas. Não copie preços, horários ou promoções de empresas para cá: esses dados mudam e têm regras próprias.</p>
          <div className="space-y-1"><Label htmlFor="ai-knowledge-title">Título ou pergunta</Label><Input id="ai-knowledge-title" maxLength={120} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Ex.: Como funciona o cartão fidelidade?" /></div>
          <div className="space-y-1"><Label htmlFor="ai-knowledge-keywords">Palavras-chave, separadas por vírgula</Label><Input id="ai-knowledge-keywords" value={draft.keywords} onChange={event => setDraft({ ...draft, keywords: event.target.value })} placeholder="fidelidade, carimbos, prêmios" /><p className="text-xs text-muted-foreground">Até 12 termos; ajudam a encontrar a resposta.</p></div>
          <div className="space-y-1"><Label htmlFor="ai-knowledge-answer">Resposta revisada</Label><Textarea id="ai-knowledge-answer" className="min-h-36" maxLength={3500} value={draft.answer} onChange={event => setDraft({ ...draft, answer: event.target.value })} placeholder="Explique com clareza, sem prometer funções ou dados que não existem." /><p className="text-xs text-muted-foreground">{draft.answer.length}/3500 caracteres</p></div>
          <div className="space-y-1"><Label htmlFor="ai-knowledge-source">Link da fonte (opcional)</Label><Input id="ai-knowledge-source" value={draft.sourceUrl} onChange={event => setDraft({ ...draft, sourceUrl: event.target.value })} placeholder="/ferramentas ou https://..." /></div>
          <div className="flex items-center gap-3"><Switch id="ai-knowledge-active" checked={draft.active} onCheckedChange={active => setDraft({ ...draft, active })} /><Label htmlFor="ai-knowledge-active">Artigo ativo para respostas</Label></div>
          <Button disabled={saving || loading || error} onClick={() => void save()}>{saving ? 'Salvando...' : 'Salvar artigo no R2'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
