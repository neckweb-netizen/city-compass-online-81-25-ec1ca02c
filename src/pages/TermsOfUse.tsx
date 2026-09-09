import { useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { LegalPageLayout, type LegalSection } from '@/components/legal/LegalPageLayout';

const listClassName = 'list-disc space-y-2 pl-5 marker:text-primary';

const sections: LegalSection[] = [
  { id: 'aceite', title: 'Aceitação dos termos', content: <p>Ao acessar ou utilizar o Saj Tem, você declara que leu e concorda com estes Termos de Uso e com a Política de Privacidade. Se não concordar, não utilize os serviços. Recursos específicos podem apresentar condições adicionais, que passam a integrar estes termos.</p> },
  { id: 'plataforma', title: 'O que o Saj Tem oferece', content: <p>O Saj Tem é uma plataforma local de informação e conexão entre pessoas, empresas e iniciativas de Santo Antônio de Jesus e região. Ela pode reunir cadastros comerciais, eventos, oportunidades, ferramentas digitais, conteúdos comunitários, jogos, agendamentos, reservas, benefícios e links para serviços de terceiros.</p> },
  {
    id: 'conta', title: 'Conta e responsabilidades', content: (
      <ul className={listClassName}>
        <li>Forneça informações verdadeiras, completas e atualizadas.</li>
        <li>Mantenha a senha, os códigos de autenticação e o dispositivo protegidos.</li>
        <li>Não compartilhe a conta nem tente acessar contas, painéis ou dados de terceiros.</li>
        <li>Avise imediatamente se perceber uso não autorizado.</li>
        <li>Você é responsável pelas atividades realizadas com sua conta, ressalvadas as hipóteses previstas em lei.</li>
      </ul>
    ),
  },
  {
    id: 'empresas', title: 'Empresas, anúncios e informações públicas', content: (
      <>
        <p>Responsáveis por empresas devem possuir autorização para administrar o perfil e garantir a exatidão de preços, horários, contatos, imagens, ofertas, eventos e demais informações publicadas.</p>
        <p>Cadastros podem reunir informações de fontes públicas ou fornecidas por terceiros e estão sujeitos a correção. O Saj Tem pode solicitar comprovação de responsabilidade, moderar conteúdo e suspender informações enganosas, ilícitas, desatualizadas ou que violem direitos.</p>
      </>
    ),
  },
  {
    id: 'conteudo', title: 'Conteúdo publicado por usuários', content: (
      <>
        <p>Você mantém a titularidade do conteúdo que publica, mas concede ao Saj Tem licença não exclusiva, gratuita e limitada à operação, divulgação e melhoria da plataforma enquanto o conteúdo estiver disponível.</p>
        <p>É proibido publicar conteúdo ilegal, discriminatório, ameaçador, fraudulento, difamatório, sexualmente exploratório, que exponha dados pessoais sem autorização, viole propriedade intelectual, incentive violência ou prejudique a segurança. Publicações anônimas para outros usuários não são necessariamente anônimas perante a plataforma e autoridades quando a identificação for legalmente necessária.</p>
      </>
    ),
  },
  {
    id: 'uso-proibido', title: 'Condutas proibidas', content: (
      <ul className={listClassName}>
        <li>Fraudar avaliações, rankings, promoções, rifas, jogos, fidelidade, reservas ou agendamentos.</li>
        <li>Usar robôs, automações ou coleta massiva sem autorização.</li>
        <li>Explorar falhas, contornar limites, interferir no funcionamento ou tentar obter privilégios indevidos.</li>
        <li>Distribuir código malicioso, spam, golpes ou links enganosos.</li>
        <li>Usar a plataforma para violar direitos de terceiros ou a legislação vigente.</li>
      </ul>
    ),
  },
  { id: 'transacoes', title: 'Contatos, reservas e transações', content: <p>O Saj Tem facilita a descoberta e o contato, mas empresas e usuários são responsáveis pelas informações, atendimento, preços, qualidade, disponibilidade, pagamento, entrega e cumprimento das ofertas realizadas entre si, salvo quando a plataforma informar expressamente que é parte da transação. Confirme condições diretamente com a empresa antes de contratar ou pagar.</p> },
  { id: 'ferramentas', title: 'Ferramentas e resultados informativos', content: <p>Calculadoras, consultas, simuladores e demais utilitários oferecem resultados estimados ou informativos. Eles não substituem orientação profissional jurídica, contábil, financeira, médica, trabalhista ou mecânica. Revise os dados, consulte fontes oficiais e procure um profissional qualificado antes de tomar decisões relevantes.</p> },
  { id: 'terceiros', title: 'Links e serviços de terceiros', content: <p>Mapas, páginas externas, redes sociais, canais de contato e serviços integrados são operados por terceiros e podem ter termos próprios. O Saj Tem não controla sua disponibilidade, segurança ou conteúdo e não endossa automaticamente tudo o que aparece nesses ambientes.</p> },
  { id: 'disponibilidade', title: 'Disponibilidade e alterações', content: <p>Buscamos manter o serviço seguro e disponível, mas interrupções podem ocorrer por manutenção, falhas técnicas, fatores externos ou atualizações. Recursos podem ser corrigidos, modificados ou encerrados. Quando possível, mudanças relevantes serão comunicadas com antecedência adequada.</p> },
  { id: 'moderacao', title: 'Moderação, suspensão e encerramento', content: <p>Podemos remover conteúdo, limitar recursos ou suspender contas quando houver indícios de violação destes termos, risco à comunidade, fraude, obrigação legal ou ameaça à segurança. A medida será proporcional ao caso, sem prejuízo de providências urgentes. Você pode solicitar esclarecimentos pelo canal de suporte.</p> },
  { id: 'responsabilidade', title: 'Limites de responsabilidade', content: <p>Nos limites permitidos pela legislação, o Saj Tem não responde por decisões tomadas exclusivamente com base em conteúdo de usuários ou terceiros, negociações externas, indisponibilidades fora de seu controle ou uso contrário às orientações apresentadas. Nada nestes termos exclui direitos que não possam ser afastados pelo Código de Defesa do Consumidor ou por outras normas aplicáveis.</p> },
  { id: 'legislacao', title: 'Legislação, mudanças e contato', content: <p>Estes termos são regidos pelas leis brasileiras. Uma cláusula considerada inválida não prejudica as demais. O texto pode ser atualizado para acompanhar mudanças no serviço ou na legislação, com indicação da data de vigência. Dúvidas podem ser enviadas para <a className="font-semibold text-primary hover:underline" href="mailto:suporte.sajtem@gmail.com">suporte.sajtem@gmail.com</a>.</p> },
];

const TermsOfUse = () => {
  useEffect(() => {
    document.title = 'Termos de Uso | Saj Tem';
    return () => { document.title = 'Saj Tem - Santo Antônio de Jesus'; };
  }, []);

  return <LegalPageLayout eyebrow="Condições da plataforma" title="Termos de Uso" description="Regras claras para uma experiência segura, confiável e respeitosa entre usuários, empresas e a comunidade do Saj Tem." icon={ScrollText} sections={sections} />;
};

export default TermsOfUse;
