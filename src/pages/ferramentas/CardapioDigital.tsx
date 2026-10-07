import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import { useMyCardapio } from '@/hooks/useCardapioDigital';
import { supabase } from '@/integrations/supabase/client';

const emptyMenu = { nome: '', slug: '', descricao: '', logo_url: '', capa_url: '', whatsapp: '', endereco: '', instagram: '', cor_primaria: '#7c3aed', aceita_pedidos: true, ativo: true };
const emptyItem = { nome: '', categoria: 'Pratos principais', descricao: '', preco: '', imagem_url: '', disponivel: true, destaque: false };
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const parseMoney = (value: string) => Number(value.replace(',', '.')) || 0;

export default function CardapioDigital() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const query = useMyCardapio(user?.id);
  const cardapio = query.data;
  const [authOpen, setAuthOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuForm, setMenuForm] = useState(emptyMenu);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
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
  }, [cardapio]);

  const items = useMemo(() => [...(cardapio?.cardapio_itens ?? [])].sort((a, b) => a.ordem - b.ordem), [cardapio?.cardapio_itens]);
  const publicUrl = cardapio ? `${window.location.origin}/cardapio/${cardapio.slug}` : '';

  const saveMenu = async (event?: { preventDefault(): void }) => {
    event?.preventDefault();
    if (!user) return setAuthOpen(true);
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
      ? await supabase.from('cardapios' as any).update(payload).eq('id', cardapio.id)
      : await supabase.from('cardapios' as any).insert(payload);
    setSaving(false);
    if (result.error) {
      if (result.error.code === '23505') return toast.error('Esse endereço já está em uso. Escolha outro.');
      return toast.error('Não foi possível salvar o cardápio.');
    }
    setMenuForm(current => ({ ...current, slug }));
    await query.refetch();
    toast.success(cardapio ? 'Cardápio atualizado.' : 'Cardápio criado com sucesso.');
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!cardapio) return toast.error('Salve primeiro os dados do estabelecimento.');
    if (itemForm.nome.trim().length < 2) return toast.error('Informe o nome do item.');
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
    await query.refetch();
    toast.success(editingItemId ? 'Item atualizado.' : 'Item adicionado.');
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
    await query.refetch();
    toast.success('Item excluído.');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast.success('Link do cardápio copiado.');
  };

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  if (!user) return <div className="min-h-screen bg-gradient-to-b from-violet-950 via-slate-950 to-background px-4 py-12 text-white"><div className="mx-auto max-w-4xl text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white/10"><UtensilsCrossed className="h-10 w-10 text-violet-300" /></div><Badge className="mt-6 bg-violet-500/20 text-violet-200">Ferramenta gratuita</Badge><h1 className="mt-4 text-4xl font-black sm:text-6xl">Seu cardápio digital, bonito e pronto para vender</h1><p className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">Crie seu perfil, publique produtos, receba pedidos pelo WhatsApp e compartilhe um único link com seus clientes.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Button size="lg" onClick={() => setAuthOpen(true)} className="bg-violet-600 hover:bg-violet-700"><Store className="mr-2 h-5 w-5" />Entrar para criar</Button><Button size="lg" variant="outline" onClick={() => navigate('/ferramentas')} className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"><ArrowLeft className="mr-2 h-5 w-5" />Ver ferramentas</Button></div></div><AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" /></div>;

  return <div className="min-h-screen bg-muted/20 px-3 pb-24 pt-4 sm:px-6 sm:py-8"><div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" onClick={() => navigate('/ferramentas')}><ArrowLeft className="mr-2 h-4 w-4" />Ferramentas</Button>{cardapio && <div className="flex gap-2"><Button variant="outline" onClick={() => void copyLink()}><Copy className="mr-2 h-4 w-4" />Copiar link</Button><Button asChild style={{ backgroundColor: cardapio.cor_primaria }}><Link to={`/cardapio/${cardapio.slug}`} target="_blank"><ExternalLink className="mr-2 h-4 w-4" />Ver publicado</Link></Button></div>}</div>
    <header className="rounded-3xl bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-800 p-6 text-white shadow-xl sm:p-9"><Badge className="bg-white/15 text-white">Cardápio Digital SAJ TEM</Badge><h1 className="mt-3 text-3xl font-black sm:text-4xl">Crie, publique e compartilhe</h1><p className="mt-2 max-w-2xl text-sm text-violet-100">Personalize o perfil do seu negócio, organize produtos por categoria e atualize tudo quando quiser.</p></header>
    <ToolBanner secao="cardapio_digital" />

    <Tabs defaultValue="identidade" className="space-y-5"><TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl p-1"><TabsTrigger value="identidade">1. Identidade</TabsTrigger><TabsTrigger value="itens" disabled={!cardapio}>2. Produtos ({items.length})</TabsTrigger><TabsTrigger value="publicar" disabled={!cardapio}>3. Publicar</TabsTrigger></TabsList>
      <TabsContent value="identidade"><form onSubmit={saveMenu} className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]"><Card><CardHeader><CardTitle>Dados do estabelecimento</CardTitle><CardDescription>Essas informações aparecerão no perfil público.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="menu-name">Nome *</Label><Input id="menu-name" value={menuForm.nome} onChange={event => setMenuForm(current => ({ ...current, nome: event.target.value, slug: cardapio ? current.slug : slugifyCardapio(event.target.value) }))} maxLength={100} placeholder="Ex.: Sabor da Praça" /></div><div className="space-y-2"><Label htmlFor="menu-slug">Endereço do cardápio *</Label><div className="flex items-center rounded-md border bg-background pl-3 text-xs text-muted-foreground"><span className="hidden sm:inline">/cardapio/</span><Input id="menu-slug" value={menuForm.slug} onChange={event => setMenuForm(current => ({ ...current, slug: slugifyCardapio(event.target.value) }))} className="border-0 shadow-none focus-visible:ring-0" maxLength={80} /></div></div></div><div className="space-y-2"><Label htmlFor="menu-description">Descrição</Label><Textarea id="menu-description" value={menuForm.descricao} onChange={event => setMenuForm(current => ({ ...current, descricao: event.target.value }))} maxLength={600} placeholder="Conte o que torna seu negócio especial." /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="menu-whatsapp">WhatsApp para pedidos</Label><Input id="menu-whatsapp" value={menuForm.whatsapp} onChange={event => setMenuForm(current => ({ ...current, whatsapp: event.target.value }))} placeholder="(75) 99999-9999" /></div><div className="space-y-2"><Label htmlFor="menu-instagram">Instagram</Label><Input id="menu-instagram" value={menuForm.instagram} onChange={event => setMenuForm(current => ({ ...current, instagram: event.target.value }))} placeholder="@seunegocio" /></div></div><div className="space-y-2"><Label htmlFor="menu-address">Endereço</Label><Input id="menu-address" value={menuForm.endereco} onChange={event => setMenuForm(current => ({ ...current, endereco: event.target.value }))} maxLength={300} /></div><div className="space-y-2"><Label htmlFor="menu-color">Cor principal</Label><div className="flex gap-2"><Input id="menu-color" type="color" value={menuForm.cor_primaria} onChange={event => setMenuForm(current => ({ ...current, cor_primaria: event.target.value }))} className="h-11 w-20 p-1" /><Input value={menuForm.cor_primaria} onChange={event => /^#[0-9a-fA-F]{0,6}$/.test(event.target.value) && setMenuForm(current => ({ ...current, cor_primaria: event.target.value }))} maxLength={7} /></div></div></CardContent></Card>
        <div className="space-y-5"><Card><CardHeader><CardTitle>Identidade visual</CardTitle></CardHeader><CardContent className="space-y-5"><div><Label>Logo</Label><ImageUpload value={menuForm.logo_url} onChange={logo_url => setMenuForm(current => ({ ...current, logo_url }))} onRemove={() => setMenuForm(current => ({ ...current, logo_url: '' }))} bucket="imagens" folder="cardapios/logo" maxSize={3} /></div><div><Label>Imagem de capa</Label><ImageUpload value={menuForm.capa_url} onChange={capa_url => setMenuForm(current => ({ ...current, capa_url }))} onRemove={() => setMenuForm(current => ({ ...current, capa_url: '' }))} bucket="imagens" folder="cardapios/capa" maxSize={5} /></div></CardContent></Card><Button type="submit" size="lg" className="w-full" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{cardapio ? 'Salvar alterações' : 'Criar meu cardápio'}</Button></div>
      </form></TabsContent>

      <TabsContent value="itens" className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><form onSubmit={saveItem}><Card><CardHeader><CardTitle>{editingItemId ? 'Editar item' : 'Novo item'}</CardTitle><CardDescription>Cadastre produtos, pratos, bebidas ou serviços.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="item-name">Nome *</Label><Input id="item-name" value={itemForm.nome} onChange={event => setItemForm(current => ({ ...current, nome: event.target.value }))} maxLength={120} /></div><div className="space-y-2"><Label htmlFor="item-category">Categoria *</Label><Input id="item-category" value={itemForm.categoria} onChange={event => setItemForm(current => ({ ...current, categoria: event.target.value }))} maxLength={60} placeholder="Ex.: Bebidas" /></div></div><div className="space-y-2"><Label htmlFor="item-description">Descrição</Label><Textarea id="item-description" value={itemForm.descricao} onChange={event => setItemForm(current => ({ ...current, descricao: event.target.value }))} maxLength={500} /></div><div className="space-y-2"><Label htmlFor="item-price">Preço *</Label><Input id="item-price" inputMode="decimal" value={itemForm.preco} onChange={event => setItemForm(current => ({ ...current, preco: event.target.value }))} placeholder="Ex.: 29,90" /></div><div><Label>Foto do item</Label><ImageUpload value={itemForm.imagem_url} onChange={imagem_url => setItemForm(current => ({ ...current, imagem_url }))} onRemove={() => setItemForm(current => ({ ...current, imagem_url: '' }))} bucket="imagens" folder="cardapios/itens" maxSize={4} /></div><div className="grid gap-3 sm:grid-cols-2"><Label className="flex items-center justify-between rounded-xl border p-3"><span>Disponível</span><Switch checked={itemForm.disponivel} onCheckedChange={disponivel => setItemForm(current => ({ ...current, disponivel }))} /></Label><Label className="flex items-center justify-between rounded-xl border p-3"><span>Destaque</span><Switch checked={itemForm.destaque} onCheckedChange={destaque => setItemForm(current => ({ ...current, destaque }))} /></Label></div><div className="flex gap-2"><Button type="submit" className="flex-1" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingItemId ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{editingItemId ? 'Atualizar' : 'Adicionar'}</Button>{editingItemId && <Button type="button" variant="outline" onClick={() => { setEditingItemId(null); setItemForm(emptyItem); }}>Cancelar</Button>}</div></CardContent></Card></form>
        <div className="space-y-3">{items.length === 0 ? <Card><CardContent className="py-16 text-center"><ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" /><h3 className="mt-3 font-black">Seu cardápio ainda está vazio</h3><p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro item usando o formulário.</p></CardContent></Card> : items.map(item => <Card key={item.id} className={!item.disponivel ? 'opacity-60' : ''}><CardContent className="flex gap-3 p-4">{item.imagem_url ? <img src={item.imagem_url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-muted"><UtensilsCrossed className="h-6 w-6 text-muted-foreground" /></div>}<div className="min-w-0 flex-1"><div className="flex flex-wrap gap-1"><Badge variant="outline">{item.categoria}</Badge>{item.destaque && <Badge>Destaque</Badge>}{!item.disponivel && <Badge variant="secondary">Indisponível</Badge>}</div><h3 className="mt-1 truncate font-black">{item.nome}</h3><p className="font-bold" style={{ color: menuForm.cor_primaria }}>{money.format(Number(item.preco))}</p></div><div className="flex shrink-0 flex-col"><Button type="button" size="icon" variant="ghost" onClick={() => editItem(item)} aria-label={`Editar ${item.nome}`}><Pencil className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" onClick={() => void deleteItem(item)} aria-label={`Excluir ${item.nome}`}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardContent></Card>)}</div>
      </TabsContent>

      <TabsContent value="publicar" className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Publicação</CardTitle><CardDescription>Controle quando o perfil pode ser encontrado pelo link.</CardDescription></CardHeader><CardContent className="space-y-4"><Label className="flex items-center justify-between rounded-2xl border p-4"><span><span className="block font-black">Cardápio publicado</span><span className="text-xs font-normal text-muted-foreground">Quando desativado, somente você consegue visualizá-lo no editor.</span></span><Switch checked={menuForm.ativo} onCheckedChange={ativo => setMenuForm(current => ({ ...current, ativo }))} /></Label><Label className="flex items-center justify-between rounded-2xl border p-4"><span><span className="block font-black">Aceitar pedidos no WhatsApp</span><span className="text-xs font-normal text-muted-foreground">Mostra o carrinho e o botão para enviar o pedido.</span></span><Switch checked={menuForm.aceita_pedidos} onCheckedChange={aceita_pedidos => setMenuForm(current => ({ ...current, aceita_pedidos }))} /></Label><Button className="w-full" onClick={event => void saveMenu(event)} disabled={saving}><Save className="mr-2 h-4 w-4" />Salvar publicação</Button></CardContent></Card><Card><CardHeader><CardTitle>Seu link público</CardTitle></CardHeader><CardContent className="space-y-4"><div className="break-all rounded-2xl bg-muted p-4 text-sm font-medium">{publicUrl}</div><div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => void copyLink()}><Copy className="mr-2 h-4 w-4" />Copiar link</Button><Button asChild style={{ backgroundColor: menuForm.cor_primaria }}><Link to={`/cardapio/${cardapio?.slug}`} target="_blank"><ExternalLink className="mr-2 h-4 w-4" />Abrir cardápio</Link></Button></div><Alert><Megaphone className="h-4 w-4" /><AlertTitle>Publicidade integrada</AlertTitle><AlertDescription>Os banners exibidos no perfil são administrados pelo SAJ TEM na seção “Cardápio Digital” do painel de Banners.</AlertDescription></Alert></CardContent></Card></TabsContent>
    </Tabs>
  </div></div>;
}
