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
  assert.match(nav, /h-\[3\.75rem\] w-\[3\.75rem\] rounded-full/);
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
