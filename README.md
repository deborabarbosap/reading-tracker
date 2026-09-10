# Rastreador de Leitura

App web para registrar livros lidos e livros que se quer ler. Feito como
alvo de treino para automação de testes (Cypress / Playwright).

## Requisitos

- Node.js 18 ou superior

## Instalação

```bash
npm install
```

Isso instala as dependências da raiz, do `client/` e do `server/` (npm workspaces).

## Rodar em desenvolvimento

```bash
npm run dev
```

- Front-end: http://localhost:5173
- API: http://localhost:3001

Para rodar separadamente: `npm run dev:server` ou `npm run dev:client`.

## Login

- Usuário: `admin`
- Senha: `admin123`

O login devolve um token fixo (`token-de-teste-123`) que o front guarda no
`localStorage` na chave `token` e envia no header `Authorization: Bearer`.

## Resetar os dados de teste

Apaga todos os livros e recria a lista fixa (5 lidos + 3 "quero ler"):

```bash
npm run reset
# ou
curl -X POST http://localhost:3001/api/test/reset
```

Esse endpoint não exige autenticação, de propósito, para facilitar o uso
em testes automatizados.

## API

Base: `/api`. Todas as rotas de livros e estatísticas exigem o header
`Authorization: Bearer token-de-teste-123`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/login` | `{ username, password }` → `{ token }` |
| GET | `/api/books` | lista; filtros: `?status=&genre=&format=&literature=&search=` |
| GET | `/api/books/:id` | um livro |
| POST | `/api/books` | cria |
| PUT | `/api/books/:id` | edita / move "quero ler" → "lido" |
| DELETE | `/api/books/:id` | exclui |
| GET | `/api/stats` | totais e contagens |
| POST | `/api/test/reset` | reseta os dados (sem token) |

Erros retornam JSON `{ "error": "..." }`; erros de validação incluem
`{ "errors": [{ "field", "message" }] }`.

## Valores fixos

- **Gêneros:** Thriller Psicológico, Comédia Romântica, Distopia, Romance
- **Literatura:** `estrangeira`, `brasileira`
- **Formato:** `fisico`, `ebook`, `audiobook`
- **Status:** `quero_ler`, `lido`

Campos obrigatórios em "quero ler": título, autor, gênero, literatura.
Em "lido": todos os anteriores + páginas, formato, data de início e data de fim.

## Estrutura

```
client/   front-end React + Vite
server/   API Express + SQLite (arquivo server/data.sqlite, criado sozinho)
```

## data-testid

Todos os elementos interativos têm `data-testid` em português. Exemplos:
`input-usuario`, `input-senha`, `botao-entrar`, `aba-lido`, `aba-quero-ler`,
`botao-adicionar-livro`, `input-busca`, `select-genero`, `card-livro-<id>`,
`botao-editar-<id>`, `botao-excluir-<id>`, `botao-marcar-lido-<id>`,
`form-livro`, `input-titulo`, `botao-salvar-livro`, `modal-confirmacao`,
`botao-confirmar-exclusao`, `stat-total-lidos`.

## Testes

Este repositório **não inclui testes nem frameworks de teste** — eles são
o exercício. Instale e configure Cypress ou Playwright separadamente e
escreva os casos apontando para http://localhost:5173, usando
`POST /api/test/reset` para deixar o estado conhecido antes de cada teste.
