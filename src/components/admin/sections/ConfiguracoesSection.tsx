import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Database, Shield, Globe, Wrench, DollarSign, FileText, NotebookPen, Calculator, Percent, FileSpreadsheet, Volume2, Ticket } from 'lucide-react';

export const ConfiguracoesSection = () => {
  const ferramentasAtivas = [
    { nome: 'Gerador & Caderno de Rifas', categoria: 'Sorteios', icone: Ticket },
    { nome: 'Gerador de Cobrança PIX', categoria: 'Financeiro', icone: DollarSign },
    { nome: 'Criador de Currículo PDF', categoria: 'Carreira', icone: FileText },
    { nome: 'Caderno de Cobranças & CRM', categoria: 'Gestão', icone: NotebookPen },
    { nome: 'Calculadora de Hora & Orçamento', categoria: 'Precificação', icone: Calculator },
    { nome: 'Calculadora de Margem & Maquininha', categoria: 'Comércio', icone: Percent },
    { nome: 'Simulador de Rescisão (CLT)', categoria: 'Trabalho', icone: FileSpreadsheet },
    { nome: 'Leitor de Texto em Voz Alta', categoria: 'Acessibilidade', icone: Volume2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Configurações Gerais</h2>
        <p className="text-muted-foreground">
          Configure as opções gerais do sistema e utilitários
        </p>
      </div>
      
      <div className="grid gap-6">

        {/* SECTION DEDICADA DE GESTÃO DE FERRAMENTAS */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Gestão da Central de Ferramentas
              </div>
              <Badge variant="default" className="bg-primary">
                {ferramentasAtivas.length} Ferramentas Ativas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ferramentasAtivas.map((item, index) => {
                const Icone = item.icone;
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Icone className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h5 className="text-xs font-bold text-foreground truncate">{item.nome}</h5>
                        <span className="text-[10px] text-muted-foreground block">{item.categoria}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                      Ativo
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuração do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Modo de Operação</h4>
                  <p className="text-sm text-muted-foreground">
                    Sistema configurado para cidade única
                  </p>
                </div>
                <Badge variant="default">Cidade Única</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Autenticação</h4>
                  <p className="text-sm text-muted-foreground">
                    Sistema de login ativo com Supabase
                  </p>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Armazenamento</h4>
                  <p className="text-sm text-muted-foreground">
                    Buckets configurados para imagens
                  </p>
                </div>
                <Badge variant="default">Configurado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Tabelas principais:</span>
                  <span className="font-medium">8 tabelas</span>
                </div>
                <div className="flex justify-between">
                  <span>Funções customizadas:</span>
                  <span className="font-medium">12 funções</span>
                </div>
                <div className="flex justify-between">
                  <span>Views materializadas:</span>
                  <span className="font-medium">2 views</span>
                </div>
                <div className="flex justify-between">
                  <span>RLS (Row Level Security):</span>
                  <Badge variant="default">Ativo</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Segurança e Permissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Tipos de Conta Disponíveis</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="destructive">Admin Geral</Badge>
                  <Badge variant="secondary">Admin Cidade</Badge>
                  <Badge variant="default">Empresa</Badge>
                  <Badge variant="outline">Usuário</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Políticas de Segurança</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Usuários só acessam próprios dados</p>
                  <p>• Locais gerenciam próprio conteúdo</p>
                  <p>• Admins têm acesso baseado em escopo</p>
                  <p>• Dados públicos visíveis para todos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Funcionalidades Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Módulos Principais</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Gestão de Locais</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sistema de Avaliações</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cupons e Promoções</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gestão de Eventos</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Recursos Adicionais</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Central de Ferramentas</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Upload de Imagens</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Busca por Localização</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dashboard Admin</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
