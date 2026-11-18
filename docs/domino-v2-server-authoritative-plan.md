# Dominó v2 — migração de confiança para o servidor (Issue #94)

**Status:** protótipo de infraestrutura; não integrar ao jogo nem implantar em produção até testes completos.

## O que esta PR entrega
- Duas tabelas em `private` com RLS e revogação explícita de privilégios de `anon` e `authenticated`.
- Uma função de início que exige jogador autenticado, sala ativa com dois participantes, partida ainda sem jogadas, e bloqueia a sala durante a distribuição.
- Embaralhamento de 28 peças canônicas (0-0 a 6-6) via `gen_random_uuid()` sem semente derivada de `sala_id`. Distribui sete peças para cada participante em uma única transação.
- Nova RPC que retorna **apenas a mão do solicitante**, após confirmar participação atual e original.
- Rechamadas da inicialização não redistribuem peças.

## Não está entregue e bloqueia o uso real
1. RPC de jogada que exige posse da peça, valida turno/encaixe e remove a peça atomicamente da mão privada. O cliente atual ainda atualiza `domino_salas` diretamente.
2. Lógica autoritativa de passe: `sem_peca` deve ser rejeitado caso qualquer peça da mão encaixe. O modo `tempo` precisa de controle de tempo verificável pelo servidor.
3. Vitória por **mão vazia**, não apenas por sete jogadas. Empate deve ser comprovado pelo servidor, não somente por duas declarações do cliente.
4. Bloqueio da mutação direta de `domino_salas` depois da migração do cliente, incluindo controle de transição de status.
5. Adaptação do frontend: substituir a distribuição determinística e `localStorage` pela RPC; tratar reconexão e saída/abandono de partida.
6. Estratégia para substituição das partidas existentes sem interferir em usuários ativos.

## Testes obrigatórios em projeto Supabase isolado
- Iniciar sessão com dois usuários reais de teste. Um deles distribui 14 peças, sete para cada um; a redistribuição é idempotente.
- Confirmar que duas transações concorrentes de inicialização não criam mais que 14 peças nem duas distribuições.
- Confirmar que um usuário A não consegue visualizar a mão de B ou modificar as tabelas privadas via API.
- Confirmar que visitante e usuário C (não participante) não conseguem executar as RPCs com sucesso.
- Confirmar que partida terminada, incompleta ou já iniciada não aceita distribuição.
- Jogar uma mão completa pela futura RPC, testar duplicatas, peças fora da mão, jogada fora da vez, passe inválido e partida encerrada.
- Confirmar que alterações de fila, saída de sala, atualização Realtime e pontuação continuam consistentes.

## Plano de lançamento
1. **Não mesclar esta PR** antes da revisão e validação isolada; criar branch Supabase de teste se o plano permitir, ou usar projeto de staging.
2. Implantar migrations no staging, executar testes automáticos de integração com dois usuários e comparar permissões.
3. Implementar RPCs de jogada/passe/finalização e atualizar interface em feature flag desativada por padrão.
4. Executar testes de segurança e regressão no staging; somente depois planejar ativação gradual e rollback.

**Fora de escopo:** Pix automático, pagamentos, página inicial.
