# 📚 Reading Tracker

Aplicação web para registrar livros lidos e livros que quero ler,
acompanhada por uma estratégia de qualidade contínua.

## 🎯 Sobre o projeto

O **Reading Tracker** é uma aplicação full-stack desenvolvida para gerenciamento de leituras. A aplicação permite cadastrar livros, acompanhar seu status, realizar buscas e filtros, gerenciar capas e consultar estatísticas da biblioteca, como **quantidade total de livros, distribuição por gênero e total de páginas lidas**.

A aplicação utiliza **React + Vite** no front-end, **Node.js + Express** na API e **SQLite** para persistência dos dados.

O projeto possui uma **estratégia de qualidade integrada ao desenvolvimento**, contemplando testes funcionais, validação de regras de negócio, testes de API, validação de dados, automação E2E e integração contínua. Os artefatos de desenvolvimento e qualidade são mantidos no mesmo repositório, acompanhando a evolução da aplicação.

## ✨ Funcionalidades

- Login com usuário e senha fixos.
- Cadastro de livros em dois status: **quero ler** e **lido**, com campos
  condicionais (páginas, formato e datas de leitura só são obrigatórios
  para livros já lidos).
- Edição, exclusão (com modal de confirmação) e transição de "quero ler"
  para "lido".
- Filtros por status, gênero, formato e literatura, além de busca por
  texto.
- Ordenação da aba "lido" por data de fim da leitura (mais recente ou
  mais antiga primeiro).
- Upload, troca e remoção da capa do livro (opcional).
- Página de estatísticas (totais, páginas lidas, contagens por gênero /
  formato / literatura).

Regras detalhadas (valores fixos, campos obrigatórios, etc.) estão na
seção "Regras de negócio" mais abaixo.

## 🧪 Estratégia de Qualidade

A qualidade evolui em camadas, e cada uma cobre o que a anterior não
alcança. Detalhes em [`docs/qa/`](docs/qa/README.md).

| Camada | O que cobre | Status |
|---|---|---|
| Aplicação | Front-end, API e banco | ✅ Concluída |
| 1. Testes funcionais manuais | 40 cenários em Gherkin, plano, execução, bugs e evidências | ✅ Ciclo 1 executado |
| 2. Testes de API e dados | Endpoints, autenticação, códigos HTTP, payloads e conferência no banco | ⚪ Planejado |
| 3. Automação E2E | Principais fluxos com Cypress, a partir dos cenários `@smoke` | 🟡 Configuração inicial |
| 4. CI/CD | Testes automatizados no GitHub Actions a cada push/PR | ⚪ Planejado |

**Ciclo 1 em números:** 55 execuções · 90,9% aprovadas · 4 bugs (1
crítico) · 5 melhorias · 3 riscos.
[Ver relatório](docs/qa/execution-report.md)

## 🛠️ Tecnologias

### Aplicação

| Tecnologia | Papel | Status |
|---|---|---|
| React 18 | Front-end (SPA) | ✅ Em uso |
| React Router 6 | Roteamento no client | ✅ Em uso |
| Vite 5 | Build e dev server do client | ✅ Em uso |
| Express 4 | API REST | ✅ Em uso |
| better-sqlite3 | Banco de dados (arquivo local) | ✅ Em uso |
| multer | Upload de capas de livro | ✅ Em uso |
| cors | Middleware CORS da API | ✅ Em uso |
| Node.js 18+ | Runtime | ✅ Em uso |

### Qualidade

| Ferramenta | Papel | Status |
|---|---|---|
| Gherkin / BDD | Cenários de teste funcional | ✅ Em uso |
| Cypress | Automação de testes end-to-end | 🟡 Configuração inicial |
| Validação via SQL | Conferência de dados persistidos no SQLite | ⚪ Planejado |

### DevOps

| Ferramenta | Papel | Status |
|---|---|---|
| Git / GitHub | Versionamento e revisão (branches + PR) | ✅ Em uso |
| GitHub Actions | Pipeline de CI/CD | ⚪ Planejado |

## 📋 Requisitos

- Node.js 18 ou superior

## 🚀 Como executar

```bash
npm install
```

Instala as dependências da raiz, do `client/` e do `server/` (npm
workspaces).

```bash
npm run dev
```

- Front-end: http://localhost:5173
- API: http://localhost:3001

Para rodar separadamente: `npm run dev:server` ou `npm run dev:client`.

## 🔐 Ambiente de testes

- Usuário: `admin` / Senha: `admin123`.
- O login devolve um token fixo (`token-de-teste-123`), enviado no header
  `Authorization: Bearer` nas rotas que exigem autenticação.
- Para partir de um estado conhecido antes de qualquer rodada de testes:

  ```bash
  npm run reset
  # ou
  curl -X POST http://localhost:3001/api/test/reset
  ```

  Esse endpoint não exige autenticação, de propósito. Ele apaga todos os
  livros e uploads e recria a lista fixa (8 livros: 5 lidos + 3 "quero
  ler"), aplicando 3 capas de exemplo (versionadas em
  `server/seed-assets/`) aos livros "A Garota no Trem", "1984" e "Torto
  Arado".

## 📖 Regras de negócio

Status dos livros, campos obrigatórios e condicionais, valores fixos
(gêneros, literatura, formato), regras da capa e das estatísticas:
ver [`docs/requirements/business-rules.md`](docs/requirements/business-rules.md).

## 🔗 API

API REST em `/api`, autenticada por token fixo. Documentação completa de
rotas, payloads, respostas e códigos HTTP:
ver [`docs/api/endpoints.md`](docs/api/endpoints.md).

## 🧪 Documentação de QA

Comece pelo [`docs/qa/README.md`](docs/qa/README.md). Os documentos são:

| Documento | Conteúdo |
|---|---|
| [`test-plan.md`](docs/qa/test-plan.md) | Escopo, análise de risco, critérios e rastreabilidade regra → caso → resultado |
| [`test-cases.md`](docs/qa/test-cases.md) | 40 cenários em Gherkin/BDD |
| [`execution-report.md`](docs/qa/execution-report.md) | Resultados do ciclo 1, sessões exploratórias, conclusão e lições aprendidas |
| [`findings.md`](docs/qa/findings.md) | Bugs, melhorias e riscos |

## 📁 Estrutura do projeto

```
client/    front-end React + Vite
server/    API Express + SQLite (arquivo server/data.sqlite, criado sozinho)
cypress/   configuração inicial da automação end-to-end (sem specs ainda)
docs/
  requirements/  regras de negócio
  api/           documentação da API
  qa/            plano, casos, relatório, achados e evidências de teste
  superpowers/   documentação interna do processo de desenvolvimento
```

## 📄 Licença

Este projeto ainda não possui uma licença definida.