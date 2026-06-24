import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { LugarPublicoForm } from '@/components/admin/forms/LugarPublicoForm';
import { useLugaresPublicosAdmin, useDeleteLugarPublico, type LugarPublico } from '@/hooks/useLugaresPublicos';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const tipoLabels: Record<string, string> = {
  'praca': 'Praça',
  'biblioteca': 'Biblioteca',
  'cinema': 'Cinema',
  'parque': 'Parque',
  'terminal': 'Terminal',
  'estacao': 'Estação',
  'cultura': 'Centro Cultural',
  'shopping': 'Shopping',
  'mercado': 'Mercado',
  'hospital': 'Hospital',
  'escola': 'Escola',
  'museu': 'Museu'
};

export const LugaresPublicosSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLugar, setEditingLugar] = useState<LugarPublico | undefined>();

  const { data: lugares, isLoading } = useLugaresPublicosAdmin();
  const deleteMutation = useDeleteLugarPublico();

  const filteredLugares = lugares?.filter(lugar =>
    lugar.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lugar.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lugar.endereco && lugar.endereco.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (lugar: LugarPublico) => {
    setEditingLugar(lugar);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingLugar(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lugares Públicos</h2>
          <p className="text-muted-foreground">
            Gerencie os lugares públicos e pontos de interesse da cidade
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLugar(undefined)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Lugar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLugar ? 'Editar Lugar Público' : 'Novo Lugar Público'}
              </DialogTitle>
            </DialogHeader>
            <LugarPublicoForm 
              lugar={editingLugar} 
              onSuccess={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Buscar lugares..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filteredLugares && filteredLugares.length > 0 ? (
              filteredLugares.map((lugar: any) => (
                <TableRow key={lugar.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{lugar.nome}</span>
                      {lugar.destaque && (
                        <Badge variant="default" className="text-xs">Destaque</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {tipoLabels[lugar.tipo] || lugar.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {lugar.endereco || '-'}
                  </TableCell>
                  <TableCell>
                    -
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {lugar.ativo ? (
                        <>
                          <Eye className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">Ativo</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-500">Inativo</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(lugar)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o lugar "{lugar.nome}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(lugar.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Nenhum lugar encontrado' : 'Nenhum lugar público cadastrado'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};