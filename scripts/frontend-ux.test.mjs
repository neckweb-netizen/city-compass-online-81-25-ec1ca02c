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


test('comparador não trata preço negativo ou inválido como oferta legítima', () => {
  const comparator = source('src/pages/ferramentas/ComparadorPrecos.tsx');
  assert.match(comparator, /Number\.isFinite\(parsed\) && parsed > 0/);
  assert.match(comparator, /aria-label="Unidade de medida dos produtos"/);
  assert.match(comparator, /aria-invalid=\{Boolean\(product\.quantity\.trim\(\)\)/);
});

test('calculadora de margem não inventa preço para taxas inviáveis', () => {
  const margin = source('src/pages/ferramentas/CalculadoraMargem.tsx');
  assert.match(margin, /const taxasValidas = margemDesejada >= 0/);
  assert.match(margin, /somaPorcentagens < 1/);
  assert.match(margin, /const precoVendaIdeal = taxasValidas && custo > 0/);
  assert.match(margin, /!taxasValidas && <p role="alert"/);
  assert.match(margin, /disabled=\{!taxasValidas \|\| custo <= 0\}/);
  assert.match(margin, /await navigator\.clipboard\.writeText/);
});


test('importação de finanças valida estrutura e pede confirmação antes de substituir', () => {
  const finance = source('src/pages/ferramentas/ControleFinanceiro.tsx');
  assert.match(finance, /file\.size > 5 \* 1024 \* 1024/);
  assert.match(finance, /candidate\.transactions\.every\(validTransaction\)/);
  assert.match(finance, /Number\.isFinite\(item\.amount\)/);
  assert.match(finance, /new Set\(candidate\.transactions\.map/);
  assert.match(finance, /window\.confirm\('Importar este backup substituirá/);
  assert.match(finance, /replaceAll\(nextState\)/);
});

test('currículo usa IDs exclusivos e botões de remoção acessíveis', () => {
  const cv = source('src/pages/ferramentas/CriadorCurriculo.tsx');
  assert.match(cv, /crypto\.randomUUID\(\)/);
  assert.match(cv, /aria-label="Remover formação"/);
  assert.match(cv, /aria-label="Remover experiência profissional"/);
  assert.match(cv, /grid-cols-1 gap-2 sm:grid-cols-2/);
});



test('substituição do backup financeiro salva primeiro e remove registros antigos por ID', () => {
  const storage = source('src/hooks/useControleFinanceiroStorage.ts');
  const start = storage.indexOf('const replaceAll = useCallback');
  const end = storage.indexOf('const importLocalToAccount =', start);
  assert.ok(start >= 0 && end > start);
  const replacement = storage.slice(start, end);
  assert.ok(replacement.includes('.upsert(batch.map'));
  assert.ok(replacement.includes('for (let offset = 0; ; offset += 500)'));
  assert.ok(replacement.includes('const obsoleteIds = storedIds.filter'));
  assert.ok(replacement.includes(".in('id', obsoleteIds.slice"));
  assert.ok(replacement.indexOf('.upsert(batch.map') < replacement.indexOf('const obsoleteIds'));
  assert.ok(!replacement.includes(".delete()\n      .eq('user_id', user.id);"));
});


test('navegação rápida usa router sem recarregar documento e paginação fica em português', () => {
  const navigation = source('src/components/layout/FastNavigation.tsx');
  const pagination = source('src/components/ui/pagination.tsx');
  assert.match(navigation, /routerNavigate\(path\)/);
  assert.doesNotMatch(navigation, /window\.location\.href = path/);
  assert.match(navigation, /aria-current=\{isActive \? 'page'/);
  assert.match(pagination, /aria-label="Paginação"/);
  assert.match(pagination, /<span>Anterior<\/span>/);
  assert.match(pagination, /<span>Próxima<\/span>/);
});

test('Entre Nós bloqueia composição anônima e recupera erros de rede e envio', () => {
  const page = source('src/pages/EntreNos.tsx');
  assert.match(page, /if \(requireUser\(\)\) setComposer\(true\)/);
  assert.ok(page.includes('if (p.error)'));
  assert.ok(page.includes('if (r.error || c.error)'));
  assert.ok(page.includes(".in('postagem_id', postIds)"));
  assert.ok(page.includes('if (postIds.length === 0)'));
  assert.ok(page.includes('if(!requireUser() || reactingPostId) return;'));
  assert.ok(page.includes('disabled={reactingPostId === post.id}'));
  assert.ok(page.includes('await load(false)'));
  assert.ok(page.includes('if (showSpinner) setLoading(false)'));
  assert.match(page, /loadError \? <Card/);
  assert.match(page, /void load\(\)/);
  assert.match(page, /Number\.isInteger\(numericAge\)/);
  assert.match(page, /\.eq\('usuario_id', user!\.id\)/);
  assert.match(page, /finally \{\s*setSaving\(false\)/);
});

test('Viver SAJ diferencia falha de carregamento de catálogo vazio', () => {
  const page = source('src/pages/ViverSaj.tsx');
  assert.match(page, /modulesQuery\.isError \? <Card/);
  assert.match(page, /modulesQuery\.refetch\(\)/);
  assert.match(page, /modules\.length === 0 \? <Card/);
  assert.match(page, /aria-label="Carregando áreas do Viver SAJ"/);
});

test('links curtos apresentam erro em vez de voltar silenciosamente para home', () => {
  const page = source('src/pages/ShortUrlRedirect.tsx');
  assert.match(page, /destination\.origin !== window\.location\.origin/);
  assert.match(page, /if \(active\) setErrorMessage/);
  assert.match(page, /role="alert"/);
  assert.match(page, /<Link to="\/">Voltar para o início<\/Link>/);
  assert.doesNotMatch(page, /window\.location\.replace\('\/'\)/);
});

test('configurações preservam edições locais e adaptam ações ao celular', () => {
  const dialog = source('src/components/profile/ConfiguracoesDialog.tsx');
  assert.match(dialog, /preferencesInitialized\.current = false/);
  assert.match(dialog, /if \(!preferencesReady \|\| preferencesInitialized\.current\) return/);
  assert.match(dialog, /preferencesInitialized\.current = true/);
  assert.match(dialog, /max-h-\[90dvh\]/);
  assert.match(dialog, /flex-col-reverse gap-3 sm:flex-row/);
  assert.match(dialog, /aria-expanded=\{showPasswordForm\}/);
  assert.match(dialog, /aria-label="Confirme seu e-mail para excluir a conta"/);
});

test('configurações limpam confirmação sensível e bloqueiam fechamento ao salvar', () => {
  const dialog = source('src/components/profile/ConfiguracoesDialog.tsx');
  assert.match(dialog, /const handleDeleteDialogChange = \(nextOpen: boolean\)/);
  assert.match(dialog, /setDeleteConfirmation\(''\)/);
  assert.match(dialog, /onOpenChange=\{handleDeleteDialogChange\}/);
  assert.match(dialog, /!deleting && !saving && !passwordSaving/);
  assert.match(dialog, /disabled=\{saving \|\| passwordSaving \|\| deleting\}/);
  assert.match(dialog, /type="email" inputMode="email" aria-label="Confirme seu e-mail/);
});

test('contato informa resultado do envio sem apagar formulário após falha', () => {
  const contact = source('src/components/contact/ContactForm.tsx');
  const service = source('src/hooks/useEmailService.tsx');
  assert.match(contact, /if \(isLoading\) return/);
  assert.match(contact, /setSubmissionStatus\('success'\)/);
  assert.match(contact, /setSubmissionStatus\('error'\)/);
  assert.match(contact, /submissionStatus === 'success'/);
  assert.match(contact, /submissionStatus === 'error'/);
  assert.match(contact, /role="status"/);
  assert.match(contact, /role="alert"/);
  assert.match(service, /if \(error\) throw error/);
  assert.ok(contact.indexOf('await sendContactEmail(emailData)') < contact.indexOf('reset();'));
});


test('stories pré-carregam imagens próximas sem alterar visualizador estável', () => {
  const section = source('src/components/home/StoriesSection.tsx');
  const viewer = source('src/components/home/StoryViewer.tsx');
  assert.match(section, /const imageCache = useRef\(new Map/);
  assert.match(section, /const preloadNearby = useCallback/);
  assert.match(section, /new window\.Image\(\)/);
  assert.match(section, /image\.src = url/);
  assert.match(section, /offset < 3/);
  assert.match(section, /onPointerEnter=\{\(\) => preloadNearby/);
  assert.match(section, /onFocus=\{\(\) => preloadNearby/);
  assert.match(section, /<Suspense fallback=\{null\}>/);
  assert.match(viewer, /src=\{currentStory\.imagem_story_url\}/);
  assert.match(viewer, /aria-label="Próximo story"/);
  assert.doesNotMatch(viewer, /isStoryImageReady|fetchPriority="high"/);
});

test('Entre Nós impede comentários e denúncias duplicadas e mantém texto em falhas', () => {
  const page = source('src/pages/EntreNos.tsx');
  assert.match(page, /if\(!requireUser\(\) \|\| commentingPostId\) return/);
  assert.match(page, /if\(!requireUser\(\) \|\| reportingPostId\) return/);
  assert.match(page, /setCommentingPostId\(postId\)/);
  assert.match(page, /setReportingPostId\(postId\)/);
  assert.match(page, /disabled=\{commentingPostId === post\.id\}/);
  assert.match(page, /disabled=\{reportingPostId === post\.id\}/);
  assert.match(page, /setCommentingPostId\(null\)/);
  assert.match(page, /setReportingPostId\(null\)/);
  assert.match(page, /Seu texto foi preservado para tentar novamente/);
});

test('Entre Nós preserva o rascunho durante o envio de comentários', () => {
  const page = source('src/pages/EntreNos.tsx');
  assert.match(page, /aria-expanded=\{openComments===post\.id\} disabled=\{commentingPostId !== null\}/);
  assert.match(page, /disabled=\{commentingPostId === post\.id\} placeholder="Escreva uma resposta acolhedora/);
  assert.match(page, /disabled=\{commentingPostId !== null \|\| commentText\.trim\(\)\.length < 2\}/);
  assert.match(page, /Seu texto foi preservado para tentar novamente/);
});
