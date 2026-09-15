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

A estratégia de qualidade do **Reading Tracker** contempla diferentes níveis de validação, acompanhando a evolução da aplicação desde os testes funcionais até a automação e integração contínua.

1. **Testes funcionais e documentação de QA** — cenários de teste, critérios de validação, execução, evidências e registro de defeitos.

2. **Testes de API e validação de dados** — validação de endpoints, autenticação, códigos HTTP, payloads, cenários positivos e negativos e conferência da persistência dos dados no banco.

3. **Automação E2E** — automação dos principais fluxos da aplicação utilizando Cypress.

4. **CI/CD** — execução automatizada dos testes em pipeline de integração contínua utilizando GitHub Actions.

## 📊 Status do projeto

| Área                                   | Status                  |
| -------------------------------------- | ----------------------- |
| Aplicação                              | ✅ Concluída             |
| Testes funcionais e documentação de QA | 🟡 Em evolução          |
| Testes de API e validação de dados     | ⚪ Planejado             |
| Automação E2E com Cypress              | 🟡 Configuração inicial |
| CI/CD com GitHub Actions               | ⚪ Planejado             |

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
| Gherkin / BDD | Cenários de teste funcional | 🟡 Em andamento |
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

A estratégia de qualidade, os cenários de teste (Gherkin/BDD) e os
registros de execução fazem parte deste mesmo repositório:

- [`docs/qa/test-strategy.md`](docs/qa/test-strategy.md) — estratégia de qualidade.
- [`docs/qa/test-cases.md`](docs/qa/test-cases.md) — cenários funcionais.

## 📁 Estrutura do projeto

```
client/    front-end React + Vite
server/    API Express + SQLite (arquivo server/data.sqlite, criado sozinho)
cypress/   configuração inicial da automação end-to-end (sem specs ainda)
docs/
  requirements/  regras de negócio
  api/           documentação da API
  qa/            estratégia de qualidade e casos de teste
  superpowers/   documentação interna do processo de desenvolvimento
```

## 📄 Licença

Este projeto ainda não possui uma licença definida.
