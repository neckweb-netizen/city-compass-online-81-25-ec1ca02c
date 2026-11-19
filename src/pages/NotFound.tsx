
import { Link, useLocation } from "react-router-dom";
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
          <Link to="/" className="inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 font-semibold text-primary underline underline-offset-4 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            Voltar ao início
          </Link>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default NotFound;
