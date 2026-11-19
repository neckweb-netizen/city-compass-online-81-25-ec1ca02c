import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('botões Ver todas da home levam à listagem de locais', () => {
  const file = source('src/components/home/PopularBusinesses.tsx');
  assert.equal((file.match(/onClick=\{\(\) => navigate\("\/locais"\)\}/g) ?? []).length, 2);
});

test('controle financeiro abre o modal de login existente em vez de rota inexistente', () => {
  const file = source('src/pages/ferramentas/ControleFinanceiro.tsx');
  const header = source('src/components/layout/Header.tsx');
  assert.doesNotMatch(file, /navigate\('\/login'\)/);
  assert.match(file, /dispatchEvent\(new Event\('sajtem:open-auth'\)\)/);
  assert.match(header, /addEventListener\('sajtem:open-auth', openLogin\)/);
});

test('cards e ordem da home continuam vindos da configuração existente', () => {
  const home = source('src/components/home/HomeContent.tsx');
  const query = source('src/hooks/useHomeSectionsOrder.tsx');
  assert.match(home, /activeSections\.map\(/);
  assert.match(query, /\.order\('ordem', \{ ascending: true \}\)/);
  assert.match(home, /<AiAssistantHomeEntry \/>/);
});

test('atalhos e cards de destaque podem ser abertos por teclado', () => {
  const tools = source('src/pages/Index.tsx');
  const featured = source('src/components/home/FeaturedSection.tsx');
  const categories = source('src/components/home/CategoriesGrid.tsx');
  for (const file of [tools, featured, categories]) {
    assert.match(file, /onKeyDown=\{\(event\)/);
    assert.match(file, /tabIndex=\{0\}/);
  }
});

test('a navegação central continua circular e preserva as cinco rotas', () => {
  const nav = source('src/components/layout/BottomNavigation.tsx');
  assert.match(nav, /h-\[3\.75rem\] w-\[3\.75rem\][^"]*rounded-full/);
  for (const route of ["'/'", "'/canal-informativo'", "'/cadastro-local'", "'/ferramentas'", "'/reclamacoes'"]) {
    assert.ok(nav.includes(`rota: ${route}`), `rota ausente: ${route}`);
  }
});

test('landing comercial divulga cadastro básico grátis e não usa números artificiais', () => {
  const file = source('src/pages/AnuncieGratis.tsx');
  for (const misleading of [
    'totalUsuarios', 'totalVisualizacoes', 'totalCliques',
    'carregarMetricasPublicas', 'vender até 3x',
    '+ 150', '+ 1200', '+ 340',
  ]) {
    assert.ok(!file.toLowerCase().includes(misleading.toLowerCase()), 'Texto enganoso: ' + misleading);
  }
  assert.match(file, /O cadastro e a presença básica são gratuitos/);
  assert.match(file, /Os recursos premium são opcionais/);
  assert.match(file, /O cadastro e o perfil básico não exigem a contratação de um plano/);
  assert.match(file, /Sem promessas irreais/);
});

test('landing comercial apresenta vantagens, FAQs e CTA funcional para login e cadastro', () => {
  const file = source('src/pages/AnuncieGratis.tsx');
  const header = source('src/components/layout/Header.tsx');
  assert.match(file, /const beneficios = \[/);
  assert.match(file, /const perguntas = \[/);
  assert.match(file, /if \(user\) \{/);
  assert.match(file, /navigate\('\/cadastro-local'\)/);
  assert.match(file, /navigate\('\/anuncie-gratis\?auth=signup&mode=register'\)/);
  assert.ok((file.match(/onClick=\{iniciarCadastro\}/g) ?? []).length >= 3);
  assert.match(header, /searchParams.get\('auth'\) === 'signup'/);
  assert.ok(file.includes("new Event('sajtem:open-business-signup')"));
  assert.ok(header.includes("addEventListener('sajtem:open-business-signup', openBusinessSignup)"));
  assert.match(file, /aria-expanded=\{perguntaAberta === index\}/);
});


test('landing não possui barra fixa e esconde menu, navegação e assistente de IA apenas nessa rota', () => {
  const landing = source('src/pages/AnuncieGratis.tsx');
  const layout = source('src/components/layout/PublicLayout.tsx');
  assert.doesNotMatch(landing, /pointer-events-none fixed inset-x-0 bottom-20/);
  assert.match(layout, /pathname === '\/anuncie-gratis'/);
  assert.match(layout, /!isBusinessLanding && desktop/);
  assert.match(layout, /!isBusinessLanding && <BottomNavigation \/>/);
  assert.match(layout, /!isBusinessLanding && assistantReady/);
  assert.match(layout, /!isBusinessLanding && tourReady/);
  assert.match(layout, /isBusinessLanding \? "pb-0"/);
});

test('ações de navegação expõem controles semânticos e rótulos acessíveis', () => {
  const navigation = source('src/components/layout/BottomNavigation.tsx');
  const sidebar = source('src/components/layout/DesktopSidebar.tsx');
  const drawer = source('src/components/layout/MobileHamburger.tsx');
  const header = source('src/components/layout/Header.tsx');
  const sheet = source('src/components/ui/sheet.tsx');
  assert.match(navigation, /to=\{item\.rota\}/);
  assert.match(navigation, /aria-label="Criar publicação"/);
  assert.match(sidebar, /aria-expanded=\{isOpen\}/);
  assert.match(sidebar, /Recolher menu lateral/);
  assert.match(drawer, /<SheetTitle className="sr-only">/);
  assert.match(sheet, /Fechar menu/);
  assert.match(header, /aria-label="Buscar no portal"/);
  assert.match(header, /Abrir menu do perfil/);
  assert.ok(header.includes('Notificações: '));
});

test('stories e cards de reclamação operam com teclado e leitor de telas', () => {
  const stories = source('src/components/home/StoryViewer.tsx');
  const complaints = source('src/components/problemas/ProblemaCard.tsx');
  assert.match(stories, /aria-label="Story anterior"/);
  assert.match(stories, /aria-label="Próximo story"/);
  assert.match(stories, /aria-label="Fechar stories"/);
  assert.match(complaints, /role="link"/);
  assert.match(complaints, /tabIndex=\{0\}/);
  assert.match(complaints, /event\.key === 'Enter'/);
  assert.match(complaints, /Votar a favor desta reclamação/);
});

test('modo de manutenção não mostra progresso fictício nem suporte inventado', () => {
  const app = source('src/App.tsx');
  assert.doesNotMatch(app, /85% Concluído|5575999999999|https:\/\/instagram\.com|https:\/\/facebook\.com/);
  assert.match(app, /mailto:suporte\.sajtem@gmail\.com/);
  assert.match(app, /role="status"/);
});

test('página não encontrada usa link SPA sem recarregar', () => {
  const notFound = source('src/pages/NotFound.tsx');
  assert.match(notFound, /<Link to="\/"/);
  assert.doesNotMatch(notFound, /<a href="\/"/);
});


test('agendamento só limpa dados após confirmação do servidor', () => {
  const form = source('src/components/agendamento/FormularioAgendamento.tsx');
  assert.match(form, /const handleSubmit = async/);
  assert.match(form, /await criarAgendamento\(/);
  const mutation = form.indexOf('await criarAgendamento(');
  const reset = form.indexOf('setFormData({', mutation);
  const success = form.indexOf('onSuccess?.()', mutation);
  assert.ok(mutation >= 0 && reset > mutation && success > reset);
  assert.match(form, /catch \{/);
  assert.match(form, /earliest\.getTimezoneOffset\(\)/);
  assert.doesNotMatch(form, /now\.toISOString\(\)\.slice\(0, 16\)/);
});

test('menu administrativo fecha no celular e usa rota para o destaque', () => {
  const sidebar = source('src/components/admin/AdminSidebar.tsx');
  const layout = source('src/components/admin/AdminLayout.tsx');
  assert.match(sidebar, /useSidebar\(\)/);
  assert.match(sidebar, /if \(isMobile\) setOpenMobile\(false\)/);
  assert.match(sidebar, /location\.pathname === item\.path/);
  assert.match(sidebar, /aria-current=\{isActive \? 'page' : undefined\}/);
  assert.match(layout, /aria-label="Sair do painel administrativo"/);
  assert.match(layout, /aria-label="Abrir ou fechar menu administrativo"/);
});

test('contato expõe erros associados aos campos e teclado móvel apropriado', () => {
  const contact = source('src/components/contact/ContactForm.tsx');
  assert.match(contact, /aria-describedby=\{errors\.email \? 'erro-email'/);
  assert.match(contact, /id="erro-email" role="alert"/);
  assert.match(contact, /type="tel"/);
  assert.match(contact, /aria-busy=\{isLoading\}/);
});


test('edição de empresa reidrata campos para o negócio selecionado', () => {
  const form = source('src/components/empresa/EmpresaEditForm.tsx');
  assert.match(form, /form\.reset\(\{/);
  assert.match(form, /\[empresa\.id, open, form\.reset\]/);
  assert.match(form, /setHorarios\(empresa\.horario_funcionamento \|\| \{\}\)/);
  assert.match(form, /aria-busy=\{isUpdating\}/);
});

test('notas em estrelas e remoção de tags funcionam com teclado', () => {
  const userRating = source('src/components/empresa/AvaliacaoModal.tsx');
  const adminRating = source('src/components/admin/forms/EditAvaliacaoModal.tsx');
  const product = source('src/components/empresa/ProdutoForm.tsx');
  for (const rating of [userRating, adminRating]) {
    assert.match(rating, /aria-pressed=\{nota === starNumber\}/);
    assert.match(rating, /onClick=\{\(\) => setNota\(starNumber\)\}/);
    assert.match(rating, /type="button"/);
  }
  assert.match(product, /Remover tag/);
  assert.match(product, /onClick=\{\(\) => removeTag\(tag\)\}/);
  assert.match(product, /htmlFor="produto-tags"/);
});


test('cadastro de local mantém categoria controlada e ações adaptadas ao celular', () => {
  const cadastro = source('src/pages/CadastroLocal.tsx');
  assert.match(cadastro, /value=\{field\.value \|\| ''\}/);
  assert.match(cadastro, /aria-label="Categoria do local"/);
  assert.match(cadastro, /flex-col-reverse gap-3 border-t/);
  assert.match(cadastro, /aria-busy=\{isSubmitting\}/);
});

test('upload de banner tem seletor, remoção e ação de salvar acessíveis', () => {
  const banner = source('src/components/admin/forms/BannerForm.tsx');
  assert.match(banner, /aria-label="Remover mídia do banner"/);
  assert.match(banner, /aria-label="Selecionar imagem do banner"/);
  assert.match(banner, /aria-label="Selecionar vídeo para o banner"/);
  assert.match(banner, /aria-busy=\{Boolean\(isLoading \|\| uploading\)\}/);
});

test('horários de funcionamento associam campos ao dia da semana', () => {
  const hours = source('src/components/admin/forms/HorarioFuncionamentoFormField.tsx');
  assert.ok(hours.includes('htmlFor={'));
  assert.ok(hours.includes('horario-aberto-'));
  assert.ok(hours.includes('horario-abertura-'));
  assert.ok(hours.includes('horario-fechamento-'));
  assert.match(hours, /sm:grid-cols-2/);
});


test('calculadora de combustível não aceita custos negativos e rotula seletor de combustível', () => {
  const calculator = source('src/pages/ferramentas/CalculadoraCombustivel.tsx');
  assert.match(calculator, /Number\.isFinite\(parsed\) && parsed >= 0/);
  assert.match(calculator, /numberFrom\(passageiros\) >= 1/);
  assert.match(calculator, /aria-label="Tipo de combustível"/);
  assert.match(calculator, /id="calcular-ida-volta"/);
});

test('calculadora de orçamento trata taxa impossível sem mostrar preço falso', () => {
  const budget = source('src/pages/ferramentas/CalculadoraOrcamento.tsx');
  assert.match(budget, /const impostoValido = impostos < 100/);
  assert.match(budget, /const fatorImposto = impostoValido \? 1 - \(impostos \/ 100\) : 0/);
  assert.match(budget, /const valorHoraRecomendado = fatorImposto > 0 \? valorHoraBase \/ fatorImposto : 0/);
  assert.match(budget, /A taxa de impostos precisa ser menor que 100%/);
  assert.match(budget, /inputMode="decimal"/);
  assert.match(budget, /htmlFor="impostos"/);
});
