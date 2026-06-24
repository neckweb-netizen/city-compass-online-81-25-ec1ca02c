
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { DesktopSidebar } from './DesktopSidebar';
import { SecurityHeaders } from '@/components/security/SecurityHeaders';
import { RateLimitWrapper } from '@/components/security/RateLimitWrapper';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { Watermark } from '@/components/ui/watermark';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { showTutorial, closeTutorial } = useTutorial();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  
  return (
    <>
      <SecurityHeaders />
      <RateLimitWrapper maxRequests={200} windowMs={60000}>
        <div className="min-h-screen bg-background flex w-full">
          {/* Desktop Sidebar - Fixed */}
          <div className="hidden lg:block fixed left-0 top-0 h-full z-30">
            <DesktopSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          </div>
          
          {/* Main Content */}
          <div className={cn("flex-1 flex flex-col min-w-0 w-full transition-all duration-300", sidebarOpen ? "lg:ml-64" : "lg:ml-16")}>
            <Header />
            
            <main className="flex-1 pb-16 lg:pb-24 overflow-x-hidden w-full">
              {children || <Outlet />}
              <Watermark />
            </main>
            
            {/* Bottom Navigation - now visible on all devices */}
            <BottomNavigation />
          </div>
        </div>
        
        {/* Tutorial Overlay */}
        <TutorialOverlay isOpen={showTutorial} onClose={closeTutorial} />
        
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </RateLimitWrapper>
    </>
  );
};
