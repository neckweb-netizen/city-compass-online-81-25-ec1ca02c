alter table public.entre_nos_postagens
  add column if not exists publicacao_sistema boolean not null default false;

alter table public.entre_nos_postagens
  alter column usuario_id drop not null;

-- A API continua sem expor o usuario_id, mas passa a entregar a idade que o
-- proprio participante decidiu publicar e a identificacao editorial.
grant select (idade, publicacao_sistema)
  on public.entre_nos_postagens to anon, authenticated;

-- Conteudos editoriais de acolhimento. Nao simulam depoimentos reais e nao sao
-- vinculados a nenhuma conta de usuario.
insert into public.entre_nos_postagens (
  usuario_id, categoria, sexo, idade, conteudo, permitir_comentarios,
  conteudo_sensivel, status, destaque, publicacao_sistema, criado_em
)
select * from (values
  (null::uuid, 'desabafo', 'nao_binario', 18::smallint,
   'Nem todo dia precisa ser produtivo. Às vezes, descansar e reconhecer os próprios limites também é uma forma de seguir em frente. Como você tem cuidado de si esta semana?',
   true, false, 'aprovado', true, true, now() - interval '8 hours'),
  (null::uuid, 'conselhos', 'nao_binario', 18::smallint,
   'Antes de responder no impulso, tente respirar, organizar o que está sentindo e escolher palavras que não machuquem. Uma conversa calma pode mudar completamente o rumo de uma situação difícil.',
   true, false, 'aprovado', true, true, now() - interval '7 hours'),
  (null::uuid, 'saude_emocional', 'nao_binario', 18::smallint,
   'Pedir ajuda não diminui ninguém. Conversar com uma pessoa de confiança ou procurar apoio profissional pode ser o primeiro passo para tornar um momento pesado um pouco mais suportável.',
   true, false, 'aprovado', false, true, now() - interval '6 hours'),
  (null::uuid, 'gratidao', 'nao_binario', 18::smallint,
   'Que pequena coisa tornou o seu dia melhor hoje? Pode ser uma mensagem, uma música, um café ou apenas alguns minutos de tranquilidade. Compartilhe para inspirar outras pessoas.',
   true, false, 'aprovado', false, true, now() - interval '5 hours'),
  (null::uuid, 'relacionamentos', 'nao_binario', 18::smallint,
   'Relacionamentos saudáveis também precisam de limites. Dizer o que incomoda com respeito e ouvir o outro com atenção ajuda a construir vínculos mais seguros e sinceros.',
   true, false, 'aprovado', false, true, now() - interval '4 hours'),
  (null::uuid, 'familia', 'nao_binario', 18::smallint,
   'Nem sempre é simples conversar com a família. Se o diálogo estiver difícil, comece explicando como você se sente, sem acusações, e escolha um momento em que todos estejam mais tranquilos.',
   true, false, 'aprovado', false, true, now() - interval '3 hours'),
  (null::uuid, 'trabalho', 'nao_binario', 18::smallint,
   'Uma fase difícil no trabalho não define a sua capacidade. Organize o que está ao seu alcance, peça orientação quando necessário e reconheça cada pequena evolução no caminho.',
   true, false, 'aprovado', false, true, now() - interval '2 hours'),
  (null::uuid, 'superacao', 'nao_binario', 18::smallint,
   'Recomeçar não apaga o que aconteceu; mostra que você decidiu continuar apesar disso. Qual foi uma dificuldade que ensinou algo importante para você?',
   true, false, 'aprovado', false, true, now() - interval '1 hour')
) as sementes (
  usuario_id, categoria, sexo, idade, conteudo, permitir_comentarios,
  conteudo_sensivel, status, destaque, publicacao_sistema, criado_em
)
where not exists (
  select 1 from public.entre_nos_postagens p where p.publicacao_sistema = true
);
