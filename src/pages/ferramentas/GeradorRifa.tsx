import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Ticket, Trophy, QrCode, Sparkles, Copy, Trash2, Calendar, Clock, Share2, PlusCircle, ListFilter, Loader2, MessageCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';
import { useAuth } from '@/hooks/useAuth';

// LISTA OFICIAL DOS 25 ANIMAIS DA FAZENDINHA
const LISTA_FAZENDINHA = [
  { grupo: '01', nome: 'AVESTRUZ', dezenas: ['01', '02', '03', '04'], emoji: '🦩' },
  { grupo: '02', nome: 'ÁGUIA', dezenas: ['05', '06', '07', '08'], emoji: '🦅' },
  { grupo: '03', nome: 'BURRO', dezenas: ['09', '10', '11', '12'], emoji: '🫏' },
  { grupo: '04', nome: 'BORBOLETA', dezenas: ['13', '14', '15', '16'], emoji: '🦋' },
  { grupo: '05', nome: 'CACHORRO', dezenas: ['17', '18', '19', '20'], emoji: '🐶' },
  { grupo: '06', nome: 'CABRA', dezenas: ['21', '22', '23', '24'], emoji: '🐐' },
  { grupo: '07', nome: 'CARNEIRO', dezenas: ['25', '26', '27', '28'], emoji: '🐑' },
  { grupo: '08', nome: 'CAMELO', dezenas: ['29', '30', '31', '32'], emoji: '🐪' },
  { grupo: '09', nome: 'COBRA', dezenas: ['33', '34', '35', '36'], emoji: '🐍' },
  { grupo: '10', nome: 'COELHO', dezenas: ['37', '38', '39', '40'], emoji: '🐇' },
  { grupo: '11', nome: 'CAVALO', dezenas: ['41', '42', '43', '44'], emoji: '🐎' },
  { grupo: '12', nome: 'ELEFANTE', dezenas: ['45', '46', '47', '48'], emoji: '🐘' },
  { grupo: '13', nome: 'GALO', dezenas: ['49', '50', '51', '52'], emoji: '🐓' },
  { grupo: '14', nome: 'GATO', dezenas: ['53', '54', '55', '56'], emoji: '🐱' },
  { grupo: '15', nome: 'JACARÉ', dezenas: ['57', '58', '59', '60'], emoji: '🐊' },
  { grupo: '16', nome: 'LEÃO', dezenas: ['61', '62', '63', '64'], emoji: '🦁' },
  { grupo: '17', nome: 'MACACO', dezenas: ['65', '66', '67', '68'], emoji: '🐒' },
  { grupo: '18', nome: 'PORCO', dezenas: ['69', '70', '71', '72'], emoji: '🐖' },
  { grupo: '19', nome: 'PAVÃO', dezenas: ['73', '74', '75', '76'], emoji: '🦚' },
  { grupo: '20', nome: 'PERÚ', dezenas: ['77', '78', '79', '80'], emoji: '🦃' },
  { grupo: '21', nome: 'TOURO', dezenas: ['81', '82', '83', '84'], emoji: '🐂' },
  { grupo: '22', nome: 'TIGRE', dezenas: ['85', '86', '87', '88'], emoji: '🐅' },
  { grupo: '23', nome: 'URSO', dezenas: ['89', '90', '91', '92'], emoji: '🐻' },
  { grupo: '24', nome: 'VEADO', dezenas: ['93', '94', '95', '96'], emoji: '🦌' },
  { grupo: '25', nome: 'VACA', dezenas: ['97', '98', '99', '00'], emoji: '🐄' },
];

interface NumeroRifa {
  numero: string;
  status: 'livre' | 'reservado' | 'pago';
  nome?: string;
  telefone?: string;
}

interface RifaDados {
  id?: string;
  user_id?: string;
  titulo: string;
  premio: string;
  valor_numero: string;
  chave_pix: string;
  data_sorteio: string;
  hora_sorteio: string;
  tipo_rifa: 'numerica' | 'fazendinha';
  qtd_numeros: '50' | '100' | '1000';
  numeros: NumeroRifa[];
  created_at?: string;
}

export const GeradorRifa = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const idRifaPublica = searchParams.get('id');

  // FORMULÁRIO
  const [titulo, setTitulo] = useState('');
  const [premio, setPremio] = useState('');
  const [valorNumero, setValorNumero] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [dataSorteio, setDataSorteio] = useState('');
  const [horaSorteio, setHoraSorteio] = useState('');
  const [tipoRifa, setTipoRifa] = useState<'numerica' | 'fazendinha'>('fazendinha');
  const [qtdNumeros, setQtdNumeros] = useState<'50' | '100' | '1000'>('100');

  // BANCO DE DADOS
  const [rifasUsuario, setRifasUsuario] = useState<RifaDados[]>([]);
  const [rifaAtiva, setRifaAtiva] = useState<RifaDados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [isModoComprador, setIsModoComprador] = useState(false);

  // ABA ATIVA: 'minhas' OU 'criar'
  const [abaExibicao, setAbaExibicao] = useState<'minhas' | 'criar'>('criar');

  // NÚMEROS E FILTROS
  const [numeros, setNumeros] = useState<NumeroRifa[]>([]);

  // MODAL
  const [numeroSelecionado, setNumeroSelecionado] = useState<NumeroRifa | null>(null);
  const [grupoSelecionadoFazendinha, setGrupoSelecionadoFazendinha] = useState<any | null>(null);
  const [modalReservaOpen, setModalReservaOpen] = useState(false);
  const [nomeComprador, setNomeComprador] = useState('');
  const [telefoneComprador, setTelefoneComprador] = useState('');
  const [salvandoReserva, setSalvandoReserva] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const [gerandoLink, setGerandoLink] = useState(false);
  const cartelaRef = useRef<HTMLDivElement | null>(null);
  const linksCurtosRef = useRef<Record<string, string>>({});

  const inicializarRifas = async () => {
    try {
      setCarregando(true);
      await supabase.rpc('deletar_rifas_expiradas' as any);

      if (idRifaPublica) {
        setIsModoComprador(true);
        const { data, error } = await supabase
          .from('rifas_usuarios' as any)
          .select('*')
          .eq('id', idRifaPublica)
          .single();

        if (error || !data) {
          toast.error('Rifa não encontrada ou encerrada.');
          setCarregando(false);
          return;
        }

        const rifaPub: RifaDados = {
          id: data.id,
          user_id: data.user_id,
          titulo: data.titulo,
          premio: data.premio,
          valor_numero: data.valor_numero,
          chave_pix: data.chave_pix,
          data_sorteio: data.data_sorteio,
          hora_sorteio: data.hora_sorteio,
          tipo_rifa: data.tipo_rifa || 'fazendinha',
          qtd_numeros: data.qtd_numeros,
          numeros: data.numeros || []
        };

        selecionarRifaParaExibir(rifaPub);
        setAbaExibicao('minhas');
        setCarregando(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      let query = supabase.from('rifas_usuarios' as any).select('*').order('created_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const listaFormatada: RifaDados[] = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          titulo: item.titulo,
          premio: item.premio,
          valor_numero: item.valor_numero,
          chave_pix: item.chave_pix,
          data_sorteio: item.data_sorteio,
          hora_sorteio: item.hora_sorteio,
          tipo_rifa: item.tipo_rifa || 'fazendinha',
          qtd_numeros: item.qtd_numeros,
          numeros: item.numeros || [],
          created_at: item.created_at
        }));

        setRifasUsuario(listaFormatada);
        selecionarRifaParaExibir(listaFormatada[0]);
        setAbaExibicao('minhas');
      } else {
        setRifasUsuario([]);
        setRifaAtiva(null);
        setAbaExibicao('criar');
      }
    } catch (err) {
      console.error('Erro ao buscar rifa:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    inicializarRifas();
  }, [idRifaPublica]);

  useEffect(() => {
    const rifaId = rifaAtiva?.id;
    if (!rifaId) return;

    const channel = supabase
      .channel(`rifa-tempo-real:${rifaId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rifas_usuarios', filter: `id=eq.${rifaId}` },
        (payload) => {
          const atualizada = payload.new as { numeros?: NumeroRifa[] };
          if (!Array.isArray(atualizada.numeros)) return;
          setNumeros(atualizada.numeros);
          setRifaAtiva(prev => prev ? { ...prev, numeros: atualizada.numeros! } : prev);
          setNumeroSelecionado(prev => {
            if (!prev) return prev;
            return atualizada.numeros!.find(item => item.numero === prev.numero) || prev;
          });
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [rifaAtiva?.id]);

  const selecionarRifaParaExibir = (rifa: RifaDados) => {
    setRifaAtiva(rifa);
    setNumeros(rifa.numeros || []);
    setTitulo(rifa.titulo);
    setPremio(rifa.premio);
    setValorNumero(rifa.valor_numero);
    setChavePix(rifa.chave_pix);
    setDataSorteio(rifa.data_sorteio);
    setHoraSorteio(rifa.hora_sorteio);
    setTipoRifa(rifa.tipo_rifa || 'fazendinha');
    setQtdNumeros(rifa.qtd_numeros);
  };

  const handleCriarRifa = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo || !premio || !valorNumero || !dataSorteio || !horaSorteio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSalvando(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const total = tipoRifa === 'fazendinha' ? 25 : parseInt(qtdNumeros);
      const lista: NumeroRifa[] = [];

      if (tipoRifa === 'fazendinha') {
        LISTA_FAZENDINHA.forEach((bicho) => {
          lista.push({
            numero: bicho.grupo,
            status: 'livre',
          });
        });
      } else {
        for (let i = 0; i < total; i++) {
          const numFormatado = qtdNumeros === '1000' 
            ? i.toString().padStart(3, '0') 
            : i.toString().padStart(2, '0');

          lista.push({
            numero: numFormatado,
            status: 'livre',
          });
        }
      }

      const { data, error } = await supabase
        .from('rifas_usuarios' as any)
        .insert({
          user_id: userId,
          titulo,
          premio,
          valor_numero: valorNumero,
          chave_pix: chavePix,
          data_sorteio: dataSorteio,
          hora_sorteio: horaSorteio,
          tipo_rifa: tipoRifa,
          qtd_numeros: tipoRifa === 'fazendinha' ? '100' : qtdNumeros,
          numeros: lista
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Rifa criada e salva com sucesso!');
      await inicializarRifas();
    } catch (err: any) {
      toast.error('Erro ao salvar rifa: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarReserva = async (novoStatus: 'reservado' | 'pago') => {
    if (!numeroSelecionado || !rifaAtiva?.id) return;
    if (!nomeComprador.trim()) {
      toast.error('Informe o nome do comprador.');
      return;
    }
    if (telefoneComprador.replace(/\D/g, '').length < 8) {
      toast.error('Informe um telefone válido.');
      return;
    }

    try {
      setSalvandoReserva(true);
      const { data, error } = await supabase.rpc('atualizar_numero_rifa' as any, {
        p_rifa_id: rifaAtiva.id,
        p_numero: numeroSelecionado.numero,
        p_status: novoStatus,
        p_nome: nomeComprador.trim(),
        p_telefone: telefoneComprador.trim(),
      });

      if (error) throw error;

      const novosNumeros = (data || []) as unknown as NumeroRifa[];
      setNumeros(novosNumeros);
      setRifaAtiva(prev => prev ? { ...prev, numeros: novosNumeros } : null);
      setModalReservaOpen(false);
      toast.success(`Grupo ${numeroSelecionado.numero} marcado como ${novoStatus.toUpperCase()}!`);
    } catch (err: any) {
      const { data } = await supabase
        .from('rifas_usuarios' as any)
        .select('numeros')
        .eq('id', rifaAtiva.id)
        .maybeSingle();
      if (Array.isArray(data?.numeros)) {
        setNumeros(data.numeros as NumeroRifa[]);
        setRifaAtiva(prev => prev ? { ...prev, numeros: data.numeros as NumeroRifa[] } : null);
      }
      const message = String(err?.message || 'Não foi possível concluir a reserva.');
      toast.error(message.includes('acabou de ser reservado')
        ? 'Este número acabou de ser reservado por outra pessoa. Escolha outro.'
        : message);
    } finally {
      setSalvandoReserva(false);
    }
  };

  const handleLiberarNumero = async () => {
    if (!numeroSelecionado || !rifaAtiva?.id) return;
    if (!podeGerenciarRifa) {
      toast.error('Somente o criador da rifa ou um administrador pode liberar este número.');
      return;
    }

    try {
      setSalvandoReserva(true);
      const { data, error } = await supabase.rpc('atualizar_numero_rifa' as any, {
        p_rifa_id: rifaAtiva.id,
        p_numero: numeroSelecionado.numero,
        p_status: 'livre',
        p_nome: null,
        p_telefone: null,
      });

      if (error) throw error;

      const novosNumeros = (data || []) as unknown as NumeroRifa[];
      setNumeros(novosNumeros);
      setRifaAtiva(prev => prev ? { ...prev, numeros: novosNumeros } : null);
      setModalReservaOpen(false);
      toast.info(`Grupo ${numeroSelecionado.numero} liberado novamente.`);
    } catch (err: any) {
      toast.error('Erro ao liberar número: ' + err.message);
    } finally {
      setSalvandoReserva(false);
    }
  };

  const handleApagarRifaManual = async () => {
    if (!rifaAtiva?.id) return;

    if (confirm('Tem certeza que deseja apagar esta rifa? Ela será removida permanentemente.')) {
      try {
        const { error } = await supabase
          .from('rifas_usuarios' as any)
          .delete()
          .eq('id', rifaAtiva.id);

        if (error) throw error;

        toast.success('Rifa excluída permanentemente.');
        await inicializarRifas();
      } catch (err: any) {
        toast.error('Erro ao apagar rifa: ' + err.message);
      }
    }
  };

  const getLinkOriginalRifa = () => {
    if (!rifaAtiva?.id) return window.location.href;

    const url = new URL('/ferramentas/gerador-rifa', window.location.origin);
    url.searchParams.set('id', rifaAtiva.id);
    return url.toString();
  };

  const getTextoCompartilhamento = () =>
    `🎟️ Participe da rifa “${titulo}” e concorra a ${premio}! Escolha seu número antes que acabe.`;

  const getLinkRifa = async () => {
    if (!rifaAtiva?.id) return getLinkOriginalRifa();

    const linkEmCache = linksCurtosRef.current[rifaAtiva.id];
    if (linkEmCache) return linkEmCache;

    const { data, error } = await supabase.rpc('create_raffle_short_url', {
      p_raffle_id: rifaAtiva.id,
    });

    if (error || !data) {
      console.error('Não foi possível gerar o link curto da rifa:', error);
      return getLinkOriginalRifa();
    }

    const linkCurto = `${window.location.origin}/s/${data}`;
    linksCurtosRef.current[rifaAtiva.id] = linkCurto;
    return linkCurto;
  };

  const handleCopiarLinkRifa = async () => {
    try {
      setGerandoLink(true);
      const link = await getLinkRifa();
      await navigator.clipboard.writeText(link);
      toast.success('Link curto da rifa copiado!');
    } catch {
      toast.error('Não foi possível copiar o link.');
    } finally {
      setGerandoLink(false);
    }
  };

  const handleCompartilharWhatsApp = async () => {
    try {
      setGerandoLink(true);
      const link = await getLinkRifa();
      const mensagem = `${getTextoCompartilhamento()}\n\n${link}`;
      window.location.assign(`https://wa.me/?text=${encodeURIComponent(mensagem)}`);
    } catch {
      toast.error('Não foi possível abrir o compartilhamento do WhatsApp.');
    } finally {
      setGerandoLink(false);
    }
  };

  const handleCompartilharCartela = async () => {
    if (!rifaAtiva?.id || !cartelaRef.current) return;

    let areaCaptura: HTMLDivElement | null = null;
    try {
      setCompartilhando(true);
      const link = await getLinkRifa();
      const texto = getTextoCompartilhamento();
      const { default: html2canvas } = await import('html2canvas');

      areaCaptura = document.createElement('div');
      const largura = Math.max(cartelaRef.current.getBoundingClientRect().width, 340);
      Object.assign(areaCaptura.style, {
        position: 'fixed',
        left: '-10000px',
        top: '0',
        width: `${largura}px`,
        padding: '14px',
        background: '#ffffff',
        color: '#18181b',
        zIndex: '-1',
      });

      const cartelaClone = cartelaRef.current.cloneNode(true) as HTMLElement;
      cartelaClone.style.width = '100%';
      const gradeNumerica = cartelaClone.querySelector<HTMLElement>('[data-raffle-number-grid]');
      if (gradeNumerica) {
        gradeNumerica.style.maxHeight = 'none';
        gradeNumerica.style.overflow = 'visible';
      }
      areaCaptura.appendChild(cartelaClone);

      const rodape = document.createElement('div');
      Object.assign(rodape.style, {
        marginTop: '12px',
        padding: '14px',
        borderRadius: '14px',
        background: '#f3e8ff',
        border: '1px solid #d8b4fe',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
      });
      const chamada = document.createElement('strong');
      chamada.textContent = 'Escolha seu número e participe pelo Saj Tem';
      chamada.style.display = 'block';
      chamada.style.fontSize = '15px';
      chamada.style.color = '#581c87';
      const endereco = document.createElement('span');
      endereco.textContent = link;
      endereco.style.display = 'block';
      endereco.style.marginTop = '6px';
      endereco.style.fontSize = '11px';
      endereco.style.wordBreak = 'break-all';
      endereco.style.color = '#6b21a8';
      rodape.append(chamada, endereco);
      areaCaptura.appendChild(rodape);
      document.body.appendChild(areaCaptura);

      const canvas = await html2canvas(areaCaptura, {
        backgroundColor: '#ffffff',
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(value => value ? resolve(value) : reject(new Error('Falha ao gerar a imagem.')), 'image/png', 0.95);
      });
      const nomeArquivo = `rifa-${titulo || rifaAtiva.id}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
      const arquivo = new File([blob], `${nomeArquivo || 'cartela-rifa'}.png`, { type: 'image/png' });

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [arquivo] }))) {
        const linkCopiado = await navigator.clipboard
          ?.writeText(`${texto}\n\n${link}`)
          .then(() => true)
          .catch(() => false);

        await navigator.share({
          title: `Rifa: ${titulo}`,
          text: texto,
          url: link,
          files: [arquivo],
        });
        toast.success(
          linkCopiado
            ? 'Cartela compartilhada! O texto com o link também foi copiado.'
            : 'Cartela compartilhada!',
        );
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = arquivo.name;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
      const textoCopiado = await navigator.clipboard
        .writeText(`${texto}\n\n${link}`)
        .then(() => true)
        .catch(() => false);

      toast.success(
        textoCopiado
          ? 'Imagem baixada e texto com link copiado.'
          : 'Imagem baixada. Compartilhe junto com o link da rifa.',
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error(err?.message || 'Não foi possível compartilhar a cartela.');
      }
    } finally {
      areaCaptura?.remove();
      setCompartilhando(false);
    }
  };

  const totalPagos = numeros.filter(n => n.status === 'pago').length;
  const totalReservados = numeros.filter(n => n.status === 'reservado').length;
  const totalLivres = numeros.filter(n => n.status === 'livre').length;
  const arrecadacaoTotal = totalPagos * (parseFloat(valorNumero.replace(',', '.')) || 0);
  const isAdmin = profile?.tipo_conta === 'admin_geral' || profile?.tipo_conta === 'admin_cidade';
  const isCriadorRifa = Boolean(user?.id && rifaAtiva?.user_id === user.id);
  const podeGerenciarRifa = isCriadorRifa || isAdmin;
  const numeroOcupado = Boolean(numeroSelecionado && numeroSelecionado.status !== 'livre');

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground font-semibold">Carregando Rifa...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-2 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Início
          </Button>
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> {isModoComprador ? 'Rifa Pública' : 'Ações & Rifas'}
          </Badge>
        </div>

        {/* BANNER DE ANÚNCIO NO TOPO DA PÁGINA DA RIFA */}
        <ToolBanner secao="gerador_rifa" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
            <Ticket className="w-8 h-8 text-primary" /> {titulo || 'Rifa Online'}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            {isModoComprador 
              ? 'Escolha seu animal/grupo abaixo e informe seus dados para reservar.' 
              : 'Crie rifas tradicionais ou modelo Fazendinha com layout de cartela.'}
          </p>
        </div>

        {/* CONTROLES DE ABAS */}
        {!isModoComprador && (
          <div className="flex items-center justify-center gap-3 pt-2">
            {rifasUsuario.length > 0 && (
              <Button
                type="button"
                onClick={() => setAbaExibicao('minhas')}
                className={`rounded-full text-xs font-extrabold gap-2 px-5 h-10 transition-all border ${
                  abaExibicao === 'minhas'
                    ? 'bg-primary text-primary-foreground shadow-md border-primary'
                    : 'bg-muted/80 text-foreground hover:bg-muted border-border'
                }`}
              >
                <ListFilter className="w-4 h-4" /> Minhas Rifas ({rifasUsuario.length})
              </Button>
            )}

            <Button
              type="button"
              onClick={() => {
                setTitulo('');
                setPremio('');
                setValorNumero('');
                setChavePix('');
                setDataSorteio('');
                setHoraSorteio('');
                setAbaExibicao('criar');
              }}
              className={`rounded-full text-xs font-extrabold gap-2 px-5 h-10 transition-all border ${
                abaExibicao === 'criar'
                  ? 'bg-primary text-primary-foreground shadow-md border-primary'
                  : 'bg-muted/80 text-foreground hover:bg-muted border-border'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Nova Rifa
            </Button>
          </div>
        )}

        {/* MODO CRIAR RIFA */}
        {!isModoComprador && abaExibicao === 'criar' ? (
          <Card className="max-w-2xl mx-auto border-border/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" /> Configurar Nova Rifa
              </CardTitle>
              <CardDescription className="text-xs">
                Escolha entre o modelo Fazendinha (Cartela com 25 Grupos) ou Números Sequenciais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCriarRifa} className="space-y-4">
                
                {/* SELETOR DO TIPO DE RIFA */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Modelo da Rifa *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTipoRifa('fazendinha')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        tipoRifa === 'fazendinha'
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted'
                      }`}
                    >
                      <span className="text-xs font-extrabold flex items-center gap-1.5">
                        🐄 Rifa Fazendinha (Cartela)
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        25 Quadrados de Animais com 4 Dezenas
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoRifa('numerica')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        tipoRifa === 'numerica'
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-background hover:bg-muted'
                      }`}
                    >
                      <span className="text-xs font-extrabold flex items-center gap-1.5">
                        🔢 Rifa Numérica
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        Números em lista simples (00 a 99)
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Título / Nome da Rifa *</Label>
                  <Input 
                    placeholder="Ex: Rifa Fazendinha do Porco ou Ação entre Amigos" 
                    value={titulo} 
                    onChange={e => setTitulo(e.target.value)} 
                    required 
                    className="h-10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Prêmio Principal *</Label>
                    <Input 
                      placeholder="Ex: Porco Assado, R$ 500 no PIX, Cesta" 
                      value={premio} 
                      onChange={e => setPremio(e.target.value)} 
                      required 
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Valor por Grupo/Número (R$) *</Label>
                    <Input 
                      placeholder="Ex: 10,00" 
                      value={valorNumero} 
                      onChange={e => setValorNumero(e.target.value)} 
                      required 
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Data do Sorteio *</Label>
                    <Input 
                      type="date"
                      value={dataSorteio} 
                      onChange={e => setDataSorteio(e.target.value)} 
                      required 
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Horário do Sorteio *</Label>
                    <Input 
                      type="time"
                      value={horaSorteio} 
                      onChange={e => setHoraSorteio(e.target.value)} 
                      required 
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                {tipoRifa === 'numerica' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Quantidade de Números</Label>
                    <Select value={qtdNumeros} onValueChange={(v: '50' | '100' | '1000') => setQtdNumeros(v)}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">00 a 49 (50 Números)</SelectItem>
                        <SelectItem value="100">00 a 99 (100 Números)</SelectItem>
                        <SelectItem value="1000">000 a 999 (1.000 Números)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Chave PIX (Opcional)</Label>
                  <Input 
                    placeholder="CPF, Telefone ou E-mail para pagamento" 
                    value={chavePix} 
                    onChange={e => setChavePix(e.target.value)} 
                    className="h-10 text-sm"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={salvando}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl gap-2 mt-2"
                >
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{salvando ? 'Criando Rifa...' : 'Salvar Rifa e Gerar Link'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* PAINEL DA RIFA ATIVA */
          <div className="space-y-6">

            <Card className="border-border/60 shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-primary border-primary/30 text-[10px] uppercase font-bold mb-1">
                        {tipoRifa === 'fazendinha' ? 'Rifa Fazendinha (Cartela Bicho)' : 'Rifa Numérica'}
                      </Badge>
                      <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px] font-bold mb-1">
                        Sorteio em Breve
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-black text-foreground">{titulo}</h2>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" /> Prêmio: <strong className="text-foreground">{premio}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary shrink-0" /> Data: <strong className="text-foreground">{dataSorteio ? dataSorteio.split('-').reverse().join('/') : '-'}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary shrink-0" /> Hora: <strong className="text-foreground">{horaSorteio}h</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => void handleCompartilharWhatsApp()}
                      disabled={gerandoLink}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-xl gap-2 shadow-sm text-xs"
                    >
                      {gerandoLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                      {gerandoLink ? 'Gerando link...' : 'Compartilhar no WhatsApp'}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => void handleCompartilharCartela()}
                      disabled={compartilhando}
                      variant="outline"
                      className="font-bold h-10 px-4 rounded-xl gap-2 shadow-sm text-xs"
                    >
                      {compartilhando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                      {compartilhando ? 'Gerando imagem...' : 'Compartilhar imagem'}
                    </Button>

                    <Button 
                      onClick={() => void handleCopiarLinkRifa()}
                      disabled={gerandoLink}
                      variant="outline"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-4 rounded-xl gap-2 shadow-sm text-xs"
                    >
                      {gerandoLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                      Copiar link curto
                    </Button>

                    {!isModoComprador && (
                      <Button 
                        variant="outline" 
                        onClick={handleApagarRifaManual}
                        className="h-10 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Apagar Rifa
                      </Button>
                    )}
                  </div>
                </div>

                {/* MÉTRICAS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 bg-muted/40 rounded-xl border text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Valor/Grupo</span>
                    <strong className="text-sm sm:text-base text-foreground font-extrabold">R$ {valorNumero}</strong>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold block">Pagos ({totalPagos})</span>
                    <strong className="text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-extrabold">R$ {arrecadacaoTotal.toFixed(2)}</strong>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold block">Reservados</span>
                    <strong className="text-sm sm:text-base text-amber-600 dark:text-amber-400 font-extrabold">{totalReservados}</strong>
                  </div>
                  <div className="p-3 bg-muted/60 border rounded-xl text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Disponíveis</span>
                    <strong className="text-sm sm:text-base text-foreground font-extrabold">{totalLivres}</strong>
                  </div>
                </div>

                {chavePix && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-primary shrink-0" />
                      <span>Chave PIX: <strong>{chavePix}</strong></span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs text-primary"
                      onClick={() => {
                        navigator.clipboard.writeText(chavePix);
                        toast.success('Chave PIX copiada!');
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copiar PIX
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TABELA DE CARTELA DA FAZENDINHA (5 COLUNAS SEM RODAPÉ DE HORÁRIOS) */}
            <Card ref={cartelaRef} className="border-2 border-pink-300 dark:border-pink-900 rounded-3xl shadow-lg overflow-hidden bg-pink-50/40 dark:bg-zinc-950/80">
              <CardHeader className="pb-2 text-center bg-pink-100/80 dark:bg-pink-950/40 border-b border-pink-200 dark:border-pink-900">
                <CardTitle className="text-sm sm:text-lg font-black text-pink-900 dark:text-pink-300 uppercase tracking-tight">
                  {tipoRifa === 'fazendinha' ? 'CARTELA DA FAZENDINHA' : 'GRADE DE NÚMEROS'}
                </CardTitle>
                <CardDescription className="text-[11px] text-pink-800/80 dark:text-pink-400 font-medium">
                  {tipoRifa === 'fazendinha' 
                    ? 'Escolha seu animal para reservar o grupo e concorrer com suas 4 dezenas' 
                    : 'Clique no número desejado para reservar'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-1.5 sm:p-4">
                {tipoRifa === 'fazendinha' ? (
                  <div className="grid grid-cols-5 gap-1 sm:gap-2">
                    {LISTA_FAZENDINHA.map((bicho) => {
                      const numItem = numeros.find(n => n.numero === bicho.grupo);
                      const status = numItem?.status || 'livre';

                      let estiloStatus = 'bg-white dark:bg-zinc-900 border-pink-300 dark:border-pink-900 hover:border-pink-500 shadow-sm';
                      if (status === 'reservado') estiloStatus = 'bg-amber-100 border-amber-500 dark:bg-amber-950/60 dark:border-amber-500 font-bold';
                      if (status === 'pago') estiloStatus = 'bg-emerald-100 border-emerald-500 dark:bg-emerald-950/60 dark:border-emerald-500 font-extrabold';

                      return (
                        <button
                          key={bicho.grupo}
                          disabled={isModoComprador && status !== 'livre' && !podeGerenciarRifa}
                          onClick={() => {
                            setNumeroSelecionado(numItem || { numero: bicho.grupo, status: 'livre' });
                            setGrupoSelecionadoFazendinha(bicho);
                            setNomeComprador(numItem?.nome || '');
                            setTelefoneComprador(numItem?.telefone || '');
                            setModalReservaOpen(true);
                          }}
                          className={`border rounded-lg sm:rounded-xl p-1 sm:p-2 flex items-center justify-between text-left transition-all duration-200 relative overflow-hidden group min-h-[74px] sm:min-h-[85px] ${estiloStatus}`}
                        >
                          {/* LADO ESQUERDO: GRUPO, EMOJI E NOME */}
                          <div className="flex flex-col justify-between h-full space-y-0.5 overflow-hidden">
                            <span className="text-[9px] sm:text-xs font-black text-pink-700 dark:text-pink-400 leading-none">
                              {bicho.grupo}
                            </span>
                            
                            <div className="text-base sm:text-2xl my-0.5 select-none flex items-center justify-center leading-none">
                              {bicho.emoji}
                            </div>

                            <span className="text-[7px] sm:text-[9px] font-black tracking-tighter text-foreground uppercase truncate max-w-[38px] sm:max-w-[65px] leading-none">
                              {bicho.nome}
                            </span>
                          </div>

                          {/* LADO DIREITO: DEZENAS E NOME DO COMPRADOR */}
                          <div className="flex h-full min-w-0 flex-col items-end justify-between border-l border-pink-200 pl-0.5 dark:border-pink-900/60 sm:pl-1.5">
                            <div className="flex flex-col items-end font-mono text-[8px] font-extrabold leading-tight text-foreground/80 sm:text-[10px]">
                              {bicho.dezenas.map((dz) => (
                                <span key={dz} className="leading-tight">
                                  {dz}
                                </span>
                              ))}
                            </div>

                            {numItem?.nome && (
                              <span
                                title={numItem.nome}
                                className="mt-0.5 max-w-[34px] truncate rounded bg-background/90 px-0.5 text-right font-sans text-[6px] font-bold leading-none text-primary shadow-sm sm:max-w-[52px] sm:text-[8px]"
                              >
                                {numItem.nome.split(' ')[0]}
                              </span>
                            )}
                          </div>

                          {/* ETIQUETA DE STATUS */}
                          {status !== 'livre' && (
                            <div className="absolute top-0.5 right-0.5">
                              {status === 'pago' && (
                                <Badge className="bg-emerald-600 text-white text-[6px] sm:text-[7px] px-0.5 py-0 uppercase leading-none">PAG</Badge>
                              )}
                              {status === 'reservado' && (
                                <Badge className="bg-amber-600 text-white text-[6px] sm:text-[7px] px-0.5 py-0 uppercase leading-none">RES</Badge>
                              )}
                            </div>
                          )}

                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* EXIBIÇÃO NUMÉRICA SEQUENCIAL */
                  <div data-raffle-number-grid className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-[500px] overflow-y-auto p-1">
                    {numeros.map((item) => {
                      let estilos = 'bg-background hover:border-primary/60 text-foreground border-border cursor-pointer';
                      if (item.status === 'reservado') estilos = 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-bold cursor-pointer';
                      if (item.status === 'pago') estilos = 'bg-emerald-500 text-white border-emerald-600 font-extrabold shadow-sm';

                      return (
                        <button
                          key={item.numero}
                          disabled={isModoComprador && item.status !== 'livre' && !podeGerenciarRifa}
                          onClick={() => {
                            setNumeroSelecionado(item);
                            setGrupoSelecionadoFazendinha(null);
                            setNomeComprador(item.nome || '');
                            setTelefoneComprador(item.telefone || '');
                            setModalReservaOpen(true);
                          }}
                          className={`h-10 rounded-xl border text-xs sm:text-sm transition-all duration-150 flex flex-col items-center justify-center relative group ${estilos}`}
                        >
                          <span>{item.numero}</span>
                          {item.nome && (
                            <span className="text-[8px] truncate max-w-[90%] px-0.5 opacity-90 leading-tight">
                              {item.nome.split(' ')[0]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

      </div>

      {/* MODAL DE RESERVA / COMPRA */}
      <Dialog open={modalReservaOpen} onOpenChange={setModalReservaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Ticket className="w-5 h-5 text-primary" /> 
              {grupoSelecionadoFazendinha 
                ? `Grupo ${grupoSelecionadoFazendinha.grupo} - ${grupoSelecionadoFazendinha.nome} ${grupoSelecionadoFazendinha.emoji}`
                : `Número ${numeroSelecionado?.numero}`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {podeGerenciarRifa && numeroOcupado
                ? 'Este número está ocupado. Você pode liberá-lo novamente para a cartela.'
                : grupoSelecionadoFazendinha
                  ? `Ao reservar este grupo, você concorre com as dezenas: ${grupoSelecionadoFazendinha.dezenas.join(', ')}.`
                  : 'Informe seu nome e WhatsApp para confirmar a reserva.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Seu Nome Completo *</Label>
              <Input 
                placeholder="Ex: João da Silva" 
                value={nomeComprador} 
                onChange={e => setNomeComprador(e.target.value)} 
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">WhatsApp / Telefone *</Label>
              <Input 
                placeholder="Ex: (75) 99999-9999" 
                value={telefoneComprador} 
                onChange={e => setTelefoneComprador(e.target.value)} 
                className="h-10 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {podeGerenciarRifa && numeroOcupado && (
              <Button 
                variant="outline" 
                onClick={handleLiberarNumero}
                disabled={salvandoReserva}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-9"
              >
                {grupoSelecionadoFazendinha ? 'Liberar Grupo' : 'Liberar Número'}
              </Button>
            )}

            <Button 
              onClick={() => handleSalvarReserva('reservado')} 
              disabled={salvandoReserva || (isModoComprador && numeroSelecionado?.status !== 'livre')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9"
            >
              {salvandoReserva && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {isModoComprador && numeroSelecionado?.status !== 'livre' ? 'Número indisponível' : 'Confirmar Reserva'}
            </Button>

            {!isModoComprador && (
              <Button 
                onClick={() => handleSalvarReserva('pago')} 
                disabled={salvandoReserva}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9"
              >
                Marcar PAGO
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default GeradorRifa;
