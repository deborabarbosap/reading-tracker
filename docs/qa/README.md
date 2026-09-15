# Qualidade — Reading Tracker

Documentação de QA do Reading Tracker: como a qualidade é pensada, o que
foi testado, o que foi encontrado e o que vem a seguir.

## Como ler esta pasta

| Documento | Responde a |
|---|---|
| [`test-plan.md`](test-plan.md) | **O que** testar, **por quê** e **quando parar**: escopo, riscos, critérios e rastreabilidade das regras |
| [`test-cases.md`](test-cases.md) | **Como** testar: 40 cenários em Gherkin/BDD |
| [`execution-report.md`](execution-report.md) | **O que aconteceu** no ciclo: resultados, sessões exploratórias, conclusão e lições |
| [`findings.md`](findings.md) | **O que foi encontrado**: bugs, melhorias e riscos |
| [`evidencias/`](evidencias/) | Prints e logs citados nos documentos acima |

Cada informação fica em um único lugar. Os outros documentos só apontam
para ele.

## Estratégia em camadas

1. **Testes funcionais manuais**: fluxos da interface web, descritos em
   Gherkin/BDD.
2. **Testes de API e dados**: status HTTP, payloads, cenários negativos e
   conferência dos dados gravados no SQLite.
3. **Automação E2E**: Cypress reaproveitando os cenários `@smoke` e
   `@alta`.
4. **CI/CD**: suíte automatizada no GitHub Actions a cada push ou PR.

Cada camada cobre o que a anterior não alcança. Por exemplo: a interface
bloqueia páginas decimais, então a camada 2 confere se a API também
bloqueia.

O status de cada camada fica na seção "Estratégia de qualidade" do
[README principal](../../README.md).

## Ambiente e dados de teste

Como subir a aplicação, o login e o `npm run reset` estão no
[README principal](../../README.md#-ambiente-de-testes).

**No ciclo 1**, a base tinha livros reais, e o reset não foi usado. Os
testes criaram livros com o prefixo `[QA]` e os apagaram no fim.
Detalhes no [relatório](execution-report.md). A partir do próximo ciclo,
a API vai usar um banco só de testes, para o reset poder ser rodado antes
de cada área.

## Convenções

| Item | Padrão |
|---|---|
| Casos de teste | `CT-001`; variações de um esquema: `CT-009.1` |
| Sessões exploratórias | `EX-01` |
| Achados | `BUG-002`, `MEL-01`, `RISCO-01` |
| Tags | `@smoke` (precisa passar antes de liberar), `@alta`, `@media`, `@baixa` |
| Seletores | `data-testid` em português e estáveis (ex.: `input-usuario`, `card-livro-<id>`), usados no teste manual e na automação |
| Evidências | `CT-XXX-resultado.png`, `BUG-XXX-descricao.png` |

## Referências

- Regras de negócio: [`../requirements/business-rules.md`](../requirements/business-rules.md)
- Contrato da API: [`../api/endpoints.md`](../api/endpoints.md)