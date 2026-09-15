# Estratégia de qualidade

Este documento descreve a estratégia de qualidade do Reading Tracker —
o que já está definido/implementado e como as próximas etapas vão se
encaixar. Não é um relatório de execução (isso fica em
`docs/qa/test-cases.md` e nos registros de execução, quando existirem).

## Objetivo

Garantir que as regras de negócio documentadas em
`docs/requirements/business-rules.md` e o contrato de API documentado em
`docs/api/endpoints.md` se comportem como especificado, através de
camadas complementares de verificação.

## Etapas

1. **Testes funcionais e documentação de QA** — cenários funcionais da
   interface web, escritos em Gherkin/BDD (`docs/qa/test-cases.md`),
   cobrindo os fluxos principais da aplicação (login, cadastro de livro,
   transição de status, filtros/busca, exclusão, capa, estatísticas).
2. **Testes de API e validação de dados** — casos positivos e negativos
   direto na API (autenticação, código HTTP, payload, resposta), com
   conferência cruzada dos dados persistidos no SQLite.
3. **Automação E2E** — automação dos cenários funcionais com Cypress,
   reaproveitando os cenários descritos em `test-cases.md` como base.
4. **CI/CD** — execução automática da suíte de automação em pipeline
   (GitHub Actions), a cada push/PR.

O status atual de cada etapa está na tabela "Status do projeto" do
`README.md` — não duplicado aqui para evitar informação divergente em
dois lugares.

## Ambiente e dados de teste

- Aplicação rodando localmente (`npm run dev`): front-end em
  `http://localhost:5173`, API em `http://localhost:3001`.
- Login fixo: `admin` / `admin123`.
- `POST /api/test/reset` (sem autenticação) recria um estado conhecido —
  8 livros fixos (5 "lido" + 3 "quero ler"), 3 deles com capa de exemplo.
  Deve ser chamado antes de cada rodada de testes, para os resultados não
  dependerem de dados deixados por execuções anteriores.

## Convenções

- Todos os elementos interativos da interface têm `data-testid` em
  português, com nomes estáveis (ex.: `input-usuario`, `botao-entrar`,
  `card-livro-<id>`) — pensados para servir de seletor tanto em testes
  manuais quanto na automação E2E.
- Cenários funcionais são escritos em Gherkin (`Funcionalidade`,
  `Cenário`, `Dado`, `Quando`, `Então`), em português.

## Critérios gerais

- **Entrada:** a regra de negócio ou rota da API envolvida no cenário já
  está documentada em `docs/requirements/business-rules.md` ou
  `docs/api/endpoints.md`.
- **Saída:** o cenário foi executado (manual ou automatizado) contra um
  estado de dados conhecido (pós-reset) e o resultado foi registrado.
