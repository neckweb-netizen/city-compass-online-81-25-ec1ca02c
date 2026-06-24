
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAvisosSistema } from '@/hooks/useAvisosSistema';
import { AvisoSistemaForm } from '../forms/AvisoSistemaForm';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
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

const tipoAvisoConfig = {
  info: { icon: Info, color: 'bg-blue-100 text-blue-800', label: 'Informação' },
  warning: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800', label: 'Atenção' },
  success: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Sucesso' },
  error: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Erro' },
  update: { icon: RefreshCw, color: 'bg-purple-100 text-purple-800', label: 'Atualização' },
};

export const AvisosSistemaSection = () => {
  const { avisos, loading, deletarAviso } = useAvisosSistema();
  const [showForm, setShowForm] = useState(false);
  const [editingAviso, setEditingAviso] = useState<any>(null);

  const handleEdit = (aviso: any) => {
    setEditingAviso(aviso);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAviso(null);
  };

  const handleDelete = (id: string) => {
    deletarAviso(id);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">Avisos do Sistema</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Avisos do Sistema</h2>
          <p className="text-muted-foreground">Gerencie avisos e comunicados para locais</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Aviso
        </Button>
      </div>

      <div className="grid gap-4">
        {avisos.map((aviso) => {
          const config = tipoAvisoConfig[aviso.tipo_aviso as keyof typeof tipoAvisoConfig] || tipoAvisoConfig.info;
          const IconComponent = config.icon;
          const botoes = Array.isArray(aviso.botoes) ? aviso.botoes : [];
          
          return (
            <Card key={aviso.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">{aviso.titulo}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={config.color}>
                          {config.label}
                        </Badge>
                        {aviso.prioridade > 0 && (
                          <Badge variant="outline">
                            Prioridade {aviso.prioridade}
                          </Badge>
                        )}
                        <Badge variant={aviso.ativo ? 'default' : 'secondary'}>
                          {aviso.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(aviso)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o aviso "{aviso.titulo}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(aviso.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {aviso.conteudo && (
                  <p className="text-muted-foreground mb-4">{aviso.conteudo}</p>
                )}
                
                {botoes && botoes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {botoes.map((botao: any, index: number) => (
                      <Button
                        key={index}
                        size="sm"
                        variant={botao.cor === 'primary' ? 'default' : 'outline'}
                        onClick={() => window.open(botao.link, '_blank')}
                      >
                        {botao.texto}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    ))}
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  <div className="flex flex-wrap gap-4">
                    <span>Criado: {new Date(aviso.criado_em).toLocaleString('pt-BR')}</span>
                    {aviso.data_inicio && (
                      <span>Início: {new Date(aviso.data_inicio).toLocaleString('pt-BR')}</span>
                    )}
                    {aviso.data_fim && (
                      <span>Fim: {new Date(aviso.data_fim).toLocaleString('pt-BR')}</span>
                    )}
                    {aviso.usuarios && typeof aviso.usuarios === 'object' && 'nome' in aviso.usuarios && <span>Por: {aviso.usuarios.nome}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {avisos.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Info className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum aviso cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando um aviso para comunicar atualizações aos locais.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Aviso
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AvisoSistemaForm 
        open={showForm}
        onOpenChange={handleCloseForm}
        aviso={editingAviso}
      />
    </div>
  );
};
