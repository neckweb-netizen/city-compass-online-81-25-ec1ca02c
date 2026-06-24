import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShareButton } from '@/components/ui/share-button';
import { Settings, Edit3, Eye, Star, Calendar, Package, Users, TrendingUp, Heart, MessageSquare, Award } from 'lucide-react';
import { EmpresaEditForm } from './EmpresaEditForm';
import { useEmpresaStats } from '@/hooks/useEmpresaStats';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
interface EmpresaActionsProps {
  empresa: any;
}
export const EmpresaActions = ({
  empresa
}: EmpresaActionsProps) => {
  const [editFormOpen, setEditFormOpen] = useState(false);
  const {
    data: stats
  } = useEmpresaStats();
  const {
    podeEditar
  } = useMinhaEmpresa();

  // Verificar se o usuário pode editar esta empresa
  const podeEditarEstaEmpresa = podeEditar(empresa.id);
  return <div className="space-y-6">
      {/* Action Buttons - só mostra botão de editar se tiver permissão */}
      <div className="flex flex-wrap gap-3">
        {podeEditarEstaEmpresa && <Button onClick={() => setEditFormOpen(true)} className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Editar Empresa
          </Button>}
        
        <ShareButton 
          url={window.location.href}
          title={`${empresa.nome} - City Compass`}
          description={`Confira o perfil de ${empresa.nome} no City Compass`}
          variant="outline"
        />
      </div>

      {/* Stats Cards - só mostra se tiver permissão para editar */}
      {podeEditarEstaEmpresa && stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.media_avaliacoes.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Média de Avaliações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_avaliacoes}</p>
                  <p className="text-xs text-muted-foreground">Total de Avaliações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_favoritos}</p>
                  <p className="text-xs text-muted-foreground">Favoritos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.cupons_ativos}</p>
                  <p className="text-xs text-muted-foreground">Cupons Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.cupons_utilizados}</p>
                  <p className="text-xs text-muted-foreground">Cupons Utilizados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.avaliacoes_mes}</p>
                  <p className="text-xs text-muted-foreground">Avaliações este Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Form Modal - só renderiza se tiver permissão */}
      {podeEditarEstaEmpresa && <EmpresaEditForm empresa={empresa} open={editFormOpen} onOpenChange={setEditFormOpen} />}
    </div>;
};