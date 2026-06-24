
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAdminEmpresas } from '@/hooks/useAdminEmpresas';
import { 
  Building2, 
  Mail, 
  User, 
  MapPin, 
  Phone, 
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AcaoEmpresaDialogProps {
  empresa: any;
  tipo: 'aprovar' | 'rejeitar';
  onConfirm: (observacoes?: string) => void;
}

const AcaoEmpresaDialog = ({ empresa, tipo, onConfirm }: AcaoEmpresaDialogProps) => {
  const [observacoes, setObservacoes] = useState('');
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm(observacoes);
    setObservacoes('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={tipo === 'aprovar' ? 'default' : 'destructive'}
        >
          {tipo === 'aprovar' ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tipo === 'aprovar' ? 'Aprovar' : 'Rejeitar'} Empresa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Você está prestes a {tipo === 'aprovar' ? 'aprovar' : 'rejeitar'} a empresa "{empresa.nome}".
          </p>
          
          <div>
            <label className="text-sm font-medium">
              Observações {tipo === 'rejeitar' ? '(obrigatório)' : '(opcional)'}
            </label>
            <Textarea
              placeholder={
                tipo === 'aprovar' 
                  ? 'Adicione observações sobre a aprovação...'
                  : 'Explique o motivo da rejeição...'
              }
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              variant={tipo === 'aprovar' ? 'default' : 'destructive'}
              disabled={tipo === 'rejeitar' && !observacoes.trim()}
            >
              Confirmar {tipo === 'aprovar' ? 'Aprovação' : 'Rejeição'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const EmpresasPendentesSection = () => {
  const { empresasPendentes, loadingPendentes, aprovarEmpresa, rejeitarEmpresa } = useAdminEmpresas();

  if (loadingPendentes) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Empresas Pendentes</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando empresas pendentes...</p>
        </div>
      </div>
    );
  }

  const abrirWhatsApp = (telefone: string, nomeEmpresa: string) => {
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá! Sua empresa "${nomeEmpresa}" foi aprovada no Guia Saj! Agora ela está visível para todos os usuários da plataforma. Obrigado por fazer parte da nossa comunidade de negócios locais!`
    );
    window.open(`https://wa.me/${numeroLimpo}?text=${mensagem}`, '_blank');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Empresas Pendentes</h2>
          <p className="text-muted-foreground">
            Gerencie as empresas aguardando aprovação
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {empresasPendentes.length} pendentes
        </Badge>
      </div>

      <div className="grid gap-4">
        {empresasPendentes.map((empresa) => (
          <Card key={empresa.id} className="overflow-hidden border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <Building2 className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{empresa.nome}</span>
                    <Badge variant="secondary">Pendente</Badge>
                  </CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{empresa.usuario?.nome}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{empresa.usuario?.email}</span>
                    </span>
                    {empresa.usuario?.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{empresa.usuario.telefone}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      {new Date(empresa.criado_em).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge variant="outline">
                  {empresa.categorias?.nome}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {empresa.descricao && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Descrição:</h4>
                  <p className="text-sm text-muted-foreground">{empresa.descricao}</p>
                </div>
              )}
              
              {empresa.endereco && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{empresa.endereco}</span>
                </div>
              )}

              {empresa.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{empresa.telefone}</span>
                </div>
              )}

              {empresa.site && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={empresa.site} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {empresa.site}
                  </a>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <p>Cidade: {empresa.cidades?.nome}</p>
                  <p>Slug: <span className="font-mono text-xs">{empresa.slug}</span></p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <AcaoEmpresaDialog
                    empresa={empresa}
                    tipo="aprovar"
                    onConfirm={(observacoes) => 
                      aprovarEmpresa({ id: empresa.id, observacoes })
                    }
                  />
                  
                  <AcaoEmpresaDialog
                    empresa={empresa}
                    tipo="rejeitar"
                    onConfirm={(observacoes) => 
                      rejeitarEmpresa({ id: empresa.id, observacoes: observacoes! })
                    }
                  />

                  {empresa.usuario?.telefone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirWhatsApp(empresa.usuario.telefone, empresa.nome)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {empresasPendentes.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma empresa pendente de aprovação.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
