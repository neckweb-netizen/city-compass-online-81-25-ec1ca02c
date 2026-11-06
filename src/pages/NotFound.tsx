
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BottomNavigation } from '@/components/layout/BottomNavigation';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.info(
      "Rota não encontrada:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center pb-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-4">Página não encontrada</p>
          <a href="/" className="text-primary hover:underline underline">
            Voltar ao início
          </a>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default NotFound;
