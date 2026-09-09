import { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { LegalPageLayout, type LegalSection } from '@/components/legal/LegalPageLayout';

const listClassName = 'list-disc space-y-2 pl-5 marker:text-primary';

const sections: LegalSection[] = [
  {
    id: 'aplicacao', title: 'Sobre esta política', content: (
      <>
        <p>Esta Política de Privacidade explica como o Saj Tem trata dados pessoais quando você usa o site, o aplicativo instalado (PWA), cria uma conta, cadastra uma empresa ou interage com os recursos da plataforma.</p>
        <p>Para fins da Lei Geral de Proteção de Dados Pessoais (LGPD), o Saj Tem atua como controlador dos dados tratados para operar a plataforma. Empresas anunciantes também podem ser controladoras independentes dos dados recebidos diretamente em seus próprios canais.</p>
      </>
    ),
  },
  {
    id: 'dados-coletados', title: 'Dados que podemos tratar', content: (
      <>
        <p>Os dados variam conforme os recursos utilizados e podem incluir:</p>
        <ul className={listClassName}>
          <li><strong className="text-foreground">Conta e perfil:</strong> nome, e-mail, telefone, foto, cidade e informações de autenticação.</li>
          <li><strong className="text-foreground">Empresas e serviços:</strong> dados comerciais, responsáveis, endereços, horários, imagens, produtos, eventos e informações de atendimento.</li>
          <li><strong className="text-foreground">Conteúdo e interações:</strong> publicações, comentários, reações, avaliações, denúncias, reservas, inscrições e mensagens enviadas pela plataforma.</li>
          <li><strong className="text-foreground">Localização:</strong> posição aproximada ou precisa, somente quando você autoriza o navegador ou dispositivo, para mostrar locais e rotas relevantes.</li>
          <li><strong className="text-foreground">Notificações:</strong> preferências e identificadores técnicos necessários para enviar avisos ao dispositivo, quando houver permissão.</li>
          <li><strong className="text-foreground">Uso e dispositivo:</strong> endereço IP, navegador, sistema, páginas acessadas, registros de segurança, falhas e métricas de desempenho.</li>
          <li><strong className="text-foreground">Ferramentas pessoais:</strong> informações inseridas voluntariamente em recursos financeiros, de saúde, currículo, veículo ou outros utilitários. Alguns recursos podem guardar dados apenas no próprio dispositivo; a tela da ferramenta informa quando isso ocorrer.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'finalidades', title: 'Por que usamos os dados', content: (
      <ul className={listClassName}>
        <li>Criar e proteger contas, confirmar identidade e controlar permissões.</li>
        <li>Exibir empresas, conteúdos, eventos, serviços e resultados relevantes.</li>
        <li>Processar agendamentos, reservas, listas, programas de fidelidade e demais solicitações.</li>
        <li>Entregar notificações solicitadas e comunicações essenciais sobre a conta.</li>
        <li>Moderar conteúdo, prevenir fraude, abuso e acessos indevidos.</li>
        <li>Medir desempenho, corrigir falhas e melhorar a experiência.</li>
        <li>Cumprir obrigações legais, regulatórias ou determinações de autoridades competentes.</li>
      </ul>
    ),
  },
  { id: 'bases-legais', title: 'Bases legais', content: <p>Conforme a finalidade, o tratamento pode se apoiar na execução de contrato ou de procedimentos solicitados por você, no cumprimento de obrigação legal, no exercício regular de direitos, no legítimo interesse com avaliação de necessidade e impacto, na proteção contra fraudes e, quando exigido, no seu consentimento. Você pode revogar um consentimento nas configurações disponíveis ou pelo canal de contato, sem afetar tratamentos anteriores legítimos.</p> },
  {
    id: 'compartilhamento', title: 'Compartilhamento e operadores', content: (
      <>
        <p>Não vendemos seus dados pessoais. Podemos compartilhá-los somente no limite necessário com:</p>
        <ul className={listClassName}>
          <li>provedores de hospedagem, banco de dados, autenticação, armazenamento, mapas, análise, comunicação e notificações;</li>
          <li>empresas com as quais você solicita contato, reserva, agendamento ou benefício;</li>
          <li>autoridades públicas ou terceiros, quando houver obrigação legal, ordem válida ou necessidade de proteger direitos e segurança.</li>
        </ul>
        <p>Links externos e canais de empresas possuem políticas próprias. Recomendamos verificá-las antes de fornecer dados diretamente a esses terceiros.</p>
      </>
    ),
  },
  {
    id: 'armazenamento', title: 'Armazenamento, cookies e retenção', content: (
      <>
        <p>Usamos armazenamento local, cookies ou tecnologias equivalentes para manter sessões, preferências, funcionamento do PWA, segurança e desempenho. Permissões como localização, câmera e notificações podem ser gerenciadas no navegador ou no sistema do dispositivo.</p>
        <p>Os dados são mantidos pelo tempo necessário às finalidades informadas, à manutenção da conta e ao cumprimento de obrigações legais. Depois disso, poderão ser eliminados ou anonimizados, salvo quando a conservação for autorizada ou exigida por lei.</p>
      </>
    ),
  },
  { id: 'seguranca', title: 'Segurança dos dados', content: <p>Aplicamos controles técnicos e administrativos proporcionais aos riscos, incluindo autenticação, restrições de acesso, registros de segurança e validações no servidor. Nenhum ambiente digital é totalmente imune a incidentes; por isso, recomendamos senha exclusiva, proteção do dispositivo e encerramento da sessão em aparelhos compartilhados.</p> },
  {
    id: 'direitos', title: 'Seus direitos pela LGPD', content: (
      <>
        <p>Você pode solicitar confirmação e acesso ao tratamento, correção, anonimização, bloqueio ou eliminação quando cabível, portabilidade conforme regulamentação, informação sobre compartilhamento, oposição, revisão de decisões automatizadas e revogação do consentimento.</p>
        <p>Para proteger sua conta, poderemos solicitar comprovação de identidade. O pedido é gratuito e pode ser enviado para <a className="font-semibold text-primary hover:underline" href="mailto:suporte.sajtem@gmail.com">suporte.sajtem@gmail.com</a>. Caso não fique satisfeito, você também pode procurar a Autoridade Nacional de Proteção de Dados (ANPD) ou os órgãos de defesa do consumidor.</p>
      </>
    ),
  },
  { id: 'menores', title: 'Crianças e adolescentes', content: <p>O tratamento de dados de crianças e adolescentes deve observar seu melhor interesse e a legislação aplicável. Responsáveis legais devem acompanhar o uso da plataforma e não permitir a publicação de dados que exponham menores. Conteúdos inadequados podem ser denunciados para análise e remoção.</p> },
  { id: 'atualizacoes', title: 'Atualizações e contato', content: <p>Esta política poderá ser atualizada para refletir mudanças legais, técnicas ou nos serviços. Alterações relevantes serão informadas de maneira adequada. Dúvidas e solicitações sobre privacidade podem ser enviadas para <a className="font-semibold text-primary hover:underline" href="mailto:suporte.sajtem@gmail.com">suporte.sajtem@gmail.com</a>.</p> },
];

export const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = 'Política de Privacidade | Saj Tem';
    return () => { document.title = 'Saj Tem - Santo Antônio de Jesus'; };
  }, []);

  return <LegalPageLayout eyebrow="Privacidade e proteção de dados" title="Política de Privacidade" description="Transparência sobre quais dados usamos, por que precisamos deles e como você pode exercer seus direitos no Saj Tem." icon={ShieldCheck} sections={sections} />;
};

export default PrivacyPolicy;
