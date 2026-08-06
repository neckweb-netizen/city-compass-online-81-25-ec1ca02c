import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowRight, ArrowLeft, X, Compass, Wrench, Building2, MessageSquare } from 'lucide-react';

interface PassoTutorial {
  titulo: string;
  descricao: string;
  icone: React.ElementType;
  rotaSugerida?: string;
}

const PASSOS: PassoTutorial[] = [
  {
    titulo: "Bem-vindo ao SAJ TEM! 🚀",
    descricao: "O seu guia comercial completo em Santo Antônio de Jesus. Vamos fazer um tour rápido pelas principais funções do portal?",
    icone: Compass,
  },
  {
    titulo: "Busca de Locais e Empresas 🏢",
    descricao: "Encontre comércios, lojas, farmácias, profissionais autônomos e serviços essenciais da cidade de forma instantânea.",
    icone: Building2,
  },
  {
    titulo: "Central de Ferramentas Úteis 🛠️",
    descricao: "Acesse utilitários gratuitos como Criador de Currículo, Calculadora de Maquininha, Leitor de Voz e Simuladores CLT.",
    icone: Wrench,
  },
  {
    titulo: "Voz do Povo & Canal Informativo 📢",
    descricao: "Fique por dentro de tudo o que acontece na região, participe de enquetes e envie relatos para a comunidade.",
    icone: MessageSquare,
  },
];

export const TourTutorial = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [passoAtual, setPassoAtual] = useState(0);

  // Verificar se é a primeira visita do usuário (usando localStorage)
  useEffect(() => {
    const jaViu = localStorage.getItem('sajtem_tour_realizado');
    if (!jaViu) {
      // Pequeno atraso para carregar a página antes de abrir o tour
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleFechar = () => {
    setIsOpen(false);
    localStorage.setItem('sajtem_tour_realizado', 'true');
  };

  const handleProximo = () => {
    if (passoAtual < PASSOS.length - 1) {
      setPassoAtual(passoAtual + 1);
    } else {
      handleFechar();
    }
  };

  const handleAnterior = () => {
    if (passoAtual > 0) {
      setPassoAtual(passoAtual - 1);
    }
  };

  if (!isOpen) return null;

  const passo = PASSOS[passoAtual];
  const IconComponent = passo.icone;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md bg-background border-border shadow-2xl rounded-3xl overflow-hidden relative scale-100 transition-all">
        
        {/* BOTÃO DE FECHAR */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleFechar}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground h-8 w-8 rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>

        <CardContent className="p-6 sm:p-8 space-y-6 text-center">
          
          {/* INDICADOR DE PASSOS */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {PASSOS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === passoAtual ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`} 
              />
            ))}
          </div>

          {/* ÍCONE DE DESTAQUE */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-inner">
            <IconComponent className="w-8 h-8" />
          </div>

          {/* TÍTULO E DESCRIÇÃO */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest block">
              Passo {passoAtual + 1} de {PASSOS.length}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {passo.titulo}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              {passo.descricao}
            </p>
          </div>

          {/* BOTÕES DE NAVEGAÇÃO */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/40">
            {passoAtual > 0 ? (
              <Button 
                variant="outline" 
                onClick={handleAnterior}
                className="rounded-xl text-xs font-bold gap-1.5 h-10 px-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Anterior
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                onClick={handleFechar}
                className="rounded-xl text-xs text-muted-foreground h-10 px-4"
              >
                Pular tour
              </Button>
            )}

            <Button 
              onClick={handleProximo}
              className="rounded-xl text-xs font-bold gap-1.5 h-10 px-6 bg-primary hover:bg-primary/90 shadow-lg"
            >
              {passoAtual === PASSOS.length - 1 ? 'Começar Agora' : 'Próximo'} 
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default TourTutorial;
