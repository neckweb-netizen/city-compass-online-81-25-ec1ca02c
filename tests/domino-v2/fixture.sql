-- Throwaway PostgreSQL fixture, never executed against production.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE SET search_path = ''
AS $authuid$ SELECT COALESCE(
  NULLIF(current_setting('request.jwt.claim.sub', true),'')::uuid,
  (NULLIF(current_setting('request.jwt.claims', true),'')::jsonb ->> 'sub')::uuid
) $authuid$;

CREATE TABLE public.domino_salas (
  id uuid PRIMARY KEY,
  numero_sala integer NOT NULL,
  status text NOT NULL DEFAULT 'aguardando',
  jogador_1_id uuid REFERENCES auth.users(id),
  jogador_2_id uuid REFERENCES auth.users(id),
  vez_usuario_id uuid,
  mesa_ponta_esquerda integer,
  mesa_ponta_direita integer,
  historico_jogadas jsonb DEFAULT '[]'::jsonb,
  passadas_count integer DEFAULT 0,
  ultimo_passe_usuario_id uuid,
  ultimo_passe_em timestamptz,
  ultimo_passe_motivo text,
  resultado_registrado boolean NOT NULL DEFAULT false,
  vencedor_id uuid,
  resultado_tipo text,
  jogadas_jogador_1 smallint NOT NULL DEFAULT 0,
  jogadas_jogador_2 smallint NOT NULL DEFAULT 0,
  ultima_jogada_usuario_id uuid,
  atualizado_em timestamptz DEFAULT now()
);

CREATE TABLE public.domino_estatisticas (
  usuario_id uuid PRIMARY KEY REFERENCES auth.users(id),
  vitorias integer NOT NULL DEFAULT 0,
  derrotas integer NOT NULL DEFAULT 0,
  empates integer NOT NULL DEFAULT 0,
  partidas_jogadas integer NOT NULL DEFAULT 0,
  pontuacao integer NOT NULL DEFAULT 0,
  atualizado_em timestamptz
);

-- Stub of the two existing legacy functions. The v2 migration modifies
-- these exact anchor lines; in staging the real definitions are used.
CREATE OR REPLACE FUNCTION public.passar_vez_domino(p_sala_id uuid, p_motivo text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
declare v_sala public.domino_salas%rowtype;
begin
  select * into v_sala from public.domino_salas where id=p_sala_id;
  if not found then raise exception 'Sala não encontrada'; end if;
  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.finalizar_partida_domino(p_sala_id uuid, p_resultado text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
declare v_sala public.domino_salas%rowtype;
begin
  select * into v_sala from public.domino_salas where id=p_sala_id;
  if not found then raise exception 'Partida inválida'; end if;
  if v_sala.resultado_registrado then return false; end if;
  return true;
end;
$function$;

GRANT USAGE ON SCHEMA public, private, auth TO authenticated;
GRANT SELECT, UPDATE ON public.domino_salas TO authenticated;

INSERT INTO auth.users(id) VALUES
('11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222222'),
('33333333-3333-4333-8333-333333333333');

INSERT INTO public.domino_salas
(id,numero_sala,status,jogador_1_id,jogador_2_id,vez_usuario_id)
VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,'jogando',
 '11111111-1111-4111-8111-111111111111',
 '22222222-2222-4222-8222-222222222222',
 '11111111-1111-4111-8111-111111111111'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',2,'jogando',
 '11111111-1111-4111-8111-111111111111',
 '22222222-2222-4222-8222-222222222222',
 '11111111-1111-4111-8111-111111111111');
