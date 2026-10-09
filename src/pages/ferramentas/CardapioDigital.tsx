import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Copy, ExternalLink, ImageIcon, Loader2, Megaphone, Pencil, Plus, Save, Store, Trash2, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { CardapioItem } from '@/features/cardapio/types';
import { slugifyCardapio } from '@/features/cardapio/types';
import { useAuth } from '@/hooks/useAuth';
import { useCardapioPlanUsage, useMyCardapios } from '@/hooks/useCardapioDigital';
import { supabase } from '@/integrations/supabase/client';

const NEW_CARDAPIO = 'novo';
const emptyMenu = { nome: '', slug: '', descricao: '', logo_url: '', capa_url: '', whatsapp: '', endereco: '', instagram: '', cor_primaria: '#7c3aed', aceita_pedidos: true, ativo: true };
const emptyItem = { nome: '', categoria: 'Pratos principais', descricao: '', preco: '', imagem_url: '', disponivel: true, destaque: false };
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const parseMoney = (value: string) => Number(value.replace(',', '.')) || 0;

export default function CardapioDigital() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const menusQuery = useMyCardapios(user?.id);
  const planQuery = useCardapioPlanUsage(user?.id);
  const cardapios = useMemo(() => menusQuery.data ?? [], [menusQuery.data]);
  const [selectedCardapioId, setSelectedCardapioId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuForm, setMenuForm] = useState(emptyMenu);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!menusQuery.isSuccess || selectedCardapioId) return;
    setSelectedCardapioId(cardapios[0]?.id ?? NEW_CARDAPIO);
  }, [cardapios, menusQuery.isSuccess, selectedCardapioId]);

  const cardapio = selectedCardapioId === NEW_CARDAPIO ? null : cardapios.find(item => item.id === selectedCardapioId) ?? null;

  useEffect(() => {
    if (selectedCardapioId === NEW_CARDAPIO) {
      setMenuForm(emptyMenu);
      setItemForm(emptyItem);
      setEditingItemId(null);
      return;
    }
    if (!cardapio) return;
    setMenuForm({
      nome: cardapio.nome,
      slug: cardapio.slug,
      descricao: cardapio.descricao ?? '',
      logo_url: cardapio.logo_url ?? '',
      capa_url: cardapio.capa_url ?? '',
      whatsapp: cardapio.whatsapp ?? '',
      endereco: cardapio.endereco ?? '',
      instagram: cardapio.instagram ?? '',
      cor_primaria: cardapio.cor_primaria,
      aceita_pedidos: cardapio.aceita_pedidos,
      ativo: cardapio.ativo,
    });
    setItemForm(emptyItem);
    setEditingItemId(null);
  }, [cardapio, selectedCardapioId]);

  const items = useMemo(() => [...(cardapio?.cardapio_itens ?? [])].sort((a, b) => a.ordem - b.ordem), [cardapio?.cardapio_itens]);
  const publicUrl = cardapio ? `${window.location.origin}/cardapio/${cardapio.slug}` : '';
  const planUsage = planQuery.data;
  const planLimit = planUsage?.limite_cardapios ?? 1;
  const canCreate = planLimit === -1 || cardapios.length < planLimit;
  const formattedLimit = planLimit === -1 ? 'Ilimitado' : String(planLimit);

  const startNewCardapio = () => {
    if (!canCreate) {
      toast.error(`Seu plano ${planUsage?.plano_nome ?? 'atual'} permite ${formattedLimit} cardápio(s).`);
      return;
    }
    setSelectedCardapioId(NEW_CARDAPIO);
  };

  const saveMenu = async (event?: { preventDefault(): void }) => {
    event?.preventDefault();
    if (!user) return setAuthOpen(true);
    if (!cardapio && !canCreate) return startNewCardapio();
    const slug = slugifyCardapio(menuForm.slug || menuForm.nome);
    if (menuForm.nome.trim().length < 2) return toast.error('Informe o nome do estabelecimento.');
    if (slug.length < 3) return toast.error('Crie um endereço com pelo menos 3 caracteres.');

    setSaving(true);
    const payload = {
      user_id: user.id,
      nome: menuForm.nome.trim(),
      slug,
      descricao: menuForm.descricao.trim() || null,
      logo_url: menuForm.logo_url || null,
      capa_url: menuForm.capa_url || null,
      whatsapp: menuForm.whatsapp.replace(/\D/g, '') || null,
      endereco: menuForm.endereco.trim() || null,
      instagram: menuForm.instagram.trim().replace(/^@/, '') || null,
      cor_primaria: menuForm.cor_primaria,
      aceita_pedidos: menuForm.aceita_pedidos,
      ativo: menuForm.ativo,
    };
    const result = cardapio
      ? await supabase.from('cardapios' as any).update(payload).eq('id', cardapio.id).select('id').single()
      : await supabase.from('cardapios' as any).insert(payload).select('id').single();
    setSaving(false);

    if (result.error) {
      if (result.error.code === '23505') return toast.error('Esse endereço já está em uso. Escolha outro.');
      if (result.error.message.includes('cardapio_plan_limit_reached')) {
        await planQuery.refetch();
        return toast.error('O limite de cardápios do seu plano foi atingido.');
      }
      return toast.error('Não foi possível salvar o cardápio.');
    }

    const savedId = (result.data as { id?: string } | null)?.id;
    setMenuForm(current => ({ ...current, slug }));
    await Promise.all([menusQuery.refetch(), planQuery.refetch()]);
    if (savedId) setSelectedCardapioId(savedId);
    toast.success(cardapio ? 'Cardápio atualizado.' : 'Cardápio criado com sucesso.');
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!cardapio) return toast.error('Salve primeiro os dados do estabelecimento.');
    if (itemForm.nome.trim().length < 2) return toast.error('Informe o nome do item.');
    const wasEditing = Boolean(editingItemId);
    const payload = {
      cardapio_id: cardapio.id,
      nome: itemForm.nome.trim(),
      categoria: itemForm.categoria.trim() || 'Geral',
      descricao: itemForm.descricao.trim() || null,
      preco: parseMoney(itemForm.preco),
      imagem_url: itemForm.imagem_url || null,
      disponivel: itemForm.disponivel,
      destaque: itemForm.destaque,
      ordem: editingItemId ? items.find(item => item.id === editingItemId)?.ordem ?? 1 : items.length + 1,
    };
    setSaving(true);
    const result = editingItemId
      ? await supabase.from('cardapio_itens' as any).update(payload).eq('id', editingItemId)
      : await supabase.from('cardapio_itens' as any).insert(payload);
    setSaving(false);
    if (result.error) return toast.error('Não foi possível salvar o item.');
    setEditingItemId(null);
    setItemForm(emptyItem);
    await menusQuery.refetch();
    toast.success(wasEditing ? 'Item atualizado.' : 'Item adicionado.');
  };

  const editItem = (item: CardapioItem) => {
    setEditingItemId(item.id);
    setItemForm({ nome: item.nome, categoria: item.categoria, descricao: item.descricao ?? '', preco: String(item.preco).replace('.', ','), imagem_url: item.imagem_url ?? '', disponivel: item.disponivel, destaque: item.destaque });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (item: CardapioItem) => {
    if (!window.confirm(`Excluir “${item.nome}” do cardápio?`)) return;
    const { error } = await supabase.from('cardapio_itens' as any).delete().eq('id', item.id);
    if (error) return toast.error('Não foi possível excluir o item.');
    await menusQuery.refetch();
    toast.success('Item excluído.');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast.success('Link do cardápio copiado.');
  };

  if (authLoading) return <Loading />;

  if (!user) return <div className="min-h-screen bg-gradient-to-b from-violet-950 via-slate-950 to-background px-4 py-12 text-white"><div className="mx-auto max-w-4xl text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white/10"><UtensilsCrossed className="h-10 w-10 text-violet-300" /></div><Badge className="mt-6 bg-violet-500/20 text-violet-200">Ferramenta gratuita</Badge><h1 className="mt-4 text-4xl font-black sm:text-6xl">Seu cardápio digital, bonito e pronto para vender</h1><p className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">Crie seu perfil, publique produtos, receba pedidos pelo WhatsApp e compartilhe um único link com seus clientes.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Button size="lg" onClick={() => setAuthOpen(true)} className="bg-violet-600 hover:bg-violet-700"><Store className="mr-2 h-5 w-5" />Entrar para criar</Button><Button size="lg" variant="outline" onClick={() => navigate('/ferramentas')} className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"><ArrowLeft className="mr-2 h-5 w-5" />Ver ferramentas</Button></div></div><AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" /></div>;

  if (menusQuery.isLoading || planQuery.isLoading || !selectedCardapioId) return <Loading />;

  return <div className="min-h-screen bg-muted/20 px-3 pb-24 pt-4 sm:px-6 sm:py-8"><div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" onClick={() => navigate('/ferramentas')}><ArrowLeft className="mr-2 h-4 w-4" />Ferramentas</Button>{cardapio && <div className="flex gap-2"><Button variant="outline" onClick={() => void copyLink()}><Copy className="mr-2 h-4 w-4" />Copiar link</Button><Button asChild style={{ backgroundColor: cardapio.cor_primaria }}><Link to={`/cardapio/${cardapio.slug}`} target="_blank"><ExternalLink className="mr-2 h-4 w-4" />Ver publicado</Link></Button></div>}</div>
    <header className="rounded-3xl bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-800 p-6 text-white shadow-xl sm:p-9"><div className="flex flex-wrap items-center gap-2"><Badge className="bg-white/15 text-white">Cardápio Digital SAJ TEM</Badge><Badge className="bg-emerald-400/20 text-emerald-100">{planUsage?.plano_nome ?? 'Plano Gratuito'} · {cardapios.length}/{formattedLimit}</Badge></div><h1 className="mt-3 text-3xl font-black sm:text-4xl">Crie, edite e compartilhe</h1><p className="mt-2 max-w-2xl text-sm text-violet-100">Personalize seus cardápios, organize produtos por categoria e atualize tudo quando quiser.</p></header>

    <Card><CardContent className="p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-black">Seus cardápios</p><p className="text-xs text-muted-foreground">Selecione um cardápio para editar. O limite é controlado pelo seu plano.</p></div><Button size="sm" onClick={startNewCardapio} disabled={!canCreate}><Plus className="mr-2 h-4 w-4" />Novo cardápio</Button></div><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{cardapios.map(menu => <Button key={menu.id} type="button" variant={selectedCardapioId === menu.id ? 'default' : 'outline'} className="shrink-0" onClick={() => setSelectedCardapioId(menu.id)}><Store className="mr-2 h-4 w-4" />{menu.nome}</Button>)}{selectedCardapioId === NEW_CARDAPIO && <Button type="button" className="shrink-0" variant="secondary"><Plus className="mr-2 h-4 w-4" />Novo cardápio</Button>}</div>{!canCreate && <Alert className="mt-3"><Store className="h-4 w-4" /><AlertTitle>Limite do plano atingido</AlertTitle><AlertDescription>Você continua podendo editar seus cardápios. Para criar outro, altere o limite do plano ou atribua um plano superior à conta no painel administrativo.</AlertDescription></Alert>}</CardContent></Card>
    <ToolBanner secao="cardapio_digital" />

    <Tabs defaultValue="identidade" className="space-y-5"><TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl p-1"><TabsTrigger value="identidade">1. Identidade</TabsTrigger><TabsTrigger value="itens" disabled={!cardapio}>2. Produtos ({items.length})</TabsTrigger><TabsTrigger value="publicar" disabled={!cardapio}>3. Publicar</TabsTrigger></TabsList>
      <TabsContent value="identidade"><IdentityForm cardapioExists={Boolean(cardapio)} form={menuForm} setForm={setMenuForm} onSubmit={saveMenu} saving={saving} /></TabsContent>
      <TabsContent value="itens" className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><ItemForm form={itemForm} setForm={setItemForm} onSubmit={saveItem} saving={saving} editing={Boolean(editingItemId)} onCancel={() => { setEditingItemId(null); setItemForm(emptyItem); }} /><div className="space-y-3">{items.length === 0 ? <Card><CardContent className="py-16 text-center"><ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" /><h3 className="mt-3 font-black">Seu cardápio ainda está vazio</h3><p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro item usando o formulário.</p></CardContent></Card> : items.map(item => <Card key={item.id} className={!item.disponivel ? 'opacity-60' : ''}><CardContent className="flex gap-3 p-4">{item.imagem_url ? <img src={item.imagem_url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-muted"><UtensilsCrossed className="h-6 w-6 text-muted-foreground" /></div>}<div className="min-w-0 flex-1"><div className="flex flex-wrap gap-1"><Badge variant="outline">{item.categoria}</Badge>{item.destaque && <Badge>Destaque</Badge>}{!item.disponivel && <Badge variant="secondary">Indisponível</Badge>}</div><h3 className="mt-1 truncate font-black">{item.nome}</h3><p className="font-bold" style={{ color: menuForm.cor_primaria }}>{money.format(Number(item.preco))}</p></div><div className="flex shrink-0 flex-col"><Button type="button" size="icon" variant="ghost" onClick={() => editItem(item)} aria-label={`Editar ${item.nome}`}><Pencil className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" onClick={() => void deleteItem(item)} aria-label={`Excluir ${item.nome}`}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardContent></Card>)}</div></TabsContent>
      <TabsContent value="publicar" className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Publicação</CardTitle><CardDescription>Controle quando o perfil pode ser encontrado pelo link.</CardDescription></CardHeader><CardContent className="space-y-4"><ToggleRow title="Cardápio publicado" description="Quando desativado, somente você consegue visualizá-lo no editor." checked={menuForm.ativo} onChange={ativo => setMenuForm(current => ({ ...current, ativo }))} /><ToggleRow title="Aceitar pedidos no WhatsApp" description="Mostra o carrinho e o botão para enviar o pedido." checked={menuForm.aceita_pedidos} onChange={aceita_pedidos => setMenuForm(current => ({ ...current, aceita_pedidos }))} /><Button className="w-full" onClick={event => void saveMenu(event)} disabled={saving}><Save className="mr-2 h-4 w-4" />Salvar publicação</Button></CardContent></Card><Card><CardHeader><CardTitle>Seu link público</CardTitle></CardHeader><CardContent className="space-y-4"><div className="break-all rounded-2xl bg-muted p-4 text-sm font-medium">{publicUrl}</div><div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => void copyLink()}><Copy className="mr-2 h-4 w-4" />Copiar link</Button><Button asChild style={{ backgroundColor: menuForm.cor_primaria }}><Link to={`/cardapio/${cardapio?.slug}`} target="_blank"><ExternalLink className="mr-2 h-4 w-4" />Abrir cardápio</Link></Button></div><Alert><Megaphone className="h-4 w-4" /><AlertTitle>Publicidade integrada</AlertTitle><AlertDescription>Os banners exibidos no perfil são administrados pelo SAJ TEM na seção “Cardápio Digital” do painel de Banners.</AlertDescription></Alert></CardContent></Card></TabsContent>
    </Tabs>
  </div></div>;
}

type MenuForm = typeof emptyMenu;
type ItemFormState = typeof emptyItem;

function Loading() {
  return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>;
}

function IdentityForm({ cardapioExists, form, setForm, onSubmit, saving }: { cardapioExists: boolean; form: MenuForm; setForm: Dispatch<SetStateAction<MenuForm>>; onSubmit: (event: FormEvent) => void; saving: boolean }) {
  return <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]"><Card><CardHeader><CardTitle>Dados do estabelecimento</CardTitle><CardDescription>Essas informações aparecerão no perfil público.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="menu-name">Nome *</Label><Input id="menu-name" value={form.nome} onChange={event => setForm(current => ({ ...current, nome: event.target.value, slug: cardapioExists ? current.slug : slugifyCardapio(event.target.value) }))} maxLength={100} placeholder="Ex.: Sabor da Praça" /></div><div className="space-y-2"><Label htmlFor="menu-slug">Endereço do cardápio *</Label><div className="flex items-center rounded-md border bg-background pl-3 text-xs text-muted-foreground"><span className="hidden sm:inline">/cardapio/</span><Input id="menu-slug" value={form.slug} onChange={event => setForm(current => ({ ...current, slug: slugifyCardapio(event.target.value) }))} className="border-0 shadow-none focus-visible:ring-0" maxLength={80} /></div></div></div><div className="space-y-2"><Label htmlFor="menu-description">Descrição</Label><Textarea id="menu-description" value={form.descricao} onChange={event => setForm(current => ({ ...current, descricao: event.target.value }))} maxLength={600} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="menu-whatsapp">WhatsApp para pedidos</Label><Input id="menu-whatsapp" value={form.whatsapp} onChange={event => setForm(current => ({ ...current, whatsapp: event.target.value }))} placeholder="(75) 99999-9999" /></div><div className="space-y-2"><Label htmlFor="menu-instagram">Instagram</Label><Input id="menu-instagram" value={form.instagram} onChange={event => setForm(current => ({ ...current, instagram: event.target.value }))} placeholder="@seunegocio" /></div></div><div className="space-y-2"><Label htmlFor="menu-address">Endereço</Label><Input id="menu-address" value={form.endereco} onChange={event => setForm(current => ({ ...current, endereco: event.target.value }))} maxLength={300} /></div><div className="space-y-2"><Label htmlFor="menu-color">Cor principal</Label><div className="flex gap-2"><Input id="menu-color" type="color" value={form.cor_primaria} onChange={event => setForm(current => ({ ...current, cor_primaria: event.target.value }))} className="h-11 w-20 p-1" /><Input value={form.cor_primaria} onChange={event => /^#[0-9a-fA-F]{0,6}$/.test(event.target.value) && setForm(current => ({ ...current, cor_primaria: event.target.value }))} maxLength={7} /></div></div></CardContent></Card><div className="space-y-5"><Card><CardHeader><CardTitle>Identidade visual</CardTitle></CardHeader><CardContent className="space-y-5"><div><Label>Logo</Label><ImageUpload value={form.logo_url} onChange={logo_url => setForm(current => ({ ...current, logo_url }))} onRemove={() => setForm(current => ({ ...current, logo_url: '' }))} bucket="imagens" folder="cardapios/logo" maxSize={3} /></div><div><Label>Imagem de capa</Label><ImageUpload value={form.capa_url} onChange={capa_url => setForm(current => ({ ...current, capa_url }))} onRemove={() => setForm(current => ({ ...current, capa_url: '' }))} bucket="imagens" folder="cardapios/capa" maxSize={5} /></div></CardContent></Card><Button type="submit" size="lg" className="w-full" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{cardapioExists ? 'Salvar alterações' : 'Criar meu cardápio'}</Button></div></form>;
}

function ItemForm({ form, setForm, onSubmit, saving, editing, onCancel }: { form: ItemFormState; setForm: Dispatch<SetStateAction<ItemFormState>>; onSubmit: (event: FormEvent) => void; saving: boolean; editing: boolean; onCancel: () => void }) {
  return <form onSubmit={onSubmit}><Card><CardHeader><CardTitle>{editing ? 'Editar item' : 'Novo item'}</CardTitle><CardDescription>Cadastre produtos, pratos, bebidas ou serviços.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="item-name">Nome *</Label><Input id="item-name" value={form.nome} onChange={event => setForm(current => ({ ...current, nome: event.target.value }))} maxLength={120} /></div><div className="space-y-2"><Label htmlFor="item-category">Categoria *</Label><Input id="item-category" value={form.categoria} onChange={event => setForm(current => ({ ...current, categoria: event.target.value }))} maxLength={60} placeholder="Ex.: Bebidas" /></div></div><div className="space-y-2"><Label htmlFor="item-description">Descrição</Label><Textarea id="item-description" value={form.descricao} onChange={event => setForm(current => ({ ...current, descricao: event.target.value }))} maxLength={500} /></div><div className="space-y-2"><Label htmlFor="item-price">Preço *</Label><Input id="item-price" inputMode="decimal" value={form.preco} onChange={event => setForm(current => ({ ...current, preco: event.target.value }))} placeholder="Ex.: 29,90" /></div><div><Label>Foto do item</Label><ImageUpload value={form.imagem_url} onChange={imagem_url => setForm(current => ({ ...current, imagem_url }))} onRemove={() => setForm(current => ({ ...current, imagem_url: '' }))} bucket="imagens" folder="cardapios/itens" maxSize={4} /></div><div className="grid gap-3 sm:grid-cols-2"><ToggleRow title="Disponível" checked={form.disponivel} onChange={disponivel => setForm(current => ({ ...current, disponivel }))} /><ToggleRow title="Destaque" checked={form.destaque} onChange={destaque => setForm(current => ({ ...current, destaque }))} /></div><div className="flex gap-2"><Button type="submit" className="flex-1" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editing ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{editing ? 'Atualizar' : 'Adicionar'}</Button>{editing && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}</div></CardContent></Card></form>;
}

function ToggleRow({ title, description, checked, onChange }: { title: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <Label className="flex items-center justify-between gap-3 rounded-xl border p-3"><span><span className="block font-black">{title}</span>{description && <span className="text-xs font-normal text-muted-foreground">{description}</span>}</span><Switch checked={checked} onCheckedChange={onChange} /></Label>;
}
