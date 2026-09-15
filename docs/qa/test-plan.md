# Plano de Testes — Ciclo 1 (Testes funcionais manuais)

## 1. Identificação

| Item | Valor |
|---|---|
| Ciclo | Ciclo 1 — testes funcionais manuais |
| Tipo | Teste funcional manual, via interface web |
| Versão alvo | branch `main` |
| Ambiente | instância local (`npm run dev`) |
| Referências | [Casos de teste](test-cases.md) · [Regras de negócio](../requirements/business-rules.md) · [API](../api/endpoints.md) |

## 2. Objetivo

Validar que os fluxos funcionais da aplicação se comportam de acordo com
as regras documentadas em `docs/requirements/business-rules.md`, antes de
avançar para as próximas etapas da estratégia de qualidade (testes de
API, automação).

## 3. Escopo

**Dentro do escopo** (7 áreas, 40 casos roteirizados em `test-cases.md`):

1. Login e sessão
2. Cadastro de livro (validações, campos condicionais)
3. Transição de status ("quero ler" → "lido")
4. Filtros, busca e ordenação
5. Exclusão de livro
6. Capa do livro
7. Estatísticas

**Fora do escopo deste ciclo:**

- Testes de API isolados e validação via SQL (próxima etapa da
  estratégia de qualidade).
- Automação E2E e CI/CD (etapas seguintes).
- Desempenho, carga, segurança avançada e compatibilidade
  cross-browser extensiva.

## 4. Estratégia

- **Tipos de teste:** funcional (caminho feliz), negativo (dados
  inválidos), limite/borda (valores extremos: 0 páginas, 2 MB exatos,
  data de fim igual à de início) e exploratório (sem roteiro fixo).
- **Casos roteirizados:** 40 (`CT-001` a `CT-040`), descritos em Gherkin
  em `test-cases.md`, organizados nas 7 áreas do escopo.
- **Smoke test:** subconjunto de 8 casos marcados `@smoke` — `CT-001`,
  `CT-007`, `CT-008`, `CT-016`, `CT-019`, `CT-027`, `CT-030`, `CT-037`.
  Precisam passar antes de considerar qualquer versão estável para uso.
- **Sessões exploratórias:** 4 sessões (`EX-01` a `EX-04`), sem roteiro
  fixo, para procurar comportamento inesperado fora do que os cenários
  formais já cobrem.

## 5. Ambiente e dados de teste

- Aplicação local: front-end em `http://localhost:5173`, API em
  `http://localhost:3001` (`npm run dev`).
- Login fixo: `admin` / `admin123`.
- Rodar `npm run reset` (`POST /api/test/reset`) antes de testar cada
  área do escopo, para partir sempre de um estado conhecido (8 livros
  fixos: 5 "lido" + 3 "quero ler", 3 deles com capa de exemplo).

## 6. Critérios de entrada

- `test-cases.md` escrito e revisado.
- Ambiente local rodando e `npm run reset` funcionando.

## 7. Critérios de saída

- Todos os 8 casos `@smoke` com resultado "Passou".
- Nenhum bug de severidade Crítica em aberto.
- 100% dos 40 casos roteirizados executados (bloqueios justificados no
  relatório de execução).
- Pelo menos uma sessão exploratória realizada.

## 8. Riscos conhecidos

- **Busca não ignora acentuação** (ver
  `docs/requirements/business-rules.md`): buscar `"admiravel"` (sem
  acento) não encontra `"Admirável Mundo Novo"`. O caso `CT-022.1` espera
  esse resultado — não é falha de execução, é o comportamento real e
  conhecido do código.
- Demais limitações conhecidas do projeto (CORS aberto, token sem
  expiração) não fazem parte do escopo funcional deste ciclo.

## 9. Papéis

| Papel | Responsável |
|---|---|
| Execução dos casos | Débora Barbosa |
| Revisão dos cenários e apoio técnico | Claude |

## 10. Entregáveis

- Este plano (`test-plan.md`).
- Casos de teste (`test-cases.md`).
- Relatório de execução do ciclo, com resultado por caso e sessões
  exploratórias.
- Bugs encontrados, registrados conforme o processo em uso no momento
  (issue ou arquivo local).
