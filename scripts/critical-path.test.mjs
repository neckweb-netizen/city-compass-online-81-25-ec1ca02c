import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('a manutenção usa uma consulta espaçada sem WebSocket global no App', () => {
  const app = source('src/App.tsx');
  const home = source('src/pages/Index.tsx');
  assert.equal((app.match(/\.from\("configuracoes_sistema"/g) ?? []).length, 1);
  assert.doesNotMatch(app, /schema-db-maintenance-app|\.channel\(/);
  assert.match(app, /POLL_MS = 10 \* 60 \* 1000/);
  assert.match(app, /visibilitychange/);
  assert.match(app, /navigator\.onLine/);
  assert.doesNotMatch(home, /schema-db-changes-index|setIsMaintenance|verificarManutencao/);
  assert.match(app, /<Index maintenanceLoading=\{loadingConfig\}/);
});

test('componentes secundários são carregados por demanda sem removê-los', () => {
  const layout = source('src/components/layout/PublicLayout.tsx');
  const header = source('src/components/layout/Header.tsx');
  assert.match(layout, /lazy\(\(\) =>\s*import\('@\/components\/ai\/AiAssistantChat'\)/);
  assert.match(layout, /lazy\(\(\) =>\s*import\('@\/components\/tutorial\/TourTutorial'\)/);
  assert.match(layout, /desktop && \(/);
  assert.match(layout, /sajtem:open-assistant/);
  assert.match(layout, /sajtem:start-visitor-tour/);
  assert.match(layout, /<AiAssistantChat initialOpen=\{assistantRequested\}/);
  assert.match(header, /authDialogOpen && \(/);
});

test('regras de montagem e ordenação de cards continuam ativas', () => {
  const home = source('src/components/home/HomeContent.tsx');
  const sections = source('src/hooks/useHomeSectionsOrder.tsx');
  assert.match(home, /activeSections\.map\(/);
  assert.match(home, /section\.section_name === 'banner'/);
  assert.match(sections, /\.order\('ordem', \{ ascending: true \}\)/);
  assert.match(home, /<AiAssistantHomeEntry \/>/);
});

test('a home atrasa somente requisições de conteúdo secundário', () => {
  const home = source('src/pages/Index.tsx');
  assert.match(home, /secondaryHomeReady/);
  assert.match(home, /addEventListener\('scroll', activate/);
  assert.match(home, /queryFn: \(\) => loadBanners\('home'\)/);
  assert.match(home, /enabled: activeTab === 'home'/);
});

test('botão de IA continua móvel e botão de publicar continua circular', () => {
  const assistant = source('src/components/ai/AiAssistantChat.tsx');
  const nav = source('src/components/layout/BottomNavigation.tsx');
  assert.match(assistant, /onPointerMove=\{moveDrag\}/);
  assert.match(assistant, /POSITION_KEY/);
  assert.match(nav, /h-\[3\.75rem\] w-\[3\.75rem\][^"]*rounded-full/);
});


test('notificações completas só carregam quando o sino é aberto', () => {
  const header = source('src/components/layout/Header.tsx');
  const hook = source('src/hooks/useNotifications.tsx');
  assert.match(header, /detailsEnabled: notificationsOpen/);
  assert.match(header, /onOpenChange=\{setNotificationsOpen\}/);
  assert.match(hook, /enabled: Boolean\(user\?\.id && inAppEnabled && detailsEnabled\)/);
  assert.match(hook, /if \(!user\?\.id \|\| !inAppEnabled \|\| !detailsEnabled\) return/);
});

test('seções públicas da home não ficam repetindo consultas por minuto', () => {
  const sections = source('src/hooks/useHomeSectionsOrder.tsx');
  assert.match(sections, /refetchInterval: false/);
  assert.match(sections, /5 \* 60_000/);
  assert.match(sections, /refetchOnWindowFocus: true/);
});


test('Firebase é carregado por demanda para usuários autenticados', () => {
  const provider = source('src/contexts/PushNotificationsContext.tsx');
  assert.match(provider, /import\('@\/lib\/firebaseMessaging'\)/);
  assert.doesNotMatch(provider, /from ['"]@\/lib\/firebaseMessaging['"]/);
  assert.match(provider, /if \(!user\?\.id\) \{/);
});

test('a leitura da cidade padrão não executa INSERT e só faz fallback se não encontrada', () => {
  const sourceCode = source('src/hooks/useCidadePadrao.tsx');
  assert.doesNotMatch(sourceCode, /\.insert\(/);
  assert.match(sourceCode, /if \(error\) throw error/);
  assert.match(sourceCode, /if \(cidade\) return cidade/);
  assert.match(sourceCode, /\.eq\('slug', 'santo-antonio-de-jesus'\)/);
});

test('a busca só consulta os catálogos depois de 2 caracteres', () => {
  const suggestions = source('src/hooks/useSearchSuggestions.tsx');
  const empresas = source('src/hooks/useEmpresas.tsx');
  const categorias = source('src/hooks/useCategorias.tsx');
  const cidades = source('src/hooks/useCidades.tsx');
  assert.match(suggestions, /searchTerm\.trim\(\)\.length >= 2/);
  assert.match(suggestions, /useEmpresas\(undefined, undefined, shouldFetch\)/);
  assert.match(suggestions, /useCategorias\(undefined, shouldFetch\)/);
  assert.match(suggestions, /useCidades\(shouldFetch\)/);
  for (const query of [empresas, categorias, cidades]) {
    assert.match(query, /enabled,/);
    assert.match(query, /staleTime:/);
  }
});

test('admin pending counters use one Realtime channel with debounced updates', () => {
  const admin = source('src/components/admin/AdminSidebar.tsx');
  assert.equal((admin.match(/\.channel\('rt-admin-pending-counters'\)/g) ?? []).length, 1);
  for (const table of ['empresas', 'problemas_cidade', 'achados_perdidos', 'entre_nos_postagens', 'entre_nos_denuncias', 'produtores_locais', 'pedidos_locais']) {
    assert.match(admin, new RegExp("table: '" + table + "'"));
  }
  assert.match(admin, /\}, 700\)/);
  assert.match(admin, /visibilitychange/);
  assert.match(admin, /removeChannel\(channel\)/);
  assert.doesNotMatch(admin, /rt-admin-locais|rt-admin-voz|rt-admin-producao-local/);
});

test('ferramentas com sincronização ou plano exigem login antes de carregar página', () => {
  const app = source('src/App.tsx');
  for (const name of [
    'acompanhamento-gestacional',
    'medicamentos',
    'meu-veiculo',
    'cardapio-digital',
    'gestao-cobrancas',
    'consulta-fipe',
  ]) {
    assert.ok(app.includes('path="ferramentas/' + name + '" element={<ProtectedRoute>'), 'Login obrigatório em ' + name);
  }
  assert.ok(app.includes('path="ferramentas/gerador-rifa" element={<GeradorRifaAccess />}'));
  assert.ok(app.includes("if (searchParams.get('id')) return <GeradorRifa />"));
  assert.ok(app.includes('return <ProtectedRoute><GeradorRifa /></ProtectedRoute>'));
  assert.ok(app.includes('path="cardapio/:slug" element={<CardapioPublico />}'));
});
