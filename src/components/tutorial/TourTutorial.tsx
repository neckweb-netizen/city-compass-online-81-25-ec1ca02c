import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Check,
  Compass,
  LayoutDashboard,
  Menu,
  Search,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const TOUR_STORAGE_KEY = 'sajtem_visitor_tour_v2_completed';
const ACCOUNT_TOUR_STORAGE_PREFIX = 'sajtem_account_tour_v1_completed';
const TOUR_START_EVENT = 'sajtem:start-visitor-tour';
const SPOTLIGHT_PADDING = 8;

interface TourStep {
  id: string;
  title: string;
  description: string;
  hint: string;
  icon: LucideIcon;
  mobileTarget?: string;
  desktopTarget?: string;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  width: number;
  arrow: 'top' | 'bottom' | 'left' | 'right' | 'none';
}

interface TourTutorialProps {
  mode?: 'visitor' | 'account';
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const visitorSteps: TourStep[] = [
  {
    id: 'navigation',
    title: 'Seu caminho pelo Saj Tem',
    description: 'Este é o acesso principal às áreas do portal. No celular, toque no menu para ver todas as opções; no computador, use a barra lateral.',
    hint: 'Aqui você encontra locais, eventos, oportunidades, jogos e muito mais.',
    icon: Menu,
    mobileTarget: '[data-tour="mobile-menu"]',
    desktopTarget: '[data-tour="sidebar"]',
  },
  {
    id: 'search',
    title: 'Encontre o que precisa',
    description: 'Pesquise empresas, produtos ou serviços da cidade e abra o resultado sem precisar navegar por várias telas.',
    hint: 'Digite pelo menos duas letras para receber sugestões instantâneas.',
    icon: Search,
    mobileTarget: '[data-tour="home-search"]',
    desktopTarget: '[data-tour="home-search"]',
  },
  {
    id: 'tools',
    title: 'Ferramentas gratuitas',
    description: 'Acesse calculadoras, simuladores, criador de currículo, consulta FIPE, leitor de voz e outros utilitários.',
    hint: 'O atalho fica sempre disponível na navegação principal.',
    icon: Wrench,
    mobileTarget: '[data-tour="tools-nav"]',
    desktopTarget: '[data-tour="tools-nav"]',
  },
  {
    id: 'publish',
    title: 'Publique e participe',
    description: 'Use o botão central para cadastrar um local e iniciar ações disponíveis para a comunidade.',
    hint: 'Algumas ações pedem login para proteger seus dados e publicações.',
    icon: Building2,
    mobileTarget: '[data-tour="create-action"]',
    desktopTarget: '[data-tour="register-business-link"]',
  },
  {
    id: 'account',
    title: 'Entre na sua conta',
    description: 'Ao entrar, você acompanha notificações, favoritos, benefícios e recursos vinculados ao seu perfil.',
    hint: 'Empresas e administradores também acessam seus painéis por aqui.',
    icon: UserRound,
    mobileTarget: '[data-tour="auth-button"]',
    desktopTarget: '[data-tour="auth-button"]',
  },
];

const accountSteps: TourStep[] = [
  {
    id: 'account-profile',
    title: 'Seu perfil e suas preferências',
    description: 'Abra este menu para consultar seu perfil, alterar configurações e sair da conta com segurança.',
    hint: 'As opções exibidas se adaptam ao tipo da sua conta.',
    icon: UserRound,
    mobileTarget: '[data-account-tour="profile-menu"]',
    desktopTarget: '[data-account-tour="profile-menu"]',
  },
  {
    id: 'account-notifications',
    title: 'Tudo o que importa para você',
    description: 'Acompanhe avisos, respostas e interações recebidas sem perder nenhuma atualização importante.',
    hint: 'O indicador mostra quando existem notificações ainda não lidas.',
    icon: Bell,
    mobileTarget: '[data-account-tour="notifications"]',
    desktopTarget: '[data-account-tour="notifications"]',
  },
  {
    id: 'account-dashboard',
    title: 'Acesso rápido ao seu painel',
    description: 'Este atalho leva diretamente ao painel com os recursos administrativos disponíveis para sua conta.',
    hint: 'Ele aparece somente para empresas e administradores autorizados.',
    icon: LayoutDashboard,
    mobileTarget: '[data-account-tour="dashboard"]',
    desktopTarget: '[data-account-tour="dashboard"]',
  },
  {
    id: 'account-tools',
    title: 'Continue explorando as ferramentas',
    description: 'Sua conta também libera o acesso aos utilitários protegidos e mantém seus dados sincronizados.',
    hint: 'No celular, este atalho permanece disponível no menu inferior.',
    icon: Wrench,
    mobileTarget: '[data-account-tour="tools-nav"]',
    desktopTarget: '[data-account-tour="tools-nav"]',
  },
];

const getTargetSelector = (step: TourStep, isMobile: boolean) => (
  isMobile ? step.mobileTarget : step.desktopTarget
);

const isVisibleElement = (element: Element | null): element is HTMLElement => {
  if (!(element instanceof HTMLElement)) return false;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
};

const findVisibleTarget = (selector?: string) => {
  if (!selector) return null;
  return Array.from(document.querySelectorAll(selector)).find(isVisibleElement) ?? null;
};

export const TourTutorial = ({ mode = 'visitor' }: TourTutorialProps) => {
  const location = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const [tooltip, setTooltip] = useState<TooltipPosition | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const dialogRef = useRef<HTMLDivElement>(null);
  const userId = user?.id;
  const hasProfile = Boolean(profile);
  const tourSteps = mode === 'account' ? accountSteps : visitorSteps;
  const storageKey = mode === 'account' && userId
    ? `${ACCOUNT_TOUR_STORAGE_PREFIX}:${userId}`
    : TOUR_STORAGE_KEY;

  const availableSteps = useMemo(() => {
    if (!isOpen) return [];
    return tourSteps.filter((step) => {
      const selector = getTargetSelector(step, isMobile);
      return Boolean(findVisibleTarget(selector));
    });
  }, [isMobile, isOpen, tourSteps]);

  const closeTour = useCallback((completed = true) => {
    setIsOpen(false);
    setShowIntro(true);
    setCurrentStep(0);
    setHighlight(null);
    setTooltip(null);
    if (completed) localStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  const openTour = useCallback(() => {
    if (mode === 'visitor' && location.pathname !== '/') return;
    if (mode === 'account' && !userId) return;
    setShowIntro(true);
    setCurrentStep(0);
    setIsOpen(true);
  }, [location.pathname, mode, userId]);

  useEffect(() => {
    if (mode !== 'visitor') return;
    const handleManualStart = () => openTour();
    window.addEventListener(TOUR_START_EVENT, handleManualStart);
    return () => window.removeEventListener(TOUR_START_EVENT, handleManualStart);
  }, [mode, openTour]);

  useEffect(() => {
    if (authLoading) return;
    const isEligible = mode === 'visitor'
      ? !userId && location.pathname === '/'
      : Boolean(userId && hasProfile);
    if (!isEligible || localStorage.getItem(storageKey)) return;
    const timer = window.setTimeout(openTour, mode === 'account' ? 1100 : 1400);
    return () => window.clearTimeout(timer);
  }, [authLoading, hasProfile, location.pathname, mode, openTour, storageKey, userId]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTour(true);
      if (!showIntro && event.key === 'ArrowRight') {
        setCurrentStep((value) => Math.min(value + 1, availableSteps.length - 1));
      }
      if (!showIntro && event.key === 'ArrowLeft') {
        setCurrentStep((value) => Math.max(value - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [availableSteps.length, closeTour, isOpen, showIntro]);

  const updatePosition = useCallback(() => {
    if (!isOpen || showIntro || availableSteps.length === 0) return;
    const step = availableSteps[currentStep] ?? availableSteps[0];
    const selector = getTargetSelector(step, isMobile);
    const element = findVisibleTarget(selector);
    if (!isVisibleElement(element)) {
      setHighlight(null);
      setTooltip(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = Math.min(360, viewportWidth - 24);
    const estimatedCardHeight = isMobile ? 310 : 250;
    const measuredCardHeight = dialogRef.current?.getBoundingClientRect().height;
    const cardHeight = measuredCardHeight && measuredCardHeight > 100
      ? Math.ceil(measuredCardHeight)
      : estimatedCardHeight;
    const highlightTop = clamp(rect.top - SPOTLIGHT_PADDING, 4, viewportHeight - 8);
    const highlightLeft = clamp(rect.left - SPOTLIGHT_PADDING, 4, viewportWidth - 8);
    const paddedRect: HighlightRect = {
      top: highlightTop,
      left: highlightLeft,
      width: Math.min(rect.width + SPOTLIGHT_PADDING * 2, viewportWidth - highlightLeft - 4),
      height: Math.min(rect.height + SPOTLIGHT_PADDING * 2, viewportHeight - highlightTop - 4),
      borderRadius: Math.min(22, Math.max(12, Number.parseFloat(window.getComputedStyle(element).borderRadius) || 12) + 4),
    };

    let top: number;
    let left: number;
    let arrow: TooltipPosition['arrow'];

    if (isMobile) {
      left = (viewportWidth - cardWidth) / 2;
      const maxCardTop = Math.max(12, viewportHeight - cardHeight - 20);
      if (rect.top > viewportHeight / 2) {
        top = clamp(rect.top - cardHeight - 32, 12, maxCardTop);
        arrow = 'bottom';
      } else {
        top = clamp(rect.bottom + 24, 12, maxCardTop);
        arrow = 'top';
      }
    } else if (rect.right + cardWidth + 24 <= viewportWidth) {
      left = rect.right + 20;
      top = clamp(rect.top + rect.height / 2 - cardHeight / 2, 16, Math.max(16, viewportHeight - cardHeight - 16));
      arrow = 'left';
    } else if (rect.left - cardWidth - 24 >= 0) {
      left = rect.left - cardWidth - 20;
      top = clamp(rect.top + rect.height / 2 - cardHeight / 2, 16, Math.max(16, viewportHeight - cardHeight - 16));
      arrow = 'right';
    } else if (rect.bottom + cardHeight + 20 <= viewportHeight) {
      left = clamp(rect.left + rect.width / 2 - cardWidth / 2, 12, viewportWidth - cardWidth - 12);
      top = rect.bottom + 16;
      arrow = 'top';
    } else {
      left = clamp(rect.left + rect.width / 2 - cardWidth / 2, 12, viewportWidth - cardWidth - 12);
      top = Math.max(12, rect.top - cardHeight - 16);
      arrow = 'bottom';
    }

    setHighlight(paddedRect);
    setTooltip({ top, left, width: cardWidth, arrow });
  }, [availableSteps, currentStep, isMobile, isOpen, showIntro]);

  useLayoutEffect(() => {
    if (!isOpen || showIntro) return;
    updatePosition();
    const handleViewportChange = () => {
      setIsMobile(window.innerWidth < 1024);
      updatePosition();
    };
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, showIntro, updatePosition]);

  useLayoutEffect(() => {
    if (!isOpen || showIntro || !dialogRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => updatePosition());
    observer.observe(dialogRef.current);
    return () => observer.disconnect();
  }, [currentStep, isOpen, showIntro, updatePosition]);

  useEffect(() => {
    if (availableSteps.length > 0 && currentStep >= availableSteps.length) {
      setCurrentStep(availableSteps.length - 1);
    }
  }, [availableSteps.length, currentStep]);

  useEffect(() => {
    if (!isOpen || showIntro || availableSteps.length === 0) return;
    const step = availableSteps[currentStep] ?? availableSteps[0];
    const selector = getTargetSelector(step, isMobile);
    const element = findVisibleTarget(selector);
    if (isVisibleElement(element)) {
      element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      window.requestAnimationFrame(updatePosition);
    }
  }, [availableSteps, currentStep, isMobile, isOpen, showIntro, updatePosition]);

  if (!isOpen) return null;

  const step = availableSteps[currentStep];
  const StepIcon = step?.icon ?? Compass;
  const isLastStep = currentStep >= availableSteps.length - 1;
  const isAccountTour = mode === 'account';

  const startGuide = () => {
    if (availableSteps.length === 0) {
      closeTour(true);
      return;
    }
    setCurrentStep(0);
    setShowIntro(false);
  };

  const nextStep = () => {
    if (isLastStep) closeTour(true);
    else setCurrentStep((value) => value + 1);
  };

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[10000]" aria-live="polite">
      {showIntro ? (
        <div className="pointer-events-auto absolute inset-0 flex items-end justify-center bg-black/75 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="visitor-tour-title"
            tabIndex={-1}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-primary/20 bg-card shadow-2xl outline-none animate-in fade-in slide-in-from-bottom-5 duration-300 sm:zoom-in-95"
          >
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/15 to-transparent" />
            <button type="button" onClick={() => closeTour(true)} aria-label="Fechar tutorial" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="relative p-6 pt-8 text-center sm:p-8">
              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/25">
                <Compass aria-hidden="true" className="h-10 w-10" />
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-lg">
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                </span>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{isAccountTour ? 'Sua conta no Saj Tem' : 'Tour interativo'}</p>
              <h2 id="visitor-tour-title" className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">{isAccountTour ? `Olá, ${profile?.nome?.split(' ')[0] || 'bem-vindo'}!` : 'Bem-vindo ao Saj Tem'}</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{isAccountTour ? 'Sua conta está pronta. Veja onde acompanhar suas atividades, notificações e recursos pessoais.' : 'Em menos de um minuto, vamos destacar os principais atalhos e mostrar exatamente onde você deve tocar.'}</p>
              <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-muted/60 p-3 text-xs font-semibold text-muted-foreground">
                <span>{availableSteps.length} etapas</span>
                <span>Visual</span>
                <span>Rápido</span>
              </div>
              <Button type="button" onClick={startGuide} className="mt-6 h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20">
                Começar o tour
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </Button>
              <button type="button" onClick={() => closeTour(true)} className="mt-3 min-h-10 px-4 text-sm font-medium text-muted-foreground hover:text-foreground">Agora não</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="pointer-events-auto absolute inset-0" onClick={() => closeTour(true)} aria-hidden="true" />
          {highlight ? (
            <div
              aria-hidden="true"
              className="absolute border-2 border-primary bg-transparent shadow-[0_0_0_9999px_rgba(8,5,14,0.78)] transition-all duration-300"
              style={highlight}
            >
              <span className="absolute -right-2 -top-2 flex h-5 w-5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-5 w-5 rounded-full border-4 border-background bg-primary" />
              </span>
            </div>
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-black/75" />
          )}

          {step && tooltip && (
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`tour-step-${step.id}`}
              tabIndex={-1}
              className="pointer-events-auto absolute rounded-2xl border border-primary/20 bg-card p-5 shadow-2xl outline-none transition-[top,left] duration-300"
              style={{ top: tooltip.top, left: tooltip.left, width: tooltip.width }}
            >
              <span
                aria-hidden="true"
                className={
                  tooltip.arrow === 'top' ? 'absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-primary/20 bg-card' :
                  tooltip.arrow === 'bottom' ? 'absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-primary/20 bg-card' :
                  tooltip.arrow === 'left' ? 'absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-b border-l border-primary/20 bg-card' :
                  tooltip.arrow === 'right' ? 'absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-r border-t border-primary/20 bg-card' : 'hidden'
                }
              />

              <div className="relative">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <StepIcon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Etapa {currentStep + 1} de {availableSteps.length}</p>
                      <h2 id={`tour-step-${step.id}`} className="mt-0.5 text-lg font-black leading-tight text-foreground">{step.title}</h2>
                    </div>
                  </div>
                  <button type="button" onClick={() => closeTour(true)} aria-label="Fechar tutorial" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                <div className="mt-3 flex gap-2 rounded-xl bg-primary/5 p-3 text-xs leading-5 text-foreground">
                  <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{step.hint}</span>
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((currentStep + 1) / availableSteps.length) * 100}%` }} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep((value) => Math.max(0, value - 1))} disabled={currentStep === 0} className="h-10 rounded-xl px-3">
                    <ArrowLeft aria-hidden="true" className="mr-1.5 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button type="button" size="sm" onClick={nextStep} className="h-10 rounded-xl px-4 font-bold">
                    {isLastStep ? (
                      <><Check aria-hidden="true" className="mr-1.5 h-4 w-4" />Concluir</>
                    ) : (
                      <>Próximo<ArrowRight aria-hidden="true" className="ml-1.5 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>,
    document.body,
  );
};

export default TourTutorial;
