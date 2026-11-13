import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { SecurityHeaders } from '@/components/security/SecurityHeaders';
import { RateLimitWrapper } from '@/components/security/RateLimitWrapper';
import { Watermark } from '@/components/ui/watermark';
import { cn } from '@/lib/utils';

// The public first paint must not require the guided tour, assistant chat,
// and desktop-only menu JavaScript before it can show the homepage.
const DesktopSidebar = lazy(() =>
  import('./DesktopSidebar').then((module) => ({ default: module.DesktopSidebar })),
);
const TourTutorial = lazy(() =>
  import('@/components/tutorial/TourTutorial').then((module) => ({ default: module.TourTutorial })),
);
const AiAssistantChat = lazy(() =>
  import('@/components/ai/AiAssistantChat').then((module) => ({ default: module.AiAssistantChat })),
);

export const PublicLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const [tourReady, setTourReady] = useState(false);
  const [assistantReady, setAssistantReady] = useState(false);
  const [tourRequested, setTourRequested] = useState(false);
  const [assistantRequested, setAssistantRequested] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    // Defer secondary modules until the home begins painting. A manual click
    // bypasses the deferral and the intent survives the async module download.
    const tourTimer = window.setTimeout(() => setTourReady(true), 1400);
    const assistantTimer = window.setTimeout(() => setAssistantReady(true), 3000);
    const startTour = () => {
      setTourRequested(true);
      setTourReady(true);
    };
    const openAssistant = () => {
      setAssistantRequested(true);
      setAssistantReady(true);
    };
    window.addEventListener('sajtem:start-visitor-tour', startTour);
    window.addEventListener('sajtem:open-assistant', openAssistant);
    return () => {
      window.clearTimeout(tourTimer);
      window.clearTimeout(assistantTimer);
      window.removeEventListener('sajtem:start-visitor-tour', startTour);
      window.removeEventListener('sajtem:open-assistant', openAssistant);
    };
  }, []);

  return (
    <>
      <SecurityHeaders />
      <RateLimitWrapper maxRequests={200} windowMs={60000}>
        <div className="min-h-screen bg-background flex w-full">
          {tourReady && (
            <Suspense fallback={null}>
              <TourTutorial initialStart={tourRequested} />
              <TourTutorial mode="account" />
            </Suspense>
          )}

          {desktop && (
            <div className="fixed left-0 top-0 z-30 hidden h-full lg:block">
              <Suspense fallback={null}>
                <DesktopSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
              </Suspense>
            </div>
          )}

          <div className={cn("flex-1 flex flex-col min-w-0 w-full transition-all duration-300", sidebarOpen ? "lg:ml-64" : "lg:ml-16")}>
            <Header sidebarOpen={sidebarOpen} />
            <main className="flex-1 pb-28 lg:pb-12 overflow-x-hidden w-full">
              <Outlet />
              <Watermark />
            </main>
            <BottomNavigation />
          </div>
        </div>

        {assistantReady && (
          <Suspense fallback={null}>
            <AiAssistantChat initialOpen={assistantRequested} />
          </Suspense>
        )}
      </RateLimitWrapper>
    </>
  );
};
