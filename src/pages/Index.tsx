import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HomeContent } from '@/components/home/HomeContent';
import { SearchContent } from '@/components/search/SearchContent';
import { CategoriesContent } from '@/components/categories/CategoriesContent';
import { CouponsContent } from '@/components/coupons/CouponsContent';
import { ProfileContent } from '@/components/profile/ProfileContent';
import { supabase } from '@/integrations/supabase/client';
import { 
  Hammer, 
  Clock, 
  MapPin, 
  Mail, 
  MessageSquare, 
  Instagram, 
  Facebook, 
  Globe, 
  ArrowRight
} from 'lucide-react';

const Index = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'home';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Estados de controle para o Modo Manutenção
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Carrega e monitora o status de manutenção do banco de dados
  useEffect(() => {
    const verificarManutencao = async () => {
      try {
        // timeout de segurança de 3 segundos para não prender o usuário se o supabase falhar
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout Supabase')), 3000)
        );

        const fetchPromise = supabase
          .from('configuracoes_sistema' as any)
          .select('manutencao, mensagem_manutencao')
          .limit(1)
          .maybeSingle();

        // Executa a busca ou falha caso demore demais
        const { data, error }: any = await Promise.race([fetchPromise, timeoutPromise]).catch(() => ({ data: null, error: null }));

        if (error) throw error;

        if (data) {
          setIsMaintenance(data.manutencao ?? false);
          setMaintenanceMessage(data.mensagem_manutencao ?? 'O portal está passando por atualizações e voltará em breve.');
        } else {
          // Se não houver dados, o site padrão precisa rodar livremente
          setIsMaintenance(false);
        }
      } catch (error) {
        console.error('Erro ao buscar status de manutenção:', error);
        // Fallback de segurança: Se der erro na tabela, deixa o site aberto
        setIsMaintenance(false);
      } finally {
        setLoadingConfig(false);
      }
    };

    verificarManutencao();

    // Listener Realtime para alternar na hora sem precisar de F5
    const channel = supabase
      .channel('schema-db-changes-index')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'configuracoes_sistema' },
        (payload) => {
          if (payload && payload.new) {
            setIsMaintenance(payload.new.manutencao ?? false);
            setMaintenanceMessage(payload.new.mensagem_manutencao ?? 'O portal está passando por atualizações.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // Se estiver carregando as configurações da tabela, mostra o loading rápido
  if (loadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0A19] text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="text-xs text-purple-400/80 font-medium tracking-widest uppercase">Sincronizando Ecossistema</p>
        </div>
      </div>
    );
  }

  // Se o modo manutenção estiver ativado, intercepta a renderização pública
  if (isMaintenance) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#0F0A19] text-white relative overflow-hidden font-sans">
        
        {/* Detalhes de luz de fundo em gradiente neon (Efeito Blur Profissional) */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Topo / Header da página de Manutenção */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              SAJ <span className="text-purple-500">TEM</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs bg-purple-950/40 border border-purple-900/60 px-3 py-1.5 rounded-full text-purple-300 font-medium backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-purple-400" />
            Santo Antônio de Jesus • BA
          </div>
        </header>

        {/* Conteúdo Principal Centralizado */}
        <main className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center flex-grow relative z-10 text-center">
          
          {/* Badge Informativa superior */}
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            Melhorias Estruturais em Andamento
          </div>

          {/* Títulos principais de impacto */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-2xl leading-[1.1] mb-6">
            Estamos a preparar algo <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-400 bg-clip-text text-transparent">incrível</span> para si.
          </h1>
          
          <p className="text-gray-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10">
            {maintenanceMessage} O nosso guia comercial está a receber uma atualização nos servidores para melhorar a velocidade das pesquisas comerciais da região.
          </p>

          {/* Barra de Progresso Visual Simulada para passar credibilidade */}
          <div className="w-full max-w-md bg-purple-950/30 border border-purple-900/40 rounded-2xl p-4 mb-12 backdrop-blur-sm">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-purple-400 flex items-center gap-1.5">
                <Hammer className="h-3.5 w-3.5 animate-spin" /> Otimização do Banco de Dados
              </span>
              <span className="text-purple-300">85% Concluído</span>
            </div>
            <div className="w-full h-2.5 bg-[#171026] rounded-full overflow-hidden p-0.5 border border-purple-900/20">
              <div className="h-full w-[85%] bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full animate-pulse shadow-md shadow-purple-500/20" />
            </div>
          </div>

          {/* Seção Informativa de Suporte / Comercial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl text-left">
            <div className="bg-[#150F22]/60 border border-purple-900/30 p-5 rounded-2xl backdrop-blur-sm hover:border-purple-800/40 transition-colors">
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" /> Precisa de anunciar hoje?
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                A nossa equipa comercial continua a registar novas empresas localmente sem interrupções.
              </p>
              <a 
                href="https://wa.me/5575999999999" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors group"
              >
                Falar com o Suporte <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            <div className="bg-[#150F22]/60 border border-purple-900/30 p-5 rounded-2xl backdrop-blur-sm hover:border-purple-800/40 transition-colors">
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-400" /> Contacto Institucional
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Para dúvidas, parcerias administrativas ou suporte a portais institucionais locais.
              </p>
              <span className="text-xs font-semibold text-gray-300 block">
                suporte.sajtem@gmail.com
              </span>
            </div>
          </div>

        </main>

        {/* Rodapé da página com Copyright e Redes Sociais */}
        <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-purple-950/50 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} Saj Tem. Todos os direitos reservados.
          </div>
          
          <div className="flex items-center gap-4">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 bg-purple-950/30 border border-purple-900/40 rounded-xl text-gray-400 hover:text-white hover:bg-purple-900/40 transition-all">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 bg-purple-950/30 border border-purple-900/40 rounded-xl text-gray-400 hover:text-white hover:bg-purple-900/40 transition-all">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </footer>

      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeContent />;
      case 'search':
        return <SearchContent />;
      case 'categories':
        return <CategoriesContent />;
      case 'coupons':
        return <CouponsContent />;
      case 'profile':
        return <ProfileContent />;
      default:
        return <HomeContent />;
    }
  };

  return (
    <div className="w-full max-w-none overflow-x-hidden">
      {renderContent()}
    </div>
  );
};

export default Index;
