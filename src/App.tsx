import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Hammer } from 'lucide-react';

// Importações das suas páginas (mantenha as suas importações originais aqui)
import Index from './pages/Index';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminConfiguracoes } from './pages/admin/AdminConfiguracoes';

export default function App() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Verifica o status de manutenção no Supabase ao carregar o app
  useEffect(() => {
    const verificarManutencao = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes_sistema')
          .select('manutencao, mensagem_manutencao')
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIsMaintenance(data.manutencao ?? false);
          setMaintenanceMessage(data.mensagem_manutencao ?? 'O portal está passando por atualizações e voltará em breve.');
        }
      } catch (error) {
        console.error('Erro ao verificar status de manutenção:', error);
      } finally {
        setLoadingConfig(false);
      }
    };

    verificarManutencao();

    // Opcional: Escuta mudanças em tempo real no banco de dados
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'configuracoes_sistema' },
        (payload) => {
          if (payload.new) {
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

  if (loadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#191325] text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Se o modo manutenção estiver ativo, renderiza a tela de bloqueio
  // ATENÇÃO: Permitimos o acesso às rotas que começam com "/admin" para você conseguir entrar e desativar!
  if (isMaintenance && window.location.pathname.startsWith('/admin') === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#191325] text-white p-6 text-center">
        <div className="bg-[#231b34] p-8 rounded-2xl border border-purple-900/40 shadow-2xl max-w-md space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
            <Hammer className="h-8 w-8 animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Portal em Manutenção</h1>
            <p className="text-gray-400 text-sm">
              {maintenanceMessage}
            </p>
          </div>

          <div className="pt-2 text-xs text-purple-400/60 font-medium">
            Saj Tem • Santo Antônio de Jesus
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas do seu Site */}
        <Route path="/" element={<Index />} />
        
        {/* Exemplo de Rota do Painel Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="configuracoes" element={<AdminConfiguracoes />} />
        </Route>

        {/* Fallback de rota não encontrada */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
