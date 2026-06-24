
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Briefcase, Wrench, Plus, ArrowRight, TrendingUp, Users, MapPin, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VagaFormModal } from '@/components/forms/VagaFormModal';

const Oportunidades = () => {
  const { profile } = useAuth();
  const [isVagaModalOpen, setIsVagaModalOpen] = useState(false);
  
  const isEmpresa = profile?.tipo_conta === 'empresa';

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center shadow-xl">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground leading-tight">
              Oportunidades Profissionais
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
              Conecte-se com o mercado de trabalho local. Encontre vagas ou divulgue seus serviços.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
              <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <Link to="/oportunidades/vagas" className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Ver Vagas de Emprego
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="bg-white text-primary border-2 border-white hover:bg-primary-foreground hover:text-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <Link to="/oportunidades/servicos" className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Procurar Serviços
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Menu Principal */}
        <div className={`grid ${isEmpresa ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
          <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-card to-card/80">
            <Link to="/oportunidades/vagas">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-primary group-hover:scale-105 transition-transform duration-300">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  Vagas de Emprego
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 text-base">
                  Encontre oportunidades de trabalho na sua cidade com empresas locais
                </p>
                <div className="flex items-center text-primary font-semibold group-hover:gap-3 transition-all duration-300">
                  Ver todas as vagas
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-card to-card/80">
            <Link to="/oportunidades/servicos">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-accent-foreground group-hover:scale-105 transition-transform duration-300">
                  <div className="p-2 bg-accent rounded-lg">
                    <Wrench className="w-6 h-6" />
                  </div>
                  Serviços Autônomos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 text-base">
                  Encontre profissionais qualificados para seus projetos e necessidades
                </p>
                <div className="flex items-center text-accent-foreground font-semibold group-hover:gap-3 transition-all duration-300">
                  Ver todos os serviços
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-secondary via-card to-accent/20">
            <Link to="/oportunidades/anunciar-servico">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-secondary-foreground group-hover:scale-105 transition-transform duration-300">
                  <div className="p-2 bg-secondary-foreground/10 rounded-lg">
                    <Plus className="w-6 h-6" />
                  </div>
                  Anunciar Serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 text-base">
                  Divulgue seus serviços profissionais e alcance novos clientes
                </p>
                <div className="flex items-center text-secondary-foreground font-semibold group-hover:gap-3 transition-all duration-300">
                  Cadastrar agora
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Card para Empresas Postarem Vagas */}
          {isEmpresa && (
            <Card 
              className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-primary/5 via-card to-primary/10"
              onClick={() => setIsVagaModalOpen(true)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-primary group-hover:scale-105 transition-transform duration-300">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                  Publicar Vaga
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 text-base">
                  Divulgue uma vaga de emprego da sua empresa e alcance novos talentos
                </p>
                <div className="flex items-center text-primary font-semibold group-hover:gap-3 transition-all duration-300">
                  Criar vaga agora
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card>
          )}

        <VagaFormModal 
          open={isVagaModalOpen} 
          onOpenChange={setIsVagaModalOpen}
        />
        </div>


        {/* Categorias Populares */}
        <div className="bg-card rounded-2xl p-6 shadow-lg border">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Categorias Populares
          </h2>
          <div className="flex flex-wrap gap-3">
            {[
              'Vendas', 'Limpeza', 'Administrativo', 'Saúde', 'Construção',
              'Beleza e Estética', 'Eletricista', 'Cuidadora', 'Manicure'
            ].map((categoria) => (
              <Badge 
                key={categoria} 
                variant="secondary" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-4 py-2 text-sm font-medium hover:scale-105 hover:shadow-md"
              >
                {categoria}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Oportunidades;
