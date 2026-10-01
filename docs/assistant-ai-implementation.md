# Assistente do Saj Tem — implementação

Estado em 2026-09-25: o assistente está ativo e funciona sem chamadas ao Gemini ou a outro modelo pago. As respostas públicas são produzidas por busca e regras locais sobre dados do próprio Saj Tem.

## O que o assistente pesquisa

- Empresas elegíveis e aprovadas, sem expor empresas bloqueadas ou inativas.
- Produtos ativos, cupons vigentes e serviços com agendamento.
- Eventos aprovados, vagas de emprego e serviços autônomos.
- Ferramentas gratuitas do Saj Tem, como FIPE, currículo, rifas e calculadoras.
- Perguntas sobre o funcionamento da plataforma e a base revisada de conhecimento.

O motor normaliza acentos, expande sinônimos comuns, tolera pequenos erros de digitação e classifica resultados por intenção e relevância. Perguntas seguintes como “mostre a primeira”, “qual é a mais barata?”, “onde fica?” e “tem WhatsApp?” usam somente os últimos resultados guardados na sessão.

## Privacidade e segurança

- O navegador só solicita localização quando a pergunta contém uma intenção como “perto de mim”. A recusa não bloqueia o chat.
- URLs devolvidas pela função são validadas novamente pelo frontend e aceitam apenas rotas internas conhecidas.
- Sessões usam token opaco com hash no banco e expiram em 24 horas.
- Uma rotina diária elimina sessões expiradas há mais de sete dias; mensagens e eventos relacionados seguem por cascata.
- As tabelas internas da IA continuam sem acesso direto de `anon` ou `authenticated`; a função usa `service_role` e revalida elegibilidade.
- Aberturas de perfil só são registradas para empresas que apareceram na sessão e continuam elegíveis.

## Custos de modelo

A função `assistente-ia` reserva somente a cota de consulta com `p_model_call: false`. Não lê `GEMINI_API_KEY`, não chama `generateContent` e não incrementa a cota de modelo. O valor configurado em `ai_settings.model` fica apenas reservado para uma futura ativação deliberada.

## Operação

Os controles administrativos existentes continuam válidos: ativação global, manutenção, limites diário global e por visitante, tamanho máximo da mensagem, planos elegíveis e concessões manuais auditáveis. O catálogo comercial nunca é decidido por texto livre ou por modelo.

Para validar uma publicação, testar pelo menos:

1. “Tem vaga de emprego?”
2. “Quero um cupom.”
3. “Consultar tabela FIPE.”
4. Uma busca de empresa seguida por “onde fica a primeira?”
5. “Qual fica mais perto de mim?”, aceitando e recusando a localização.

## Evolução futura

Gemini deve continuar desligado enquanto a prioridade for evitar custo de modelo. Se for ativado futuramente, a mudança precisa ser explícita, consumir a cota separada de modelo e manter o banco como autoridade sobre empresas e conteúdo elegíveis.
