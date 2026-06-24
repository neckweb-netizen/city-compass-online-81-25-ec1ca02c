
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAdminCupons } from '@/hooks/useAdminCupons';
import { CupomForm } from '@/components/admin/forms/CupomForm';
import { EditCupomForm } from '@/components/admin/forms/EditCupomForm';
import { Ticket, Building2, Calendar, Percent, DollarSign, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const CuponsSection = () => {
  const { cupons, loading, toggleCupom, deleteCupom, refetch } = useAdminCupons();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gestão de Cupons</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando cupons...</p>
        </div>
      </div>
    );
  }

  const isExpired = (dataFim: string) => new Date(dataFim) < new Date();
  const isActive = (dataInicio: string, dataFim: string) => {
    const now = new Date();
    return new Date(dataInicio) <= now && new Date(dataFim) >= now;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gestão de Cupons</h2>
          <p className="text-muted-foreground">
            Gerencie os cupons cadastrados pelos locais
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Badge variant="outline" className="w-fit">
            {cupons?.length || 0} cupons cadastrados
          </Badge>
          <CupomForm onSuccess={refetch} />
        </div>
      </div>
      
      <div className="grid gap-4">
        {cupons?.map((cupom) => (
          <NeonCard key={cupom.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <Ticket className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{cupom.titulo}</span>
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{cupom.empresas?.nome}</span>
                    </span>
                    <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                      {cupom.codigo}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isExpired(cupom.data_fim) ? (
                    <Badge variant="destructive">Expirado</Badge>
                  ) : isActive(cupom.data_inicio, cupom.data_fim) ? (
                    <Badge variant="default">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Agendado</Badge>
                  )}
                  <Badge variant="outline">
                    {cupom.tipo === 'porcentagem' ? 'Percentual' : 'Valor Fixo'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {cupom.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {cupom.descricao}
                </p>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    {cupom.tipo === 'porcentagem' ? (
                      <>
                        <Percent className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>{cupom.valor}% de desconto</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>R$ {cupom.valor} de desconto</span>
                      </>
                    )}
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Início: {new Date(cupom.data_inicio).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Fim: {new Date(cupom.data_fim).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Uso:</span>
                    <span className="ml-2">
                      {cupom.quantidade_usada}
                      {cupom.quantidade_total && ` / ${cupom.quantidade_total}`}
                    </span>
                  </div>
                  
                  {cupom.quantidade_total && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{
                          width: `${Math.min((cupom.quantidade_usada / cupom.quantidade_total) * 100, 100)}%`
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Criado em: {new Date(cupom.criado_em).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cupom.ativo}
                    onCheckedChange={(checked) => 
                      toggleCupom({ id: cupom.id, ativo: checked })
                    }
                  />
                  <span className="text-sm">Cupom ativo</span>
                </div>

                <div className="flex gap-2">
                  <EditCupomForm cupom={cupom} onSuccess={refetch} />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Cupom</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover o cupom "{cupom.titulo}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCupom(cupom.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </NeonCard>
        )) || []}
        
        {(!cupons || cupons.length === 0) && (
          <NeonCard>
            <CardContent className="text-center py-12">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum cupom cadastrado ainda.
              </p>
            </CardContent>
          </NeonCard>
        )}
      </div>
    </div>
  );
};
