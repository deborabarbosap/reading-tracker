# Relatório de execução — Ciclo 1

| Item | Valor |
|---|---|
| Período | 15/09/2026 |
| Executado por | Débora Barbosa |
| Versão | commit `05df2da` da branch `main` |
| Ambiente | Linux x86_64 · Chrome 152 · Node.js v24.20.0 · front na porta 5173, API na 3001 |
| Referências | [Plano](test-plan.md) · [Casos](test-cases.md) · [Achados](findings.md) |

> **Como foi executado:** a base tinha livros reais, então o
> `npm run reset` **não** foi usado. Cada caso criou livros com o prefixo
> `[QA]`, apagados no fim. As estatísticas voltaram para 9 lidos, 4
> "quero ler" e 3.530 páginas. Os casos que dependem da massa do reset
> foram executados com dados equivalentes (indicado na observação) ou
> ficaram como não executados.

## 1. Resumo

| Resultado | Qtd. | % |
|---|---|---|
| ✅ Passou | 50 | 90,9% |
| ❌ Falhou | 3 | 5,5% |
| ⏭️ Não executado | 2 | 3,6% |
| **Total de execuções** | **55** | **100%** |

| Indicador | Valor |
|---|---|
| `@smoke` aprovados | 7 de 8 (CT-037 não executado: depende do reset) |
| Achados | 4 bugs (1 crítico · 1 médio · 2 baixos) · 5 melhorias · 3 riscos → [findings.md](findings.md) |
| Critério de saída atingido? | **Não.** BUG-002 (crítico) está aberto e o CT-037 (`@smoke`) não foi executado |

## 2. Resultados

**Legenda:** ✅ Passou · ❌ Falhou · ⏭️ Não executado. A prioridade de cada
caso está em [`test-cases.md`](test-cases.md).

### Login e sessão

| ID | Resultado | Achado | Observação |
|---|---|---|---|
| CT-001 `@smoke` | ✅ | | `POST /api/login` → 200; redireciona para `/` e grava o token |
| CT-002 | ⏭️ | | Pendente |
| CT-003 | ✅ | | 401 e "Usuário ou senha inválidos"; permanece em `/login` |
| CT-004 | ✅ | [MEL-01](findings.md#melhorias) | Mostra o erro, mas chama a API mesmo com os campos vazios |
| CT-005 | ✅ | | `/` e `/estatisticas` redirecionam para `/login`. API sem token → 401 |
| CT-006 | ✅ | | Volta para `/login`; o botão Voltar do navegador não mostra a lista |

### Cadastro de livro

| ID | Resultado | Achado | Observação |
|---|---|---|---|
| CT-007 `@smoke` | ✅ | | `POST /api/books` → 201 |
| CT-008 `@smoke` | ✅ | | 201; card mostra o período e "Sem capa". Também testado com capa no próprio formulário |
| CT-009.1 | ✅ | [BUG-008](findings.md#bug-008) | 400 e mensagem correta, mas ela não some ao corrigir o campo |
| CT-009.2 | ✅ | | 400 e mensagem correta |
| CT-009.3 | ✅ | | 400 e mensagem correta |
| CT-009.4 | ✅ | | 400 e mensagem correta |
| CT-010.1 | ✅ | | 400 e mensagem correta (páginas) |
| CT-010.2 | ✅ | | 400 e mensagem correta (formato) |
| CT-010.3 | ✅ | | 400 e mensagem correta (data de início) |
| CT-010.4 | ✅ | | 400 e mensagem correta (data de fim) |
| CT-011 | ✅ | | Mensagem de data correta |
| CT-012 | ✅ | | Livro salvo |
| CT-013.1 | ✅ | | O navegador bloqueia ("O valor deve ser maior ou igual a 1") |
| CT-013.2 | ✅ | | O navegador bloqueia |
| CT-013.3 | ✅ | | Executado com `12.5` (mesma classe). O navegador bloqueia. A API não foi testada com decimal (ciclo 2) |
| CT-014 | ✅ | | Nada é salvo; o formulário reabre limpo |
| CT-015 | ✅ | | Tratado como vazio; o mesmo vale para o autor |

### Transição de status

| ID | Resultado | Achado | Observação |
|---|---|---|---|
| CT-016 `@smoke` | ✅ | | `PUT /api/books/:id` → 200 |
| CT-017 | ✅ | | `PUT` → 400 com erros nos quatro campos |
| CT-018 | ✅ | | Também verificado o sentido "lido" → "quero ler": páginas, formato e datas são descartados, como define a regra |

### Filtros, busca e ordenação

| ID | Resultado | Achado | Observação |
|---|---|---|---|
| CT-019 `@smoke` | ✅ | | "Lido" mostra páginas, formato e período; "Quero ler" mostra só gênero e literatura |
| CT-020.1 | ✅ | | Parâmetro `genre` |
| CT-020.2 | ✅ | [MEL-09](findings.md#melhorias) | Parâmetro `format=ebook`. Em "Quero ler" a lista fica sempre vazia |
| CT-020.3 | ✅ | | Parâmetro `literature=brasileira` |
| CT-021 | ✅ | | "Nenhum livro encontrado" |
| **CT-022.1** | ❌ | [BUG-004](findings.md#bug-004) | Sem reset: executado com `cadaver` para "Saboroso Cadáver". Não encontra; com `cadáver`, encontra |
| CT-022.2 | ✅ | | Executado com `SABOROSO CADÁVER`: encontra |
| CT-022.3 | ✅ | | Executado com `montes`: encontra os 2 livros de Raphael Montes |
| CT-023 | ✅ | | |
| CT-024 | ✅ | | |
| CT-025 | ✅ | | Sem campo de ordenação; ordem alfabética |
| CT-026 | ✅ | | Lido + Thriller Psicológico + Brasileira, também com ordenação crescente |

### Exclusão

| ID | Resultado | Achado | Observação |
|---|---|---|---|
| CT-027 `@smoke` | ✅ | | `DELETE /api/books/:id` → 204; a capa também é apagada (URL passa a dar 404) |
| CT-028 | ✅ | | Nenhuma requisição enviada; o livro continua na lista |
| CT-029 | ✅ | | 12 → 11 lidos e 14.179 → 4.180 páginas ao excluir um livro de 9.999 páginas |

### Capa do livro

| ID | Resultado | Achado | Observação |
|---|---|---|---|
| CT-030 `@smoke` | ✅ | | 200; aparecem "Trocar capa" e "Remover capa" |
| CT-031 | ✅ | | A capa anterior é apagada do disco (URL antiga: 200 → 404) |
| CT-032 | ✅ | | `DELETE .../book-cover` → 200; card mostra "Sem capa" |
| **CT-033** | ❌ | [BUG-002](findings.md#bug-002) | 1ª execução: 2 MB + 1 byte derrubou a API. 2ª: 400 correto. 2,1 MB e 6 MB → 400 correto |
| CT-034.1 | ✅ | | 400 "Formato inválido. Use PNG, JPEG ou WEBP" |
| CT-034.2 | ✅ | | 400, mesma mensagem |
| CT-034.3 | ✅ | [RISCO-01](findings.md#riscos) | 400, mesma mensagem. Texto renomeado para `.png` é aceito |
| CT-035.1 | ✅ | | 200; imagem exibida |
| CT-035.2 | ✅ | | 200; imagem exibida |
| **CT-036** | ❌ | [BUG-007](findings.md#bug-007) | 2.097.152 bytes → 400. 1,8 MB é aceito |

### Estatísticas

| ID | Resultado | Achado | Observação |
|---|---|---|---|
| CT-037 `@smoke` | ⏭️ | | Depende do reset. Consistência conferida com a base atual (9 lidos, 4 "quero ler", 3.530 páginas; agrupamentos batem com a lista) |
| CT-038 | ✅ | | 9 → 12 lidos e 3.530 → 14.179 páginas após 3 cadastros |
| CT-039 | ✅ | | "Quero ler" = 5, lidos = 12 e páginas = soma só dos lidos |
| CT-040 | ✅ | | Antes: 10 lidos, 3.730 páginas, 5 "quero ler". Depois: 11, 3.880 e 4 |

## 3. Evidências

Os prints ainda serão salvos em [`evidencias/`](evidencias/), com estes nomes:

| Arquivo | Referente a |
|---|---|
| `BUG-002-listagem-erro.png`, `BUG-002-log-servidor.txt` | CT-033 |
| `BUG-004-busca-acento.png` | CT-022.1 |
| `BUG-007-limite-2mb.png` | CT-036 |
| `BUG-008-erros-persistentes.png` | CT-009.1 |

## 4. Sessões exploratórias

| ID | Missão | O que encontrei | Achados |
|---|---|---|---|
| EX-01 | Upload de capa: formatos (txt, gif, pdf, svg, texto com `.png`), tamanhos em torno de 2 MB, trocas e remoções seguidas, arquivo antigo no disco | Queda da API; limite de 2 MB diferente da regra; arquivo disfarçado aceito; capa antiga e de livro excluído são apagadas, como define a regra | BUG-002, BUG-007, RISCO-01 |
| EX-02 | Busca e filtros: maiúsculas, acentos, espaços nas pontas, termo inexistente, filtros combinados, troca de aba com filtro ativo, recarregar a página | Busca não ignora acentos; espaços nas pontas não são removidos; uma requisição por letra; filtros voltam ao padrão ao recarregar | BUG-004, MEL-02, MEL-08 |
| EX-03 | Formulário e ciclo de vida do livro: obrigatórios um a um, limites, lido → quero ler → marcar como lido, cancelar, tecla Esc | Mensagens de erro não somem e a primeira aparece duplicada no rodapé; modal não fecha com Esc | BUG-008, MEL-03 |
| EX-04 | Sessão e rotas: logout, botão Voltar, rota inexistente, API sem token, estatísticas contra a lista | Rotas protegidas e API corretas; rota inexistente leva para `/`; totais conferem | RISCO-02, RISCO-03 |

As sessões não foram cronometradas. Sugestão para o próximo ciclo:
limitar cada uma a 30 minutos.

## 5. Conclusão

A versão **não está pronta para uso**: o BUG-002 pode derrubar a API
durante um upload de capa, e ela só volta com reinício manual.

Fora isso, login, cadastro, validações, troca de status, exclusão e
estatísticas seguem as regras (90,9% de aprovação). Os problemas se
concentraram nas áreas de **entrada livre**, capa e busca, que o
[plano](test-plan.md#8-riscos-conhecidos) já apontava como as de maior
risco.

**Próximo ciclo:**

1. Repetir a sequência do BUG-002 10 vezes para medir a frequência.
2. Executar CT-002 e CT-037, este com reset em um banco só de testes.
3. Testar pela API o que a interface não alcança: páginas decimais,
   valores fora das listas, ordenação sem `status=lido` e reset.
4. Automatizar os casos `@smoke` com Cypress.

## 6. Lições aprendidas

- **Conferir a causa antes de registrar.** Depois da queda da API,
  "Trocar capa" e "Remover capa" pareciam bugs novos. O log do servidor
  mostrou que eram efeito da API fora do ar. Sem essa checagem, seriam
  dois falsos positivos.
- **Ter as regras escritas antes de executar.** Parte dos achados foi
  reclassificada (bug → melhoria ou risco) quando o documento de regras
  chegou. Por isso há IDs de bug pulados.
- **Não depender de dados reais.** Sem banco de teste, o reset não pôde
  ser usado e alguns casos rodaram com dados equivalentes.
- **Valor-limite exato vale a pena.** Testar exatamente 2.097.152 bytes
  revelou um desvio que 1,8 MB e 2,1 MB não mostrariam.
- **Desconfiar das ferramentas.** A extensão do navegador mostrou 503
  para exclusões que retornaram 204. O status real foi conferido por
  outro meio.
- **Salvar a evidência na hora.** Os prints ficaram para depois e
  precisam ser refeitos. No próximo ciclo, capturar no momento da
  falha, com a aba Rede aberta.