import { useCallback, useEffect, useMemo, useState } from 'react';
import { HeartHandshake, Plus, ShieldCheck, Sparkles, MessageCircle, Flag, Loader2, Send, EyeOff, Heart, Dumbbell, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Post = { id:string; categoria:string; sexo:string; idade:number; faixa_etaria:string; conteudo:string; permitir_comentarios:boolean; conteudo_sensivel:boolean; destaque:boolean; publicacao_sistema:boolean; criado_em:string };
type Comment = { id:string; postagem_id:string; conteudo:string; criado_em:string };
type Reaction = { id:string; postagem_id:string; tipo:string };

const categories: Record<string,string> = { desabafo:'Desabafo', relacionamentos:'Relacionamentos', familia:'Família', trabalho:'Trabalho', saude_emocional:'Saúde emocional', conselhos:'Conselhos', gratidao:'Gratidão', superacao:'Superação' };
const sexLabels: Record<string,string> = { masculino:'Masculino', feminino:'Feminino', nao_binario:'Não binário' };
const reactions = [{type:'apoio',label:'Apoio',icon:Heart},{type:'forca',label:'Força',icon:Dumbbell},{type:'identificacao',label:'Me identifico',icon:Users}];

export default function EntreNos() {
  const { user } = useAuth();
  const [posts,setPosts] = useState<Post[]>([]); const [comments,setComments] = useState<Comment[]>([]); const [reactionRows,setReactionRows] = useState<Reaction[]>([]);
  const [loading,setLoading] = useState(true); const [composer,setComposer] = useState(false); const [authOpen,setAuthOpen] = useState(false);
  const [category,setCategory] = useState('desabafo'); const [sex,setSex] = useState(''); const [age,setAge] = useState(''); const [content,setContent] = useState('');
  const [allowComments,setAllowComments] = useState(true); const [sensitive,setSensitive] = useState(false); const [saving,setSaving] = useState(false);
  const [revealed,setRevealed] = useState<Set<string>>(new Set()); const [openComments,setOpenComments] = useState<string|null>(null); const [commentText,setCommentText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [p,r,c] = await Promise.all([
      supabase.from('entre_nos_postagens' as any).select('id,categoria,sexo,idade,faixa_etaria,conteudo,permitir_comentarios,conteudo_sensivel,destaque,publicacao_sistema,criado_em').eq('status','aprovado').order('destaque',{ascending:false}).order('criado_em',{ascending:false}).limit(60),
      supabase.from('entre_nos_reacoes' as any).select('id,postagem_id,tipo'),
      supabase.from('entre_nos_comentarios' as any).select('id,postagem_id,conteudo,criado_em').eq('status','aprovado').order('criado_em',{ascending:true})
    ]);
    if (p.error) toast.error('Não foi possível carregar o Entre Nós.');
    setPosts((p.data || []) as unknown as Post[]); setReactionRows((r.data || []) as unknown as Reaction[]); setComments((c.data || []) as unknown as Comment[]); setLoading(false);
  },[]);
  useEffect(()=>{ load(); },[load]);

  const counts = useMemo(()=>reactionRows.reduce<Record<string,Record<string,number>>>((a,r)=>{ a[r.postagem_id] ||= {}; a[r.postagem_id][r.tipo]=(a[r.postagem_id][r.tipo]||0)+1; return a; },{}),[reactionRows]);
  const requireUser = () => { if(!user){ setAuthOpen(true); return false; } return true; };

  const publish = async () => {
    if(!requireUser()) return;
    const numericAge=Number(age);
    if(!sex || numericAge<13 || numericAge>100 || content.trim().length<20){ toast.error('Informe sexo, idade válida e ao menos 20 caracteres.'); return; }
    setSaving(true);
    const {error}=await supabase.from('entre_nos_postagens' as any).insert({usuario_id:user!.id,categoria:category,sexo:sex,idade:numericAge,conteudo:content.trim(),permitir_comentarios:allowComments,conteudo_sensivel:sensitive});
    setSaving(false);
    if(error){ toast.error(error.message.includes('Limite')?error.message:'Não foi possível enviar agora.'); return; }
    toast.success('Enviado para moderação. Você será protegido pelo anonimato público.'); setComposer(false); setContent(''); setAge(''); setSex('');
  };
  const react = async (postId:string,type:string) => {
    if(!requireUser()) return;
    const { error: insertError } = await supabase
      .from('entre_nos_reacoes' as any)
      .insert({ postagem_id: postId, usuario_id: user!.id, tipo: type });

    // Uma pessoa pode ter somente uma reação por publicação. Caso já exista,
    // troca apenas o tipo; a RLS garante que somente a própria reação muda.
    if (insertError?.code === '23505') {
      const { error: updateError } = await supabase
        .from('entre_nos_reacoes' as any)
        .update({ tipo: type })
        .eq('postagem_id', postId);
      if (updateError) {
        toast.error('Não foi possível trocar sua reação.');
        return;
      }
    } else if (insertError) {
      toast.error('Não foi possível registrar sua reação.');
      return;
    }

    await load();
    toast.success('Reação registrada.');
  };
  const comment = async (postId:string) => {
    if(!requireUser() || commentText.trim().length<2) return;
    const {error}=await supabase.from('entre_nos_comentarios' as any).insert({postagem_id:postId,usuario_id:user!.id,conteudo:commentText.trim()});
    if(error) toast.error('Não foi possível comentar.'); else { toast.success('Comentário enviado para moderação.'); setCommentText(''); }
  };
  const report = async (postId:string) => {
    if(!requireUser()) return;
    const {error}=await supabase.from('entre_nos_denuncias' as any).insert({postagem_id:postId,denunciante_id:user!.id,motivo:'outro',detalhes:'Denúncia enviada pelo feed'});
    if (error) toast.error('Não foi possível denunciar.');
    else toast.success('Denúncia recebida. Obrigado por cuidar da comunidade.');
  };

  return <main className="min-h-screen bg-gradient-to-b from-primary/8 via-background to-background pb-28 lg:pb-10">
    <section className="mx-auto max-w-3xl px-4 pt-5 sm:pt-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-xl sm:p-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <Badge className="mb-4 gap-1.5 rounded-full"><ShieldCheck className="h-3.5 w-3.5"/> Comunidade protegida</Badge>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Entre Nós</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Um espaço seguro para desabafar, acolher e trocar experiências. Seu nome nunca aparece; apenas sexo e idade acompanham o relato.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-background/70 px-3 py-2">✓ Sem apelidos</span><span className="rounded-full bg-background/70 px-3 py-2">✓ Moderação humana</span><span className="rounded-full bg-background/70 px-3 py-2">✓ Denúncia protegida</span></div>
      </div>

      <div className="sticky top-16 z-20 -mx-4 mt-4 flex items-center justify-between border-y bg-background/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border">
        <div><p className="font-bold">Histórias da comunidade</p><p className="text-xs text-muted-foreground">Acolha sem julgar</p></div>
        <Dialog open={composer} onOpenChange={setComposer}><DialogTrigger asChild><Button className="h-11 rounded-full px-5" onClick={()=>requireUser()}><Plus className="mr-2 h-4 w-4"/> Publicar</Button></DialogTrigger>
          <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-t-[2rem] sm:max-w-xl sm:rounded-3xl">
            <DialogHeader><DialogTitle className="text-2xl">Compartilhe com segurança</DialogTitle></DialogHeader>
            <div className="rounded-2xl bg-primary/10 p-3 text-sm"><EyeOff className="mr-2 inline h-4 w-4"/>Seu nome e sua conta permanecem ocultos. Sexo e idade serão exibidos junto ao relato.</div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label>Sexo</Label><Select value={sex} onValueChange={setSex}><SelectTrigger className="mt-1.5 h-12"><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="feminino">Feminino</SelectItem><SelectItem value="nao_binario">Não binário</SelectItem></SelectContent></Select></div><div><Label htmlFor="age">Idade</Label><Input id="age" type="number" min={13} max={100} inputMode="numeric" value={age} onChange={e=>setAge(e.target.value)} className="mt-1.5 h-12" placeholder="Ex.: 28"/><p className="mt-1 text-[11px] text-muted-foreground">A idade informada aparecerá na publicação.</p></div></div>
            <div><Label>Assunto</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="mt-1.5 h-12"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(categories).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
            <div><div className="flex justify-between"><Label>Seu relato</Label><span className="text-xs text-muted-foreground">{content.length}/3000</span></div><Textarea value={content} onChange={e=>setContent(e.target.value.slice(0,3000))} className="mt-1.5 min-h-40 resize-none" placeholder="Escreva o que está sentindo..."/></div>
            <div className="space-y-3 rounded-2xl border p-4"><label className="flex items-center justify-between gap-4"><span><b className="text-sm">Permitir comentários</b><small className="block text-muted-foreground">As respostas também passam por moderação.</small></span><Switch checked={allowComments} onCheckedChange={setAllowComments}/></label><label className="flex items-center justify-between gap-4"><span><b className="text-sm">Conteúdo sensível</b><small className="block text-muted-foreground">Mostra um aviso antes da leitura.</small></span><Switch checked={sensitive} onCheckedChange={setSensitive}/></label></div>
            <Button className="h-12 w-full rounded-xl" disabled={saving} onClick={publish}>{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Send className="mr-2 h-4 w-4"/>}Enviar para moderação</Button>
          </DialogContent></Dialog>
      </div>

      <div className="mt-4 space-y-4">{loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> : posts.length===0 ? <Card className="rounded-3xl"><CardContent className="py-16 text-center"><Sparkles className="mx-auto mb-3 h-10 w-10 text-primary"/><h2 className="font-bold">Este espaço está começando</h2><p className="mt-1 text-sm text-muted-foreground">Seja a primeira pessoa a compartilhar uma história.</p></CardContent></Card> : posts.map(post=>{
        const hidden=post.conteudo_sensivel&&!revealed.has(post.id); const postComments=comments.filter(c=>c.postagem_id===post.id);
        return <article key={post.id} className="overflow-hidden rounded-[1.6rem] border bg-card shadow-sm transition hover:shadow-md">
          <div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/12">{post.publicacao_sistema?<Sparkles className="h-5 w-5 text-primary"/>:<HeartHandshake className="h-5 w-5 text-primary"/>}</div><div><div className="flex flex-wrap items-center gap-2"><b>{post.publicacao_sistema?'Comunidade Saj Tem':'Anônimo'}</b>{post.destaque&&<Badge variant="secondary">Destaque</Badge>}</div><p className="text-xs text-muted-foreground">{post.publicacao_sistema?'Conteúdo de acolhimento':`${sexLabels[post.sexo]} · ${post.idade} anos`} · {new Date(post.criado_em).toLocaleDateString('pt-BR')}</p></div></div>{!post.publicacao_sistema&&<Button variant="ghost" size="icon" aria-label="Denunciar" onClick={()=>report(post.id)}><Flag className="h-4 w-4"/></Button>}</div>
            <Badge variant="outline" className="mt-4 rounded-full">{categories[post.categoria]}</Badge>
            {hidden?<button onClick={()=>setRevealed(new Set([...revealed,post.id]))} className="mt-4 w-full rounded-2xl border border-dashed bg-muted/50 p-8 text-center"><EyeOff className="mx-auto mb-2 h-6 w-6"/><b className="block">Conteúdo sensível</b><span className="text-sm text-muted-foreground">Toque para visualizar</span></button>:<p className="mt-4 whitespace-pre-wrap text-[15px] leading-7">{post.conteudo}</p>}
          </div>
          <div className="flex flex-wrap gap-1 border-t bg-muted/20 px-3 py-2">{reactions.map(({type,label,icon:Icon})=><Button key={type} variant="ghost" size="sm" className="rounded-full" onClick={()=>react(post.id,type)}><Icon className="mr-1.5 h-4 w-4"/>{label} {counts[post.id]?.[type]||''}</Button>)}{post.permitir_comentarios&&<Button variant="ghost" size="sm" className="ml-auto rounded-full" onClick={()=>setOpenComments(openComments===post.id?null:post.id)}><MessageCircle className="mr-1.5 h-4 w-4"/>{postComments.length}</Button>}</div>
          {openComments===post.id&&<div className="space-y-3 border-t p-4">{postComments.map(c=><div key={c.id} className="rounded-2xl bg-muted/50 p-3"><b className="text-xs">Anônimo</b><p className="mt-1 text-sm leading-6">{c.conteudo}</p></div>)}<div className="flex gap-2"><Input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Escreva uma resposta acolhedora..."/><Button size="icon" onClick={()=>comment(post.id)}><Send className="h-4 w-4"/></Button></div><p className="text-[11px] text-muted-foreground">Seu comentário ficará visível após a moderação.</p></div>}
        </article>})}</div>
      <div className="mt-6 rounded-3xl border border-amber-500/20 bg-amber-500/8 p-5 text-sm leading-6"><b>Precisa de ajuda agora?</b><p className="text-muted-foreground">Este espaço não substitui atendimento profissional. Em crise emocional, ligue 188 (CVV). Em risco imediato, procure o serviço de emergência.</p></div>
    </section><AuthDialog open={authOpen} onOpenChange={setAuthOpen}/>
  </main>;
}
