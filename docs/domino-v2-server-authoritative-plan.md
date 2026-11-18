# Dominó v2 — migração de confiança para o servidor (Issue #94)

**Status:** protótipo de infraestrutura; não integrar ao jogo nem implantar em produção até testes completos.

## O que esta PR entrega
- Duas tabelas em `private` com RLS e revogação explícita de privilégios de `anon` e `authenticated`.
- Uma função de início que exige jogador autenticado, sala ativa com dois participantes, partida ainda sem jogadas, e bloqueia a sala durante a distribuição.
- Embaralhamento de 28 peças canônicas (0-0 a 6-6) via `gen_random_uuid()` sem semente derivada de `sala_id`. Distribui sete peças para cada participante em uma única transação.
- Nova RPC que retorna **apenas a mão do solicitante**, após confirmar participação atual e original.
- Rechamadas da inicialização não redistribuem peças.
- **RPC de jogada em protótipo** com posse da peça, turno, encaixe e exclusão atômica da mão.
- **RPC de passe em protótipo**: só permite `sem_peca` quando nenhuma peça encaixa; o passe por tempo está deliberadamente bloqueado.
- **Registro de vitória/empate em protótipo**: vitória exige mão vazia; empate exige dois passes válidos e ausência de peças jogáveis nas duas mãos. As RPCs antigas são bloqueadas apenas nas partidas v2.
- **Limpeza automática de estado v2 em protótipo**: ao sair um jogador ou a sala voltar a `aguardando`, o gatilho elimina a distribuição antiga e as mãos por cascata.
- **Compatibilidade com jogadas legadas**: o gatilho `SECURITY INVOKER` consulta um auxiliar `SECURITY DEFINER` que revela apenas se a sala possui uma partida v2, sem abrir leitura das mãos privadas.
- **Ativação controlada por sala no staging**: uma allowlist em `private.domino_v2_salas_habilitadas`, sem permissões diretas de escrita a usuários comuns, impede que qualquer participante ative a V2 em uma sala legada. A autorização é inserida exclusivamente por administrador confiável do staging.

## Não está entregue e bloqueia o uso real
1. **RPC de jogada criada em protótipo** (`domino_v2_jogar`): confere posse, valida turno/encaixe e remove a peça atomicamente da mão privada; também existe uma proteção do gatilho para salas v2. **Ainda exige execução de testes em staging e revisão da compatibilidade dos gatilhos.** O cliente atual ainda atualiza `domino_salas` diretamente.
2. **Passe sem peça implementado em protótipo**; teste funcional em staging pendente. O modo `tempo` permanece bloqueado até existir relógio verificável no servidor.
3. **Vitória por mão vazia e empate com comprovação criados em protótipo**, ainda sem testes completos em staging. Verificar finalização e pontuação com duas contas.
4. **Proteção inicial contra UPDATE direto criada para salas v2**; validar em staging que a segurança e os gatilhos de sala não interferem no novo fluxo. Revisar também todas as demais rotas de alteração de status, saída de sala e resultado.
5. Adaptação do frontend: substituir a distribuição determinística e `localStorage` pela RPC; tratar reconexão e saída/abandono de partida.
6. Estratégia para substituição das partidas existentes sem interferir em usuários ativos.

## Testes obrigatórios em projeto Supabase isolado
- Iniciar sessão com dois usuários reais de teste. Um deles distribui 14 peças, sete para cada um; a redistribuição é idempotente.
- Confirmar que duas transações concorrentes de inicialização não criam mais que 14 peças nem duas distribuições.
- Confirmar que um usuário A não consegue visualizar a mão de B ou modificar as tabelas privadas via API.
- Confirmar que visitante e usuário C (não participante) não conseguem executar as RPCs com sucesso.
- Confirmar que partida terminada, incompleta ou já iniciada não aceita distribuição.
- Confirmar que qualquer sala sem autorização explícita em `private.domino_v2_salas_habilitadas` rejeita inicialização, mesmo quando a solicitação vem de um participante legítimo.
- Confirmar que um jogador não consegue inserir sua sala na allowlist via API nem reativar uma partida legada.
- Jogar uma mão completa com `domino_v2_jogar`, testar duplicatas, peças fora da mão, jogada fora da vez, passe inválido e partida encerrada.
- Exercitar `domino_v2_passar`: negar passe havendo peça compatível; permitir passe sem peças jogáveis; negar `tempo` até implementação de relógio no servidor.
- Verificar `domino_v2_registrar_resultado` com duas contas: vitória só com mão vazia, empate só com ambas sem peças jogáveis, contagem e pontuação registradas **uma única vez**.
- Validar que os gatilhos antigos não efetuam pontuação dupla em jogos v2 e continuam funcionando nos jogos antigos.
- Confirmar que alterações de fila, saída de sala, atualização Realtime e pontuação continuam consistentes.
- Confirmar que a saída de um jogador remove a distribuição privada por cascata e permite iniciar nova partida na mesma sala, sem herdar peças antigas.
- Confirmar que jogadores legados podem continuar atualizando o tabuleiro mesmo sem acesso direto a `private.domino_v2_partidas` e que o auxiliar de existência não revela a mão de ninguém.
- Verificar em staging a ordem dos gatilhos de sala (`guard_domino_sala_update`, `preparar_nova_partida_domino`, limpeza v2, empate), a ausência de deadlocks e os privilégios efetivos de `authenticated`.
- **Bloqueio crítico:** testes estáticos de migrations não verificam compilação e execução das rotinas PostgreSQL; é obrigatória execução transacional em staging.

## Plano de lançamento
1. **Não mesclar esta PR** antes da revisão e validação isolada. A criação da branch Supabase foi tentada em 18/11/2026; a plataforma exigiu confirmação prévia de custo. Nenhuma branch de testes foi criada nem qualquer despesa autorizada. É preciso autorização explícita do proprietário para o custo informado antes de prosseguir, ou usar um projeto de staging já existente.
2. Implantar migrations no staging, executar testes automáticos de integração com dois usuários e comparar permissões.
3. Revisar e testar as RPCs de jogada/passe/finalização já prototipadas; implementar controle de tempo pelo servidor e atualizar a interface atrás de feature flag desativada por padrão.
4. Executar testes de segurança e regressão no staging; somente depois planejar ativação gradual e rollback.

**Fora de escopo:** Pix automático, pagamentos, página inicial.
