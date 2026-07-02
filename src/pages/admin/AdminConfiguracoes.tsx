import { useState } from "react";
import { 
  Sliders, 
  Coins, 
  ShieldCheck, 
  Map, 
  Smartphone, 
  BellRing, 
  Save, 
  Percent, 
  Layers, 
  Image, 
  FileText,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const AdminConfiguracoes = () => {
  const [loading, setLoading] = useState(false);

  // Estados Simulados para controle das Configurações do Sistema
  const [nomeSistema, setNomeSistema] = useState("Saj Tem");
  const [cidadeBase, setCidadeBase] = useState("Santo Antônio de Jesus");
  const [estadoBase, setEstadoBase] = useState("BA");
  const [manutencao, setManutencao] = useState(false);
  const [aprovacaoAutomatica, setAprovacaoAutomatica] = useState(false);

  // Estados Simulados de Monetização e Valores
  const [valorPlanoPremium, setValorPlanoPremium] = useState("49.90");
  const [valorBannerTopo, setValorBannerTopo] = useState("89.90");
  const [valorCupomDestaque, setValorCupomDestaque] = useState("19.90");
  const [comissaoProdutos, setComissaoProdutos] = useState("10");

  // Estados de Integrações e APIs
  const [whatsappSuporte, setWhatsappSuporte] = useState("75999999999");
  const [linkTermos, setLinkTermos] = useState("https://sajtem.vercel.app/privacy");

  const handleSalvarConfiguracoes = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      toast.success("Todas as configurações foram sincronizadas com sucesso!");
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Configurações Avançadas</h1>
          <p className="text-muted-foreground">Gerencie o comportamento do portal, valores de planos, taxas de anúncios e chaves operacionais.</p>
        </div>
        <Button onClick={handleSalvarConfiguracoes} disabled={loading} className="gap-2 shadow-lg shadow-primary/10">
          <Save className="h-4 w-4" />
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Separator />

      <Tabs defaultValue="geral" className="w-full space-y-6">
        <TabsList className="bg-card border w-full justify-start h-12 p-1 rounded-xl overflow-x-auto gap-1">
          <TabsTrigger value="geral" className="gap-2 h-10 rounded-lg"><Sliders className="h-4 w-4" /> Geral do App</TabsTrigger>
          <TabsTrigger value="monetizacao" className="gap-2 h-10 rounded-lg"><Coins className="h-4 w-4" /> Financeiro & Anúncios</TabsTrigger>
          <TabsTrigger value="localizacao" className="gap-2 h-10 rounded-lg"><Map className="h-4 w-4" /> Município & Filtros</TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2 h-10 rounded-lg"><BellRing className="h-4 w-4" /> Alertas & Gateways</TabsTrigger>
        </TabsList>

        {/* ABA 1: CONFIGURAÇÕES GERAIS */}
        <TabsContent value="geral" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3"><Smartphone className="h-5 w-5 text-primary" /> Identidade do Portal</h3>
              
              <div className="space-y-2">
                <Label htmlFor="nomeApp">Nome da Plataforma</Label>
                <Input id="nomeApp" value={nomeSistema} onChange={(e) => setNomeSistema(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp de Suporte Técnico</Label>
                <Input id="whatsapp" value={whatsappSuporte} onChange={(e) => setWhatsappSuporte(e.target.value)} placeholder="DDD + Número" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urlTermos">Link dos Termos de Uso e Privacidade</Label>
                <Input id="urlTermos" value={linkTermos} onChange={(e) => setLinkTermos(e.target.value)} />
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-6 space-y-6 shadow-sm">
              <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3"><ShieldCheck className="h-5 w-5 text-amber-500" /> Moderação & Regras de Negócio</h3>
              
              <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-base">Moderação Prévia de Empresas</Label>
                  <p className="text-xs text-muted-foreground">Novos cadastros entram direto no ar ou passam pela aprovação do admin?</p>
                </div>
                <Switch checked={aprovacaoAutomatica} onCheckedChange={setAprovacaoAutomatica} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-base text-destructive font-semibold">Modo Manutenção Geral</Label>
                  <p className="text-xs text-muted-foreground">Bloqueia o aplicativo público exibindo uma tela de ajustes internos.</p>
                </div>
                <Switch checked={manutencao} onCheckedChange={setManutencao} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ABA 2: FINANCEIRO E VALORES DE MONETIZAÇÃO */}
        <TabsContent value="monetizacao" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2"><Coins className="h-5 w-5 text-emerald-500" /> Tabela de Preços e Cobranças Automáticas</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Defina os valores padrão que serão cobrados via link de checkout ou PIX para ativação de planos avançados.</p>
            </div>
            
            <Separator />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 p-4 border rounded-xl bg-muted/20">
                <Label className="font-semibold flex items-center gap-1.5"><Layers className="h-4 w-4 text-amber-500" /> Assinatura Premium (Mês)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input type="number" className="pl-9" value={valorPlanoPremium} onChange={(e) => setValorPlanoPremium(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2 p-4 border rounded-xl bg-muted/20">
                <Label className="font-semibold flex items-center gap-1.5"><Image className="h-4 w-4 text-blue-500" /> Aluguel de Banner (Mês)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input type="number" className="pl-9" value={valorBannerTopo} onChange={(e) => setValorBannerTopo(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2 p-4 border rounded-xl bg-muted/20">
                <Label className="font-semibold flex items-center gap-1.5"><Percent className="h-4 w-4 text-violet-500" /> Impulsionar Cupom (7 dias)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input type="number" className="pl-9" value={valorCupomDestaque} onChange={(e) => setValorCupomDestaque(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2 p-4 border rounded-xl bg-muted/20">
                <Label className="font-semibold flex items-center gap-1.5"><FileText className="h-4 w-4 text-emerald-500" /> Taxa de Venda de Catálogo</Label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  <Input type="number" className="pr-8" value={comissaoProdutos} onChange={(e) => setComissaoProdutos(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ABA 3: LOCALIZAÇÃO E FILTROS GEOGRÁFICOS */}
        <TabsContent value="localizacao" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3"><Map className="h-5 w-5 text-sky-500" /> Abrangência e Município de Atuação</h3>
            
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cidadeFiltro">Cidade Polo Principal</Label>
                <Input id="cidadeFiltro" value={cidadeBase} onChange={(e) => setCidadeBase(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estadoFiltro">Estado (UF)</Label>
                <Input id="estadoFiltro" value={estadoBase} maxLength={2} onChange={(e) => setEstadoBase(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="limiteDistancia">Raio Máximo de Busca Local</Label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">KM</span>
                  <Input id="limiteDistancia" type="number" defaultValue="45" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ABA 4: INTEGRAÇÃO DE SINAIS E GATEWAYS */}
        <TabsContent value="notificacoes" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3"><BellRing className="h-5 w-5 text-rose-500" /> Provedores de Gateways (API)</h3>
              
              <div className="space-y-2">
                <Label>Token de Integração do Asaas / Mercado Pago (PIX)</Label>
                <Input type="password" value="****************************************" disabled />
              </div>

              <div className="space-y-2">
                <Label>API Key do Disparo de Notificações Push (OneSignal)</Label>
                <Input type="password" value="****************************************" disabled />
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3"><HelpCircle className="h-5 w-5 text-muted-foreground" /> Links Rápidos do Desenvolvedor</h3>
                <p className="text-sm text-muted-foreground">Essas chaves de API ocultas são gerenciadas de forma criptografada diretamente pelo painel do Supabase nas variáveis de ambiente (`process.env`).</p>
              </div>
              <div className="pt-4 flex gap-2">
                <a href="https://supabase.com" target="_blank" rel="noreferrer" className="w-full text-center text-xs py-2 border rounded-lg bg-muted/40 hover:bg-muted font-medium transition-colors">Acessar Banco Supabase</a>
                <a href="https://vercel.com" target="_blank" rel="noreferrer" className="w-full text-center text-xs py-2 border rounded-lg bg-muted/40 hover:bg-muted font-medium transition-colors">Servidor Vercel</a>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
