import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'sidebar',
    title: 'Menu Lateral',
    description: 'Aqui você encontra todas as principais seções do site: empresas, eventos, oportunidades e muito mais!',
    targetSelector: '[data-tutorial="sidebar"]',
    position: 'right'
  },
  {
    id: 'bottom-nav',
    title: 'Menu Inferior',
    description: 'Navegação rápida sempre ao seu alcance! Acesse facilmente as principais funcionalidades.',
    targetSelector: '[data-tutorial="bottom-nav"]',
    position: 'top'
  },
  {
    id: 'auth-button',
    title: 'Entrar',
    description: 'Clique aqui para acessar opções de login e cadastro!',
    targetSelector: '[data-tutorial="auth-button"]',
    position: 'bottom',
    action: () => {
      const authButton = document.querySelector('[data-tutorial="auth-button"]') as HTMLElement;
      if (authButton) {
        authButton.click();
      }
    }
  },
  {
    id: 'create-account',
    title: 'Criar Conta de Usuário',
    description: 'Clique aqui para se cadastrar como usuário comum e aproveitar todas as funcionalidades!',
    targetSelector: '[data-tutorial="create-account"]',
    position: 'left'
  },
  {
    id: 'register-business',
    title: 'Cadastrar Empresa',
    description: 'Tem uma empresa? Clique aqui para cadastrá-la e começar a divulgar seus produtos e serviços!',
    targetSelector: '[data-tutorial="register-business"]',
    position: 'top'
  }
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialOverlay = ({ isOpen, onClose }: TutorialOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    if (showIntro) return;

    const step = tutorialSteps[currentStep];
    const element = document.querySelector(step.targetSelector) as HTMLElement;
    setTargetElement(element);

    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
    }
  }, [currentStep, isOpen, showIntro]);

  const nextStep = () => {
    // Execute action if exists
    const currentStepData = tutorialSteps[currentStep];
    if (currentStepData.action) {
      currentStepData.action();
      // Wait for the action to complete before moving to next step
      setTimeout(() => {
        if (currentStep < tutorialSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          onClose();
        }
      }, 500);
    } else {
      if (currentStep < tutorialSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onClose();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startTutorial = () => {
    setShowIntro(false);
    setCurrentStep(0);
  };

  const getTooltipPosition = () => {
    if (!targetElement) return {};

    const rect = targetElement.getBoundingClientRect();
    const step = tutorialSteps[currentStep];
    
    switch (step.position) {
      case 'right':
        return {
          left: rect.right + 20,
          top: rect.top + rect.height / 2,
          transform: 'translateY(-50%)'
        };
      case 'left':
        return {
          right: window.innerWidth - rect.left + 20,
          top: rect.top + rect.height / 2,
          transform: 'translateY(-50%)'
        };
      case 'top':
        return {
          left: rect.left + rect.width / 2,
          bottom: window.innerHeight - rect.top + 20,
          transform: 'translateX(-50%)'
        };
      case 'bottom':
        return {
          left: rect.left + rect.width / 2,
          top: rect.bottom + 20,
          transform: 'translateX(-50%)'
        };
      default:
        return {};
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with spotlight effect */}
      <div className="absolute inset-0">
        {/* Dark overlay for the entire screen */}
        <div className="absolute inset-0 bg-black/80" />
        
        {/* Spotlight clear area */}
        {targetElement && !showIntro && (
          <div
            className="absolute bg-transparent border-4 border-white rounded-lg shadow-2xl shadow-white/30"
            style={{
              left: targetElement.getBoundingClientRect().left - 12,
              top: targetElement.getBoundingClientRect().top - 12,
              width: targetElement.getBoundingClientRect().width + 24,
              height: targetElement.getBoundingClientRect().height + 24,
              pointerEvents: 'none',
              boxShadow: `
                0 0 0 9999px rgba(0, 0, 0, 0.8),
                0 0 30px rgba(255, 255, 255, 0.5),
                inset 0 0 0 4px rgba(255, 255, 255, 0.8)
              `
            }}
          />
        )}
      </div>

      {/* Intro Card */}
      {showIntro && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 text-center animate-scale-in">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-primary">
              Bem-vindo ao Saj Tem! 🎉
            </h2>
            <p className="text-muted-foreground mb-6">
              Vamos fazer um tour rápido para você descobrir todas as funcionalidades incríveis do nosso site!
            </p>
            <div className="space-y-3">
              <Button onClick={startTutorial} className="w-full">
                Começar o Tour
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Pular Tutorial
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tutorial Tooltip */}
      {!showIntro && (
        <div
          className={cn(
            "absolute z-60 max-w-xs w-full p-4",
            "sm:max-w-sm"
          )}
          style={{
            ...getTooltipPosition(),
            // Responsive adjustments
            ...(window.innerWidth < 640 && {
              left: '50%',
              top: '20px',
              transform: 'translateX(-50%)',
              right: 'auto',
              bottom: 'auto'
            })
          }}
        >
          <Card className="p-4 animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-primary">
                {tutorialSteps[currentStep].title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {tutorialSteps[currentStep].description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>

              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" onClick={nextStep}>
                  {currentStep === tutorialSteps.length - 1 ? 'Finalizar' : 'Próximo'}
                  {currentStep < tutorialSteps.length - 1 && (
                    <ArrowRight className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-2 text-center">
              Passo {currentStep + 1} de {tutorialSteps.length}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};