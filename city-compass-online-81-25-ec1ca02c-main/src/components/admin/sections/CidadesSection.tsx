
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const CidadesSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Cidades</h2>
        <p className="text-muted-foreground">
          Gerencie as cidades disponíveis no sistema
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">• Criar, editar e excluir cidades</p>
            <p className="text-sm">• Upload de imagem da cidade (capa, bandeira)</p>
            <p className="text-sm">• Ativar/desativar cidade no sistema</p>
            <p className="text-sm">• Filtro de visualização por cidade</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
