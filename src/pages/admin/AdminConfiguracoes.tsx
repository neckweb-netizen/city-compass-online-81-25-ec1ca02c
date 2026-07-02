import { useState, useEffect } from "react";
import { 
  Sliders, 
  Search, 
  ShieldAlert, 
  Code, 
  Save, 
  Globe, 
  FileText,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminConfiguracoes = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Guarda o UUID real gerado pelo banco para usar no salvamento (upsert)
  const [configId, setConfigId] = useState<string | null>(null);

  // 1. Estado de Manutenção
  const [manutencao, setManutencao] = useState(false);
  const [mensagemManutencao, setMensagemManutencao] = useState("");

  // 2. Estados de SEO Avançado
  const [seoTitulo, setSeoTitulo] = useState("");
  const [seoDescricao, setSeoDescricao] = useState("");
  const [seoTags, setSeoTags] = useState("");

  // 3. Estados de Rastreamento & Scripts
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");

  // 4. Estados de Rodapé & Links
  const [textoRodape, setTextoRodape] = useState("");
  const [whatsappSuporte, setWhatsappSuporte] = useState("");
  const [linkTermos, setLinkTermos] = useState("");

  // Carrega as configurações dinamicamente capturando a primeira linha (limit 1)
  useEffect(() => {
    const buscarConfiguracoes = async () => {
      try {
        setFetching(true);
        const { data, error } = await supabase
          .from("configuracoes_sistema")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        // Se a tabela estiver totalmente vazia, cria o primeiro registro
        if (!data) {
          const { data: newData, error: insertError } = await supabase
            .from("configuracoes_sistema")
            .insert([{}])
            .select()
            .single();

          if (insertError) throw insertError;
          if (newData) setConfigId(newData.id);
          return;
        }

        if (data) {
          setConfigId(data.id);
          setManutencao(data.manutencao ?? false);
          setMensagemManutencao(data.mensagem_manutencao ?? "O portal está passando por atualizações e voltará em breve.");
          setSeoTitulo(data.seo_titulo ?? "Saj Tem - O Maior Guia Comercial de Santo Antônio de Jesus");
          setSeoDescricao(data.seo_descricao ?? "Encontre lojas, prestadores de serviço e utilidades em Santo Antônio de Jesus.");
          setSeoTags(data.seo_tags ?? "guia comercial, santo antonio de jesus");
          setGoogleAnalyticsId(data.google_analytics_id ?? "");
          setMetaPixelId(data.meta_pixel_id ?? "");
          setTextoRodape(data.texto_rodape ?? "© 2026 Saj Tem. Todos os direitos reservados.");
          setWhatsappSuporte(data.whatsapp_suporte ?? "75999999999");
          setLinkTermos(data.link_termos ?? "https://sajtem.vercel.app/privacy");
        }
      } catch (error: any) {
        console.error("Erro ao carregar configurações do Supabase:", error);
        toast.error("Não foi possível sincronizar as configurações com o servidor.");
      } finally {
        setFetching(false);
      }
    };

    buscarConfiguracoes();
  }, []);

  // Atualiza os dados usando o UUID correto recuperado do banco
  const handleSalvarConfiguracoes = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload: any = {
        manutencao: manutencao,
        mensagem_manutencao: mensagemManutencao,
        seo_titulo: seoTitulo,
        seo_descricao: seoDescricao,
        seo_tags: seoTags,
        google_analytics_id: googleAnalyticsId,
        meta_pixel_id: metaPixelId,
        texto_rodape: textoRodape,
        whatsapp_suporte: whatsappSuporte,
        link_termos: linkTermos,
        updated_at: new Date().toISOString()
      };

      // Se já temos o ID UUID salvo, inclui no payload para atualizar a mesma linha
      if (configId) {
        payload.id = configId;
      }

      const { error } = await supabase
        .from("configuracoes_sistema")
        .upsert(payload);

      if (error) throw error;
      toast.success("Painel de configurações salvo e publicado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar dados no Supabase:", error);
      toast.error(error.message || "Ocorreu um erro ao atualizar os registros.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="h-96 flex items-center justify-center text-foreground bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Buscando variáveis operacionais no Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Configurações Gerais do Sistema</h1>
          <p className="text-muted-foreground">Mapeamento de metadados de indexação SEO, controle de tráfego, scripts de pixel e travas de manutenção.</p>
        </div>
        <Button onClick={handleSalvarConfiguracoes} disabled={loading} className="gap-2 shadow-lg shadow-primary/10">
          <Save className="h-4 w-4" />
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      <Separator />

      <Tabs defaultValue="seo" className="w-full space-y-6">
        <TabsList className="bg-card border w-full justify-start h-12 p-1 rounded-xl overflow-x-auto gap-1">
          <TabsTrigger value="seo" className="gap-2 h-10 rounded-lg"><Search className="h-4 w-4" /> SEO & Indexação</TabsTrigger>
          <TabsTrigger value="manutencao" className="gap-2 h-10 rounded-lg"><ShieldAlert className="h-4 w-4" /> Modo Manutenção</TabsTrigger>
          <TabsTrigger value="scripts" className="gap-2 h-10 rounded-lg"><Code className="h-4 w-4" /> Scripts & Analytics</TabsTrigger>
          <TabsTrigger value="layout" className="gap-2 h-10 rounded-lg"><Globe className="h-4 w-4" /> Rodapé & Suporte</TabsTrigger>
        </TabsList>

        {/* ABA 1: SEO E METADADOS DO GOOGLE */}
        <TabsContent value="seo" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
              <Search className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold text-lg">Otimização de Motores de Busca (SEO)</h3>
                <p className="text-xs text-muted-foreground">Controle as meta-tags injetadas no cabeçalho do site para melhorar o ranqueamento orgânico no Google.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="seoTitulo">Meta Title Padrão (Título da Aba)</Label>
              <Input id="seoTitulo" value={seoTitulo} onChange={(e) => setSeoTitulo(e.target.value)} placeholder="Ex: Saj Tem - Guia Comercial Completo" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescricao">Meta Description (Resumo exibido no Google)</Label>
              <Textarea id="seoDescricao" value={seoDescricao} onChange={(e) => setSeoDescricao(e.target.value)} rows={3} placeholder="Descreva o resumo do seu portal de buscas de forma comercial..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoTags">Meta Keywords (Palavras-chave separadas por vírgula)</Label>
              <Input id="seoTags" value={seoTags} onChange={(e) => setSeoTags(e.target.value)} placeholder="saj tem, empresas saj, guia santo antonio de jesus" />
            </div>
          </div>
        </TabsContent>

        {/* ABA 2: MODO MANUTENÇÃO GLOBAL */}
        <TabsContent value="manutencao" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-card border rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <div>
                <h3 className="font-bold text-lg">Controle de Disponibilidade</h3>
                <p className="text-xs text-muted-foreground">Trave temporariamente o acesso do público à área pública para realizar migrações de dados ou deploys estruturais.</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border-2 border-destructive/20 p-4 bg-destructive/5">
              <div className="space-y-0.5">
                <Label className="text-base text-destructive font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Activar Modo Manutenção
                </Label>
                <p className="text-xs text-muted-foreground">Quando ativado, os visitantes normais verão apenas a tela de manutenção personalizada.</p>
              </div>
              <Switch checked={manutencao} onCheckedChange={setManutencao} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="msgManutencao">Mensagem Customizada de Bloqueio</Label>
              <Textarea id="msgManutencao" value={mensagemManutencao} onChange={(e) => setMensagemManutencao(e.target.value)} rows={3} placeholder="Estamos em manutenção para melhorias..." />
            </div>
          </div>
        </TabsContent>

        {/* ABA 3: SCRIPTS EXTERNOS, MARKETING E TRACKING */}
        <TabsContent value="scripts" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
              <Code className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-lg">Integrações de Tráfego e Rastreamento</h3>
                <p className="text-xs text-muted-foreground">Injete IDs de monitoramento global de campanhas e métricas sem precisar recompilar a Vercel.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="analyticsId">Google Analytics ID (G-XXXXXXX)</Label>
              <Input id="analyticsId" value={googleAnalyticsId} onChange={(e) => setGoogleAnalyticsId(e.target.value)} placeholder="G-A1B2C3D4E5" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pixelId">Meta Pixel ID (Facebook Ads)</Label>
              <Input id="pixelId" value={metaPixelId} onChange={(e) => setMetaPixelId(e.target.value)} placeholder="123456789012345" />
            </div>
          </div>
        </TabsContent>

        {/* ABA 4: LAYOUT DE FOOTER E INFORMAÇÕES AUXILIARES */}
        <TabsContent value="layout" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3"><Globe className="h-5 w-5 text-sky-500" /> Propriedades Fixas do Rodapé</h3>
              
              <div className="space-y-2">
                <Label htmlFor="textoFooter">Texto de Direitos Autorais (Copyright)</Label>
                <Input id="textoFooter" value={textoRodape} onChange={(e) => setTextoRodape(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkPrivacidade">URL Oficial da Política de Privacidade</Label>
                <Input id="linkPrivacidade" value={linkTermos} onChange={(e) => setLinkTermos(e.target.value)} />
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3"><FileText className="h-5 w-5 text-emerald-500" /> Atendimento de Suporte</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsappAdmin">WhatsApp Oficial de Atendimento Geral</Label>
                  <Input id="whatsappAdmin" value={whatsappSuporte} onChange={(e) => setWhatsappSuporte(e.target.value)} placeholder="Ex: 75999999999" />
                </div>
              </div>
              
              <div className="pt-4 border-t mt-4 flex gap-2 items-center text-xs text-muted-foreground">
                <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <span>As chaves de cabeçalho injetam automaticamente dados estruturados e de rastreio em tempo real na raiz do documento indexado.</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
