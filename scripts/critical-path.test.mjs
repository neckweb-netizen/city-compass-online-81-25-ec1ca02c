import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('a manutenção tem uma consulta e um canal, ambos no App', () => {
  const app = source('src/App.tsx');
  const home = source('src/pages/Index.tsx');
  assert.equal((app.match(/\.from\("configuracoes_sistema"/g) ?? []).length, 1);
  assert.equal((app.match(/schema-db-maintenance-app/g) ?? []).length, 1);
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
  assert.match(nav, /h-\[3\.75rem\] w-\[3\.75rem\] rounded-full/);
});
