import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAvisosSistema } from '@/hooks/useAvisosSistema';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { useState, useMemo } from 'react';
import { 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlanosModal } from './PlanosModal';

const tipoAvisoConfig = {
  info: { icon: Info, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', bgColor: 'border-blue-500/20' },
  warning: { icon: AlertTriangle, color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', bgColor: 'border-yellow-500/20' },
  success: { icon: CheckCircle, color: 'bg-green-500/10 text-green-400 border-green-500/20', bgColor: 'border-green-500/20' },
  error: { icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-500/20', bgColor: 'border-red-500/20' },
  update: { icon: RefreshCw, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', bgColor: 'border-purple-500/20' },
};

export const MuralAvisos = () => {
  const { avisos, loading } = useAvisosSistema();
  const { planoAtual } = usePlanoLimites();
  const { empresa } = useMinhaEmpresa();
  const [isMinimized, setIsMinimized] = useState(false);
  const [planosModalOpen, setPlanosModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleRenovarPlano = () => {
    setPlanosModalOpen(true);
  };

  // Verifica se o plano precisa de renovação
  const avisoRenovacao = useMemo(() => {
    if (!empresa || !planoAtual || planoAtual.nome === 'Gratuito') return null;
    
    if (!(empresa as any)?.plano_data_vencimento) return null;
    
    const hoje = new Date();
    const vencimento = new Date((empresa as any).plano_data_vencimento);
    const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    // Se já expirou
    if (diasRestantes < 0) {
      return {
        id: 'plano-expirado',
        titulo: 'Plano Expirado!',
        conteudo: `Seu plano ${planoAtual.nome} expirou ${Math.abs(diasRestantes)} dia(s) atrás. Renove agora para continuar usando todos os recursos.`,
        tipo_aviso: 'error' as const,
        prioridade: 10,
        criado_em: hoje.toISOString(),
        ativo: true,
        atualizado_em: hoje.toISOString(),
        autor_id: 'system',
        data_fim: null,
        data_inicio: hoje.toISOString(),
        usuarios: { nome: 'Sistema' },
        botoes: [{
          texto: 'Renovar Plano',
          link: '#',
          cor: 'primary'
        }]
      };
    }
    
    // Se expira em 1 dia ou menos
    if (diasRestantes <= 1) {
      return {
        id: 'plano-expirando',
        titulo: 'Plano Expirando!',
        conteudo: `Seu plano ${planoAtual.nome} expira ${diasRestantes === 0 ? 'hoje' : 'amanhã'}. Renove para não perder o acesso aos recursos.`,
        tipo_aviso: 'warning' as const,
        prioridade: 8,
        criado_em: hoje.toISOString(),
        ativo: true,
        atualizado_em: hoje.toISOString(),
        autor_id: 'system',
        data_fim: null,
        data_inicio: hoje.toISOString(),
        usuarios: { nome: 'Sistema' },
        botoes: [{
          texto: 'Renovar Plano',
          link: '#',
          cor: 'primary'
        }]
      };
    }
    
    return null;
  }, [empresa, planoAtual]);

  // Combina avisos do sistema com aviso de renovação
  const todosAvisos = useMemo(() => {
    const avisosArray = [...avisos];
    if (avisoRenovacao) {
      avisosArray.unshift(avisoRenovacao as any);
    }
    return avisosArray;
  }, [avisos, avisoRenovacao]);

  if (loading) {
    return (
      <Card className="bg-[#221A32] border-purple-950/40">
        <CardHeader className="pb-3 border-b border-purple-950/50">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-400" />
              Mural de Avisos
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:bg-purple-950/40 h-8 w-8 p-0"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-purple-950/60 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-purple-950/60 rounded w-full mb-1"></div>
                <div className="h-3 bg-purple-950/60 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!todosAvisos.length) {
    return (
      <Card className="bg-[#221A32] border-purple-950/40">
        <CardHeader className="pb-3 border-b border-purple-950/50">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-400" />
              Mural de Avisos
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:bg-purple-950/40 h-8 w-8 p-0"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        {!isMinimized && (
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-400">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50 text-purple-400" />
              <p className="text-gray-200 font-semibold">Nenhum aviso no momento</p>
              <p className="text-xs text-gray-500 mt-1">Novidades e atualizações aparecerão aqui</p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="bg-[#221A32] border-purple-950/40">
      <CardHeader className="pb-3 border-b border-purple-950/50">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-purple-400" />
            Mural de Avisos
            <Badge className="bg-purple-950 border border-purple-900/60 text-purple-300 ml-2 font-black text-[11px]">
              {todosAvisos.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:bg-purple-950/40 h-8 w-8 p-0"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="pt-4">
          <div className="space-y-4">
            {todosAvisos.map((aviso) => {
              const config = tipoAvisoConfig[aviso.tipo_aviso as keyof typeof tipoAvisoConfig] || tipoAvisoConfig.info;
              const IconComponent = config.icon;
              const botoes = Array.isArray(aviso.botoes) ? aviso.botoes : [];
              
              return (
                <div key={aviso.id} className="border-l-4 border-purple-500 p-4 rounded-r-xl bg-[#0F0A19]/50 border border-y-purple-950/20 border-r-purple-950/20">
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0 text-purple-400" />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold text-white text-sm">{aviso.titulo}</h4>
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-purple-950/80 text-purple-300 border border-purple-900/40 text-[10px] font-bold">
                            {aviso.tipo_aviso === 'info' && 'Informação'}
                            {aviso.tipo_aviso === 'warning' && 'Atenção'}
                            {aviso.tipo_aviso === 'success' && 'Sucesso'}
                            {aviso.tipo_aviso === 'error' && 'Erro'}
                            {aviso.tipo_aviso === 'update' && 'Atualização'}
                          </Badge>
                          {aviso.prioridade > 0 && (
                            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                              Prioridade {aviso.prioridade}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {aviso.conteudo && (
                        <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-line">
                          {aviso.conteudo}
                        </p>
                      )}
                      
                      {botoes && botoes.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {botoes.map((botao: any, index: number) => (
                            <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              className="h-8 bg-purple-600 border-none text-white hover:bg-purple-500 transition-colors text-xs font-bold px-3.5 rounded-lg shadow-md shadow-purple-600/10"
                              onClick={() => {
                                if (botao.texto === 'Renovar Plano') {
                                  handleRenovarPlano();
                                } else {
                                  window.open(botao.link, '_blank');
                                }
                              }}
                            >
                              {botao.texto}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-[10px] text-gray-500 font-medium pt-1">
                        {new Date(aviso.criado_em).toLocaleString('pt-BR', {
                          timeZone: 'America/Sao_Paulo'
                        })}
                        {aviso.usuarios && typeof aviso.usuarios === 'object' && 'nome' in aviso.usuarios && ` • Por ${aviso.usuarios.nome}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
      
      <PlanosModal
        isOpen={planosModalOpen}
        onClose={() => setPlanosModalOpen(false)}
      />
    </Card>
  );
};
