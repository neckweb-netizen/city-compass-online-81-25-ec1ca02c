
import { useState } from 'react';
import { useCanalInformativo } from '@/hooks/useCanalInformativo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CanalInformativoForm } from '@/components/admin/forms/CanalInformativoForm';
import { Plus, Edit, Trash2, ExternalLink, Image, Video, FileText, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const getTypeIcon = (tipo: string) => {
  switch (tipo) {
    case 'video':
      return <Video className="w-4 h-4" />;
    case 'imagem':
      return <Image className="w-4 h-4" />;
    case 'resultado_sorteio':
      return <Trophy className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getTypeLabel = (tipo: string) => {
  switch (tipo) {
    case 'noticia':
      return 'Notícia';
    case 'video':
      return 'Vídeo';
    case 'imagem':
      return 'Imagem';
    case 'resultado_sorteio':
      return 'Resultado de Sorteio';
    default:
      return tipo;
  }
};

export const CanalInformativoSection = () => {
  const { items, loading, deleteItem } = useCanalInformativo();
  const [activeTab, setActiveTab] = useState('list');

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta publicação?')) {
      deleteItem(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Canal Informativo</h2>
          <p className="text-muted-foreground">
            Gerencie as publicações do canal informativo
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Publicações</TabsTrigger>
          <TabsTrigger value="create">Nova Publicação</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-muted rounded animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhuma publicação encontrada
                </p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Publicação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{item.titulo}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getTypeIcon(item.tipo_conteudo)}
                          {getTypeLabel(item.tipo_conteudo)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.criado_em), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-2">
                    {item.conteudo && (
                      <p className="text-sm line-clamp-3">{item.conteudo}</p>
                    )}

                    {item.tipo_conteudo === 'resultado_sorteio' && item.resultado_sorteio && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Trophy className="w-4 h-4" />
                          <span>Sorteio: {new Date(item.resultado_sorteio.data_sorteio).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Prêmio</TableHead>
                              <TableHead>Milhar</TableHead>
                              <TableHead>Grupo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.resultado_sorteio.premios.slice(0, 3).map((premio, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{premio.premio}</TableCell>
                                <TableCell>{premio.milhar || '-'}</TableCell>
                                <TableCell>{premio.grupo || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {item.resultado_sorteio.premios.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            E mais {item.resultado_sorteio.premios.length - 3} prêmios...
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {item.url_midia && (
                        <Badge variant="outline" className="text-xs">
                          📎 Mídia
                        </Badge>
                      )}
                      {item.link_externo && (
                        <Badge variant="outline" className="text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Link
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <CanalInformativoForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};
