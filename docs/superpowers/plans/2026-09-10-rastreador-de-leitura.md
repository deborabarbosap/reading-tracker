# Rastreador de Leitura — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um app web (React + Express + SQLite) para registrar livros lidos e livros que se quer ler, com CRUD completo, filtros, estatísticas e um endpoint de reset — pensado como alvo de treino para automação de testes.

**Architecture:** Duas pastas em um monorepo com npm workspaces: `server/` (Express + better-sqlite3, API REST em `/api`) e `client/` (React + Vite, SPA com React Router). Em desenvolvimento, o Vite serve o front na porta 5173 e faz proxy de `/api` para o Express na 3001. O back-end é dividido por responsabilidade: `db.js` (conexão + schema), `books-repo.js` (acesso a dados), `validation.js` (regras de negócio), `routes/` (tradução HTTP ↔ dados), `middleware/auth.js` (token fixo). O front separa `api/` (chamadas HTTP), `auth/` (token no localStorage), `pages/` e `components/`.

**Tech Stack:** Node.js 18+, Express 4, better-sqlite3 11, React 18, React Router 6, Vite 5, concurrently 9. Sem TypeScript. Sem framework de testes (decisão do produto — ver "Verificação" abaixo).

**Spec:** `docs/superpowers/specs/2026-09-10-rastreador-de-leitura-design.md`

## Global Constraints

- **Node.js:** 18 ou superior.
- **Idioma:** toda a interface, mensagens de erro e textos em português.
- **Sem framework de testes no repositório.** Não instalar Vitest, Jest, Cypress, Playwright nem configurá-los. A usuária faz isso separadamente como exercício.
- **`data-testid` obrigatório** em todo elemento interativo (inputs, selects, botões, abas, cards, modais), em kebab-case e em português. Cards e seus botões incluem o `id` do livro: `card-livro-<id>`, `botao-editar-<id>`, `botao-excluir-<id>`, `botao-marcar-lido-<id>`.
- **Credenciais fixas:** usuário `admin`, senha `admin123`. Token fixo devolvido pelo login: `token-de-teste-123`.
- **Valores fixos (idênticos no back e no front):**
  - `genre`: `Thriller Psicológico`, `Comédia Romântica`, `Distopia`, `Romance`
  - `literature`: `estrangeira`, `brasileira`
  - `format`: `fisico`, `ebook`, `audiobook`
  - `status`: `quero_ler`, `lido`
- **Datas:** armazenadas e trafegadas em ISO `AAAA-MM-DD`; exibidas na interface como `DD/MM/AAAA`.
- **Erros da API:** sempre JSON `{ "error": "mensagem" }`; erros de validação incluem também `{ "errors": [{ "field": "...", "message": "..." }] }`. Status: `200`, `201`, `204`, `400`, `401`, `404`, `500`.
- **Portas:** API `3001`, front `5173`.
- **Commits:** a usuária roda os comandos `git` ela mesma. Cada tarefa termina com um passo de commit com a mensagem sugerida; o worker apresenta o comando e ela executa.

## Verificação (por que não há testes automatizados)

O produto define, de propósito, que o repositório não contém testes. Cada tarefa deste plano termina com uma **verificação manual concreta**: um comando `node -e "..."`, uma chamada `curl` com saída esperada, ou uma interação no navegador com resultado esperado. O ciclo continua sendo "definir o comportamento esperado → verificar → commitar", só que sem um test runner.

Scripts de verificação descartáveis vão em `scratch/` (essa pasta está no `.gitignore` e nunca é commitada).

---

## Mapa de arquivos

**Raiz**
- `package.json` — workspaces, scripts `dev`, `dev:server`, `dev:client`, `reset`
- `.gitignore`
- `README.md`
- `scratch/` — scripts de verificação descartáveis (ignorado no git)

**server/**
- `package.json` — deps: express, cors, better-sqlite3
- `src/index.js` — sobe o servidor (só `app.listen`)
- `src/app.js` — monta o Express: middlewares, rotas, 404, handler de erro
- `src/db.js` — abre `data.sqlite`, cria a tabela `books`
- `src/validation.js` — constantes de valores fixos + `validateBook`
- `src/books-repo.js` — acesso a dados: listar, obter, criar, atualizar, excluir, limpar, semear
- `src/seed.js` — `SEED_BOOKS` (8 livros fixos)
- `src/middleware/auth.js` — `TOKEN` + `requireAuth`
- `src/routes/login.js` — `POST /api/login`
- `src/routes/books.js` — CRUD de `/api/books`
- `src/routes/stats.js` — `GET /api/stats`
- `src/routes/test-reset.js` — `POST /api/test/reset`

**client/**
- `package.json` — deps: react, react-dom, react-router-dom; dev: vite, @vitejs/plugin-react
- `vite.config.js` — plugin react + proxy `/api` → 3001, porta 5173
- `index.html`
- `src/main.jsx` — render + BrowserRouter
- `src/App.jsx` — rotas
- `src/styles.css` — estilo limpo e funcional
- `src/config.js` — `GENEROS`, `LITERATURAS`, `FORMATOS` (rótulos para a UI)
- `src/auth/tokenStorage.js` — `getToken`, `setToken`, `clearToken`
- `src/auth/RotaProtegida.jsx` — redireciona para `/login` sem token
- `src/api/http.js` — `request` + `get/post/put/del`, injeta token, trata erro
- `src/api/auth.js` — `login`
- `src/api/livros.js` — `listarLivros`, `obterLivro`, `criarLivro`, `atualizarLivro`, `excluirLivro`
- `src/api/stats.js` — `obterEstatisticas`
- `src/pages/Login.jsx`
- `src/pages/ListaLivros.jsx`
- `src/pages/Estatisticas.jsx`
- `src/components/Cabecalho.jsx`
- `src/components/CardLivro.jsx`
- `src/components/Filtros.jsx`
- `src/components/FormularioLivro.jsx`
- `src/components/ModalConfirmacao.jsx`

---

## Task 1: Scaffold do monorepo (raiz)

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md` (esqueleto — finalizado na Task 21)
- Create: `scratch/.gitkeep`

**Interfaces:**
- Consumes: nada.
- Produces: script `npm run dev` (só funciona depois que `server/` e `client/` existirem); workspaces `client` e `server`.

- [ ] **Step 1: Criar `package.json` na raiz**

```json
{
  "name": "rastreador-de-leitura",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently -n server,client -c blue,green \"npm run dev -w server\" \"npm run dev -w client\"",
    "dev:server": "npm run dev -w server",
    "dev:client": "npm run dev -w client",
    "reset": "curl -X POST http://localhost:3001/api/test/reset"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

- [ ] **Step 2: Criar `.gitignore`**

```gitignore
node_modules/
dist/
scratch/
server/data.sqlite
server/data.sqlite-journal
server/data.sqlite-wal
server/data.sqlite-shm
.DS_Store
```

- [ ] **Step 3: Criar `README.md` (esqueleto)**

```markdown
# Rastreador de Leitura

App web para registrar livros lidos e livros que se quer ler.
Feito como alvo de treino para automação de testes (Cypress / Playwright).

Instruções completas de uso serão adicionadas ao final da implementação.
```

- [ ] **Step 4: Criar `scratch/.gitkeep` (arquivo vazio)**

Cria a pasta `scratch/` para scripts de verificação. Está no `.gitignore`, então só o `.gitkeep` seria versionado — mas como a pasta inteira está ignorada, esse arquivo serve só para a pasta existir localmente. Conteúdo: vazio.

- [ ] **Step 5: Verificar**

Run: `node -e "const p=require('./package.json'); console.log(p.workspaces.join(','))"`
Expected: `client,server`

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore README.md
git commit -m "chore: scaffold do monorepo com npm workspaces"
```

---

## Task 2: Servidor — pacote, entrada e camada de banco

**Files:**
- Create: `server/package.json`
- Create: `server/src/db.js`
- Create: `server/src/app.js`
- Create: `server/src/index.js`
- Test (verificação): `scratch/check-db.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `server/src/db.js` exporta `module.exports = db` — instância de `better-sqlite3` já com a tabela `books` criada.
  - `server/src/app.js` exporta `module.exports = app` — instância Express com `express.json()` e `cors()`, sem rotas ainda.
  - Tabela `books(id, status, title, author, genre, literature, pages, format, start_date, end_date, created_at, updated_at)`.

- [ ] **Step 1: Criar `server/package.json`**

```json
{
  "name": "rastreador-de-leitura-server",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.3.0",
    "cors": "^2.8.5",
    "express": "^4.21.0"
  }
}
```

- [ ] **Step 2: Instalar dependências**

Run (na raiz): `npm install`
Expected: instala tudo sem erro; `better-sqlite3` baixa binário pré-compilado. Se falhar por falta de compilador, instalar build-essential/python3 e repetir.

- [ ] **Step 3: Criar `server/src/db.js`**

```js
const path = require("node:path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "data.sqlite");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    literature TEXT NOT NULL,
    pages INTEGER,
    format TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

module.exports = db;
```

- [ ] **Step 4: Criar `server/src/app.js`**

```js
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// As rotas são montadas nas próximas tarefas.

module.exports = app;
```

- [ ] **Step 5: Criar `server/src/index.js`**

```js
const app = require("./app");

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
```

- [ ] **Step 6: Criar `scratch/check-db.js`**

```js
const db = require("../server/src/db");
const cols = db.prepare("PRAGMA table_info(books)").all().map((c) => c.name);
console.log(cols.join(","));
```

- [ ] **Step 7: Verificar o schema**

Run: `node scratch/check-db.js`
Expected: `id,status,title,author,genre,literature,pages,format,start_date,end_date,created_at,updated_at`

- [ ] **Step 8: Verificar que o servidor sobe**

Run: `npm run dev -w server` (aguardar a linha de log, depois Ctrl+C)
Expected: `API rodando em http://localhost:3001`

- [ ] **Step 9: Commit**

```bash
git add server/package.json server/src/db.js server/src/app.js server/src/index.js package-lock.json
git commit -m "feat(server): camada de banco SQLite e app Express base"
```

---

## Task 3: Servidor — validação de livros

**Files:**
- Create: `server/src/validation.js`
- Test (verificação): `scratch/check-validation.js`

**Interfaces:**
- Consumes: nada.
- Produces: `server/src/validation.js` exporta:
  - `GENRES: string[]`, `LITERATURES: string[]`, `FORMATS: string[]`, `STATUSES: string[]`
  - `validateBook(input: object)` → `{ valid: true, value: object }` ou `{ valid: false, errors: [{ field: string, message: string }] }`
  - `value` sempre tem as chaves: `status, title, author, genre, literature, pages, format, start_date, end_date`. Para `status === "quero_ler"`, `pages/format/start_date/end_date` vêm `null`.

- [ ] **Step 1: Definir o comportamento esperado (será checado no Step 3)**

`validateBook`:
- `status` fora de `["quero_ler","lido"]` → erro campo `status`.
- `title` e `author`: string não-vazia após `trim` — sempre obrigatórios.
- `genre` deve estar em `GENRES`; `literature` em `LITERATURES` — sempre obrigatórios.
- Se `status === "lido"`: `pages` inteiro > 0; `format` em `FORMATS`; `start_date` e `end_date` no formato `AAAA-MM-DD`; `end_date` não pode ser string menor que `start_date`.
- Se `status === "quero_ler"`: `pages/format/start_date/end_date` são forçados a `null` (ignora o que veio).
- Retorna todos os erros encontrados, não só o primeiro.

- [ ] **Step 2: Criar `server/src/validation.js`**

```js
const GENRES = ["Thriller Psicológico", "Comédia Romântica", "Distopia", "Romance"];
const LITERATURES = ["estrangeira", "brasileira"];
const FORMATS = ["fisico", "ebook", "audiobook"];
const STATUSES = ["quero_ler", "lido"];

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const ROTULOS = { title: "título", author: "autor" };

function textoObrigatorio(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function validateBook(input) {
  const data = input || {};
  const errors = [];
  const value = {
    status: null,
    title: null,
    author: null,
    genre: null,
    literature: null,
    pages: null,
    format: null,
    start_date: null,
    end_date: null,
  };

  if (!STATUSES.includes(data.status)) {
    errors.push({ field: "status", message: "Status inválido" });
  } else {
    value.status = data.status;
  }

  for (const campo of ["title", "author"]) {
    const v = textoObrigatorio(data[campo]);
    if (!v) {
      errors.push({ field: campo, message: `O campo ${ROTULOS[campo]} é obrigatório` });
    } else {
      value[campo] = v;
    }
  }

  if (!GENRES.includes(data.genre)) {
    errors.push({ field: "genre", message: "Selecione um gênero válido" });
  } else {
    value.genre = data.genre;
  }

  if (!LITERATURES.includes(data.literature)) {
    errors.push({ field: "literature", message: "Selecione um tipo de literatura válido" });
  } else {
    value.literature = data.literature;
  }

  if (value.status === "lido") {
    const pages = Number(data.pages);
    if (!Number.isInteger(pages) || pages <= 0) {
      errors.push({ field: "pages", message: "Informe a quantidade de páginas (número maior que zero)" });
    } else {
      value.pages = pages;
    }

    if (!FORMATS.includes(data.format)) {
      errors.push({ field: "format", message: "Selecione um formato válido" });
    } else {
      value.format = data.format;
    }

    const inicio = typeof data.start_date === "string" && DATA_ISO.test(data.start_date) ? data.start_date : null;
    const fim = typeof data.end_date === "string" && DATA_ISO.test(data.end_date) ? data.end_date : null;

    if (!inicio) {
      errors.push({ field: "start_date", message: "Informe a data de início da leitura" });
    } else {
      value.start_date = inicio;
    }
    if (!fim) {
      errors.push({ field: "end_date", message: "Informe a data de fim da leitura" });
    } else {
      value.end_date = fim;
    }
    if (inicio && fim && fim < inicio) {
      errors.push({ field: "end_date", message: "A data de fim não pode ser anterior à data de início" });
    }
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, value };
}

module.exports = { GENRES, LITERATURES, FORMATS, STATUSES, validateBook };
```

- [ ] **Step 3: Criar `scratch/check-validation.js`**

```js
const { validateBook } = require("../server/src/validation");

const casos = [
  ["quero_ler válido", { status: "quero_ler", title: "Livro", author: "Autor", genre: "Romance", literature: "brasileira" }, true],
  ["quero_ler sem título", { status: "quero_ler", title: "  ", author: "Autor", genre: "Romance", literature: "brasileira" }, false],
  ["quero_ler gênero inválido", { status: "quero_ler", title: "L", author: "A", genre: "Terror", literature: "brasileira" }, false],
  ["lido válido", { status: "lido", title: "L", author: "A", genre: "Distopia", literature: "estrangeira", pages: 300, format: "ebook", start_date: "2026-01-01", end_date: "2026-01-10" }, true],
  ["lido sem páginas", { status: "lido", title: "L", author: "A", genre: "Distopia", literature: "estrangeira", format: "ebook", start_date: "2026-01-01", end_date: "2026-01-10" }, false],
  ["lido fim antes do início", { status: "lido", title: "L", author: "A", genre: "Distopia", literature: "estrangeira", pages: 10, format: "ebook", start_date: "2026-02-01", end_date: "2026-01-10" }, false],
  ["status inválido", { status: "lendo", title: "L", author: "A", genre: "Distopia", literature: "estrangeira" }, false],
];

let ok = true;
for (const [nome, entrada, esperadoValido] of casos) {
  const r = validateBook(entrada);
  const passou = r.valid === esperadoValido;
  if (!passou) ok = false;
  console.log(`${passou ? "OK " : "FALHOU "} ${nome} -> valid=${r.valid}${r.errors ? " campos=" + r.errors.map((e) => e.field).join(",") : ""}`);
}

const querLer = validateBook({ status: "quero_ler", title: "L", author: "A", genre: "Romance", literature: "brasileira", pages: 999, format: "ebook" });
if (querLer.value.pages !== null || querLer.value.format !== null) {
  ok = false;
  console.log("FALHOU  quero_ler deveria zerar pages/format");
} else {
  console.log("OK  quero_ler zera campos de lido");
}

console.log(ok ? "\nTODOS OS CHECKS PASSARAM" : "\nHOUVE FALHAS");
process.exit(ok ? 0 : 1);
```

- [ ] **Step 4: Rodar a verificação**

Run: `node scratch/check-validation.js`
Expected: `TODOS OS CHECKS PASSARAM` e código de saída 0.

- [ ] **Step 5: Commit**

```bash
git add server/src/validation.js
git commit -m "feat(server): validação de livros com regras por status"
```

---

## Task 4: Servidor — repositório de dados (`books-repo`)

**Files:**
- Create: `server/src/books-repo.js`
- Test (verificação): `scratch/check-repo.js`

**Interfaces:**
- Consumes: `db` de `server/src/db.js`.
- Produces: `server/src/books-repo.js` exporta:
  - `listBooks(filters?: { status?, genre?, format?, literature?, search? })` → `Array<book>` (ordenado por `title`, sem diferenciar maiúsculas)
  - `getBook(id: number)` → `book | undefined`
  - `createBook(value: object)` → `book` (o `value` validado da Task 3; preenche `created_at`/`updated_at`)
  - `updateBook(id: number, value: object)` → `book | undefined` (undefined se o id não existe)
  - `deleteBook(id: number)` → `boolean` (true se removeu)
  - `deleteAllBooks()` → `void`
  - `insertSeed(books: Array<object>)` → `number` (quantidade inserida)
  - `book` = linha da tabela: `{ id, status, title, author, genre, literature, pages, format, start_date, end_date, created_at, updated_at }`

- [ ] **Step 1: Criar `server/src/books-repo.js`**

```js
const db = require("./db");

const COLUNAS = `
  status, title, author, genre, literature,
  pages, format, start_date, end_date,
  created_at, updated_at
`;
const PLACEHOLDERS = `
  @status, @title, @author, @genre, @literature,
  @pages, @format, @start_date, @end_date,
  @created_at, @updated_at
`;

function listBooks(filters = {}) {
  const clauses = [];
  const params = {};

  if (filters.status) {
    clauses.push("status = @status");
    params.status = filters.status;
  }
  if (filters.genre) {
    clauses.push("genre = @genre");
    params.genre = filters.genre;
  }
  if (filters.format) {
    clauses.push("format = @format");
    params.format = filters.format;
  }
  if (filters.literature) {
    clauses.push("literature = @literature");
    params.literature = filters.literature;
  }
  if (filters.search) {
    clauses.push("(LOWER(title) LIKE @busca OR LOWER(author) LIKE @busca)");
    params.busca = `%${String(filters.search).toLowerCase()}%`;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM books ${where} ORDER BY title COLLATE NOCASE`).all(params);
}

function getBook(id) {
  return db.prepare("SELECT * FROM books WHERE id = ?").get(id);
}

function linhaCompleta(value, timestamps) {
  return {
    status: value.status,
    title: value.title,
    author: value.author,
    genre: value.genre,
    literature: value.literature,
    pages: value.pages ?? null,
    format: value.format ?? null,
    start_date: value.start_date ?? null,
    end_date: value.end_date ?? null,
    created_at: timestamps.created_at,
    updated_at: timestamps.updated_at,
  };
}

function createBook(value) {
  const agora = new Date().toISOString();
  const info = db
    .prepare(`INSERT INTO books (${COLUNAS}) VALUES (${PLACEHOLDERS})`)
    .run(linhaCompleta(value, { created_at: agora, updated_at: agora }));
  return getBook(info.lastInsertRowid);
}

function updateBook(id, value) {
  const existente = getBook(id);
  if (!existente) return undefined;
  const agora = new Date().toISOString();
  db.prepare(`
    UPDATE books SET
      status = @status, title = @title, author = @author, genre = @genre,
      literature = @literature, pages = @pages, format = @format,
      start_date = @start_date, end_date = @end_date, updated_at = @updated_at
    WHERE id = @id
  `).run({
    ...linhaCompleta(value, { created_at: existente.created_at, updated_at: agora }),
    id,
  });
  return getBook(id);
}

function deleteBook(id) {
  return db.prepare("DELETE FROM books WHERE id = ?").run(id).changes > 0;
}

function deleteAllBooks() {
  db.prepare("DELETE FROM books").run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name = 'books'").run();
}

function insertSeed(books) {
  const agora = new Date().toISOString();
  const insert = db.prepare(`INSERT INTO books (${COLUNAS}) VALUES (${PLACEHOLDERS})`);
  const tx = db.transaction((lista) => {
    for (const b of lista) {
      insert.run(linhaCompleta(b, { created_at: agora, updated_at: agora }));
    }
  });
  tx(books);
  return books.length;
}

module.exports = {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  deleteAllBooks,
  insertSeed,
};
```

- [ ] **Step 2: Criar `scratch/check-repo.js`**

```js
const repo = require("../server/src/books-repo");

repo.deleteAllBooks();

const criado = repo.createBook({
  status: "lido", title: "Teste", author: "Autora X", genre: "Romance",
  literature: "brasileira", pages: 100, format: "fisico",
  start_date: "2026-01-01", end_date: "2026-01-05",
});
console.log("criado id:", criado.id, "| created_at existe:", Boolean(criado.created_at));

const busca = repo.listBooks({ search: "autora" });
console.log("busca por 'autora' encontrou:", busca.length);

const atualizado = repo.updateBook(criado.id, {
  status: "lido", title: "Teste Editado", author: "Autora X", genre: "Romance",
  literature: "brasileira", pages: 120, format: "ebook",
  start_date: "2026-01-01", end_date: "2026-01-05",
});
console.log("título após update:", atualizado.title, "| formato:", atualizado.format);

console.log("update de id inexistente:", repo.updateBook(999999, {}));
console.log("delete do criado:", repo.deleteBook(criado.id));
console.log("delete de novo (deve ser false):", repo.deleteBook(criado.id));

repo.deleteAllBooks();
const n = repo.insertSeed([
  { status: "quero_ler", title: "A", author: "B", genre: "Distopia", literature: "estrangeira" },
  { status: "quero_ler", title: "C", author: "D", genre: "Romance", literature: "brasileira" },
]);
console.log("insertSeed inseriu:", n, "| total agora:", repo.listBooks().length);
repo.deleteAllBooks();
```

- [ ] **Step 3: Rodar a verificação**

Run: `node scratch/check-repo.js`
Expected (valores exatos):
```
criado id: 1 | created_at existe: true
busca por 'autora' encontrou: 1
título após update: Teste Editado | formato: ebook
update de id inexistente: undefined
delete do criado: true
delete de novo (deve ser false): false
insertSeed inseriu: 2 | total agora: 2
```

- [ ] **Step 4: Commit**

```bash
git add server/src/books-repo.js
git commit -m "feat(server): repositório de dados dos livros"
```

---

## Task 5: Servidor — seed e endpoint de reset

**Files:**
- Create: `server/src/seed.js`
- Create: `server/src/routes/test-reset.js`
- Modify: `server/src/app.js`
- Test (verificação): `curl`

**Interfaces:**
- Consumes: `deleteAllBooks`, `insertSeed`, `listBooks` de `books-repo`.
- Produces:
  - `server/src/seed.js` exporta `{ SEED_BOOKS }` — array de 8 objetos (5 `lido` completos, 3 `quero_ler`).
  - `POST /api/test/reset` → `200 { "ok": true, "inseridos": 8 }`. Sem autenticação.
  - `app.js` passa a montar `app.use("/api/test", testResetRouter)`.

- [ ] **Step 1: Criar `server/src/seed.js`**

```js
const SEED_BOOKS = [
  {
    status: "lido", title: "A Garota no Trem", author: "Paula Hawkins",
    genre: "Thriller Psicológico", literature: "estrangeira",
    pages: 384, format: "fisico", start_date: "2026-01-05", end_date: "2026-01-20",
  },
  {
    status: "lido", title: "1984", author: "George Orwell",
    genre: "Distopia", literature: "estrangeira",
    pages: 416, format: "ebook", start_date: "2026-02-01", end_date: "2026-02-18",
  },
  {
    status: "lido", title: "Torto Arado", author: "Itamar Vieira Junior",
    genre: "Romance", literature: "brasileira",
    pages: 264, format: "fisico", start_date: "2026-03-02", end_date: "2026-03-15",
  },
  {
    status: "lido", title: "People We Meet on Vacation", author: "Emily Henry",
    genre: "Comédia Romântica", literature: "estrangeira",
    pages: 364, format: "audiobook", start_date: "2026-04-01", end_date: "2026-04-10",
  },
  {
    status: "lido", title: "Admirável Mundo Novo", author: "Aldous Huxley",
    genre: "Distopia", literature: "estrangeira",
    pages: 312, format: "ebook", start_date: "2026-05-05", end_date: "2026-05-22",
  },
  {
    status: "quero_ler", title: "O Conto da Aia", author: "Margaret Atwood",
    genre: "Distopia", literature: "estrangeira",
  },
  {
    status: "quero_ler", title: "A Vida Invisível de Eurídice Gusmão", author: "Martha Batalha",
    genre: "Romance", literature: "brasileira",
  },
  {
    status: "quero_ler", title: "Beach Read", author: "Emily Henry",
    genre: "Comédia Romântica", literature: "estrangeira",
  },
];

module.exports = { SEED_BOOKS };
```

- [ ] **Step 2: Criar `server/src/routes/test-reset.js`**

```js
const express = require("express");
const repo = require("../books-repo");
const { SEED_BOOKS } = require("../seed");

const router = express.Router();

router.post("/reset", (req, res) => {
  repo.deleteAllBooks();
  const inseridos = repo.insertSeed(SEED_BOOKS);
  res.json({ ok: true, inseridos });
});

module.exports = router;
```

- [ ] **Step 3: Montar a rota em `server/src/app.js`**

Substituir o comentário `// As rotas são montadas nas próximas tarefas.` por:

```js
const testResetRouter = require("./routes/test-reset");

app.use("/api/test", testResetRouter);
```

(O `require` fica no topo do arquivo junto aos outros; a linha `app.use` fica após `app.use(express.json())`.)

- [ ] **Step 4: Subir o servidor**

Run: `npm run dev -w server`
(deixar rodando para os próximos steps; usar outro terminal)

- [ ] **Step 5: Verificar o reset**

Run: `curl -s -X POST http://localhost:3001/api/test/reset`
Expected: `{"ok":true,"inseridos":8}`

- [ ] **Step 6: Verificar o conteúdo semeado**

Run: `node -e "const r=require('./server/src/books-repo'); const t=r.listBooks(); console.log('total',t.length); console.log('lidos',t.filter(b=>b.status==='lido').length); console.log('quero_ler',t.filter(b=>b.status==='quero_ler').length)"`
Expected:
```
total 8
lidos 5
quero_ler 3
```

- [ ] **Step 7: Commit**

```bash
git add server/src/seed.js server/src/routes/test-reset.js server/src/app.js
git commit -m "feat(server): seed fixo e endpoint POST /api/test/reset"
```

---

## Task 6: Servidor — autenticação (login + middleware)

**Files:**
- Create: `server/src/middleware/auth.js`
- Create: `server/src/routes/login.js`
- Modify: `server/src/app.js`
- Test (verificação): `curl`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `server/src/middleware/auth.js` exporta `{ TOKEN: "token-de-teste-123", requireAuth }`. `requireAuth(req, res, next)` responde `401 { "error": "Não autorizado" }` se o header `Authorization` não for exatamente `Bearer token-de-teste-123`.
  - `POST /api/login` body `{ username, password }` → `200 { "token": "token-de-teste-123" }` para `admin`/`admin123`, senão `401 { "error": "Usuário ou senha inválidos" }`.
  - `app.js` monta `app.use("/api/login", loginRouter)`.

- [ ] **Step 1: Criar `server/src/middleware/auth.js`**

```js
const TOKEN = "token-de-teste-123";

function requireAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const [esquema, valor] = header.split(" ");
  if (esquema !== "Bearer" || valor !== TOKEN) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

module.exports = { TOKEN, requireAuth };
```

- [ ] **Step 2: Criar `server/src/routes/login.js`**

```js
const express = require("express");
const { TOKEN } = require("../middleware/auth");

const CREDENCIAIS = { username: "admin", password: "admin123" };
const router = express.Router();

router.post("/", (req, res) => {
  const { username, password } = req.body || {};
  if (username === CREDENCIAIS.username && password === CREDENCIAIS.password) {
    return res.json({ token: TOKEN });
  }
  res.status(401).json({ error: "Usuário ou senha inválidos" });
});

module.exports = router;
```

- [ ] **Step 3: Montar a rota em `server/src/app.js`**

Adicionar o `require` no topo e a linha `app.use` junto às outras rotas:

```js
const loginRouter = require("./routes/login");

app.use("/api/login", loginRouter);
```

- [ ] **Step 4: Subir o servidor e verificar login correto**

Run: `curl -s -X POST http://localhost:3001/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'`
Expected: `{"token":"token-de-teste-123"}`

- [ ] **Step 5: Verificar login incorreto**

Run: `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"errada"}'`
Expected: `401`

- [ ] **Step 6: Commit**

```bash
git add server/src/middleware/auth.js server/src/routes/login.js server/src/app.js
git commit -m "feat(server): login com credenciais fixas e middleware de token"
```

---

## Task 7: Servidor — rotas de livros (CRUD)

**Files:**
- Create: `server/src/routes/books.js`
- Modify: `server/src/app.js`
- Test (verificação): `curl`

**Interfaces:**
- Consumes: `repo` de `books-repo`, `validateBook` de `validation`, `requireAuth` de `middleware/auth`.
- Produces (todas exigem `Authorization: Bearer token-de-teste-123`):
  - `GET /api/books` — query opcional `status, genre, format, literature, search` → `200 Array<book>`
  - `GET /api/books/:id` → `200 book` ou `404 { error }`
  - `POST /api/books` → `201 book` ou `400 { error, errors }`
  - `PUT /api/books/:id` → `200 book`, `400 { error, errors }` ou `404 { error }`
  - `DELETE /api/books/:id` → `204` (sem corpo) ou `404 { error }`
  - `app.js` monta `app.use("/api/books", requireAuth, booksRouter)`.

- [ ] **Step 1: Criar `server/src/routes/books.js`**

```js
const express = require("express");
const repo = require("../books-repo");
const { validateBook } = require("../validation");

const router = express.Router();

router.get("/", (req, res) => {
  const { status, genre, format, literature, search } = req.query;
  res.json(repo.listBooks({ status, genre, format, literature, search }));
});

router.get("/:id", (req, res) => {
  const livro = repo.getBook(Number(req.params.id));
  if (!livro) return res.status(404).json({ error: "Livro não encontrado" });
  res.json(livro);
});

router.post("/", (req, res) => {
  const resultado = validateBook(req.body);
  if (!resultado.valid) {
    return res.status(400).json({ error: resultado.errors[0].message, errors: resultado.errors });
  }
  res.status(201).json(repo.createBook(resultado.value));
});

router.put("/:id", (req, res) => {
  const resultado = validateBook(req.body);
  if (!resultado.valid) {
    return res.status(400).json({ error: resultado.errors[0].message, errors: resultado.errors });
  }
  const atualizado = repo.updateBook(Number(req.params.id), resultado.value);
  if (!atualizado) return res.status(404).json({ error: "Livro não encontrado" });
  res.json(atualizado);
});

router.delete("/:id", (req, res) => {
  const removido = repo.deleteBook(Number(req.params.id));
  if (!removido) return res.status(404).json({ error: "Livro não encontrado" });
  res.status(204).end();
});

module.exports = router;
```

- [ ] **Step 2: Montar a rota em `server/src/app.js`**

```js
const { requireAuth } = require("./middleware/auth");
const booksRouter = require("./routes/books");

app.use("/api/books", requireAuth, booksRouter);
```

- [ ] **Step 3: Subir o servidor, resetar e definir um atalho de shell**

```bash
curl -s -X POST http://localhost:3001/api/test/reset
export H='-H Authorization:Bearer token-de-teste-123 -H Content-Type:application/json'
```

- [ ] **Step 4: Verificar listagem sem token**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/books`
Expected: `401`

- [ ] **Step 5: Verificar listagem com token e filtro**

Run: `curl -s $H "http://localhost:3001/api/books?status=lido&genre=Distopia" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).length))"`
Expected: `2`

- [ ] **Step 6: Verificar criação inválida**

Run: `curl -s -w "\n%{http_code}" $H -X POST http://localhost:3001/api/books -d '{"status":"quero_ler","title":"","author":"X","genre":"Romance","literature":"brasileira"}'`
Expected: corpo com `"errors"` contendo `"field":"title"`, e na última linha `400`.

- [ ] **Step 7: Verificar criação válida + exclusão**

```bash
curl -s $H -X POST http://localhost:3001/api/books -d '{"status":"quero_ler","title":"Novo","author":"X","genre":"Romance","literature":"brasileira"}'
# anotar o "id" retornado, e então:
curl -s -o /dev/null -w "%{http_code}" $H -X DELETE http://localhost:3001/api/books/<id>
```
Expected: POST retorna `201` com o livro; DELETE retorna `204`.

- [ ] **Step 8: Verificar mover "quero ler" → "lido" via PUT**

```bash
# criar em quero_ler, anotar id, e mover:
curl -s $H -X PUT http://localhost:3001/api/books/<id> -d '{"status":"lido","title":"Novo","author":"X","genre":"Romance","literature":"brasileira","pages":200,"format":"ebook","start_date":"2026-06-01","end_date":"2026-06-10"}'
```
Expected: `200` com o livro atualizado, `status: "lido"` e `pages: 200`.

- [ ] **Step 9: Commit**

```bash
git add server/src/routes/books.js server/src/app.js
git commit -m "feat(server): CRUD de /api/books com validação e autenticação"
```

---

## Task 8: Servidor — estatísticas

**Files:**
- Create: `server/src/routes/stats.js`
- Modify: `server/src/app.js`
- Test (verificação): `curl`

**Interfaces:**
- Consumes: `repo.listBooks` de `books-repo`, `requireAuth` de `middleware/auth`.
- Produces:
  - `GET /api/stats` (exige token) → `200 { totalLidos, totalQueroLer, totalPaginasLidas, porGenero: {}, porFormato: {}, porLiteratura: {} }`. As contagens `porGenero/porFormato/porLiteratura` consideram só livros `lido`.
  - `app.js` monta `app.use("/api/stats", requireAuth, statsRouter)`.

- [ ] **Step 1: Criar `server/src/routes/stats.js`**

```js
const express = require("express");
const repo = require("../books-repo");

const router = express.Router();

router.get("/", (req, res) => {
  const todos = repo.listBooks();
  const lidos = todos.filter((b) => b.status === "lido");
  const queroLer = todos.filter((b) => b.status === "quero_ler");

  const contarPor = (campo) => {
    const acc = {};
    for (const livro of lidos) {
      const chave = livro[campo];
      acc[chave] = (acc[chave] || 0) + 1;
    }
    return acc;
  };

  res.json({
    totalLidos: lidos.length,
    totalQueroLer: queroLer.length,
    totalPaginasLidas: lidos.reduce((soma, b) => soma + (b.pages || 0), 0),
    porGenero: contarPor("genre"),
    porFormato: contarPor("format"),
    porLiteratura: contarPor("literature"),
  });
});

module.exports = router;
```

- [ ] **Step 2: Montar a rota em `server/src/app.js`**

```js
const statsRouter = require("./routes/stats");

app.use("/api/stats", requireAuth, statsRouter);
```

- [ ] **Step 3: Subir o servidor, resetar e verificar**

```bash
curl -s -X POST http://localhost:3001/api/test/reset
curl -s -H "Authorization: Bearer token-de-teste-123" http://localhost:3001/api/stats
```
Expected (com o seed):
```json
{"totalLidos":5,"totalQueroLer":3,"totalPaginasLidas":1740,"porGenero":{"Thriller Psicológico":1,"Distopia":2,"Romance":1,"Comédia Romântica":1},"porFormato":{"fisico":2,"ebook":2,"audiobook":1},"porLiteratura":{"estrangeira":4,"brasileira":1}}
```
(A ordem das chaves pode variar; os valores não.)

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/stats.js server/src/app.js
git commit -m "feat(server): endpoint GET /api/stats"
```

---

## Task 9: Servidor — 404 e handler de erro, revisão do `app.js`

**Files:**
- Modify: `server/src/app.js`
- Test (verificação): `curl`

**Interfaces:**
- Consumes: tudo já montado nas Tasks 5–8.
- Produces: `app.js` finalizado — depois de todas as rotas, um 404 JSON e um handler de erro de 4 argumentos que responde `500 { "error": "Erro interno" }`.

- [ ] **Step 1: Revisar `server/src/app.js` — deve ficar exatamente assim**

```js
const express = require("express");
const cors = require("cors");
const { requireAuth } = require("./middleware/auth");
const loginRouter = require("./routes/login");
const booksRouter = require("./routes/books");
const statsRouter = require("./routes/stats");
const testResetRouter = require("./routes/test-reset");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/login", loginRouter);
app.use("/api/test", testResetRouter);
app.use("/api/books", requireAuth, booksRouter);
app.use("/api/stats", requireAuth, statsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});

module.exports = app;
```

- [ ] **Step 2: Verificar 404 em JSON**

Run: `curl -s http://localhost:3001/api/nao-existe`
Expected: `{"error":"Rota não encontrada"}`

- [ ] **Step 3: Verificar que o fluxo completo ainda funciona**

```bash
curl -s -X POST http://localhost:3001/api/test/reset
curl -s -H "Authorization: Bearer token-de-teste-123" "http://localhost:3001/api/books?status=quero_ler" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).length))"
```
Expected: última linha `3`.

- [ ] **Step 4: Commit**

```bash
git add server/src/app.js
git commit -m "feat(server): 404 e handler de erro em JSON"
```

---

## Task 10: Cliente — scaffold do front (Vite + React + rotas)

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/src/main.jsx`
- Create: `client/src/styles.css`
- Create: `client/src/config.js`
- Create: `client/src/App.jsx`
- Create: `client/src/auth/RotaProtegida.jsx`
- Create: `client/src/auth/tokenStorage.js`
- Create: `client/src/pages/Login.jsx` (stub)
- Create: `client/src/pages/ListaLivros.jsx` (stub)
- Create: `client/src/pages/Estatisticas.jsx` (stub)

**Interfaces:**
- Consumes: `/api` (via proxy do Vite para `localhost:3001`).
- Produces:
  - `client/src/config.js` exporta `GENEROS: string[]`, `LITERATURAS: [{ valor, rotulo }]`, `FORMATOS: [{ valor, rotulo }]`.
  - `client/src/auth/tokenStorage.js` exporta `getToken()`, `setToken(token)`, `clearToken()`.
  - `client/src/auth/RotaProtegida.jsx` — default export; renderiza `children` se houver token, senão `<Navigate to="/login" replace />`.
  - Rotas: `/login`, `/` (protegida), `/estatisticas` (protegida), `*` → `/`.
  - Páginas stub exportam default um componente que renderiza um `<div>` com o nome da página.

- [ ] **Step 1: Criar `client/package.json`**

```json
{
  "name": "rastreador-de-leitura-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Instalar dependências**

Run (na raiz): `npm install`
Expected: sem erros.

- [ ] **Step 3: Criar `client/vite.config.js`**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
```

- [ ] **Step 4: Criar `client/index.html`**

```html
<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rastreador de Leitura</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Criar `client/src/main.jsx`**

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 6: Criar `client/src/styles.css`**

```css
:root {
  --cor-fundo: #f4f4f5;
  --cor-cartao: #ffffff;
  --cor-borda: #d4d4d8;
  --cor-texto: #18181b;
  --cor-primaria: #2563eb;
  --cor-perigo: #dc2626;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: var(--cor-fundo);
  color: var(--cor-texto);
}

a {
  color: var(--cor-primaria);
  text-decoration: none;
}

button {
  font: inherit;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  background: var(--cor-cartao);
  cursor: pointer;
}

button:hover {
  border-color: var(--cor-primaria);
}

button.perigo {
  color: var(--cor-perigo);
  border-color: var(--cor-perigo);
}

button.ativa {
  background: var(--cor-primaria);
  color: #fff;
  border-color: var(--cor-primaria);
}

input,
select {
  font: inherit;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  width: 100%;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--cor-cartao);
  border-bottom: 1px solid var(--cor-borda);
}

.cabecalho .logo {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--cor-texto);
}

.cabecalho nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.conteudo {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.tela-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.cartao {
  background: var(--cor-cartao);
  border: 1px solid var(--cor-borda);
  border-radius: 10px;
  padding: 1.25rem;
}

.tela-login .cartao {
  width: 320px;
}

.abas {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.barra-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.filtros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  flex: 1;
}

.lista-livros {
  display: grid;
  gap: 1rem;
}

.card-livro {
  background: var(--cor-cartao);
  border: 1px solid var(--cor-borda);
  border-radius: 10px;
  padding: 1rem;
}

.card-livro h3 {
  margin: 0 0 0.25rem;
}

.card-livro .autor {
  margin: 0 0 0.5rem;
  color: #52525b;
}

.card-livro .detalhes {
  margin: 0 0 0.75rem;
  padding-left: 1.1rem;
  font-size: 0.9rem;
}

.card-livro .acoes,
.formulario .acoes,
.cartao .acoes {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.erro {
  color: var(--cor-perigo);
  font-size: 0.85rem;
  margin: 0.25rem 0;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.overlay .cartao {
  width: 420px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.grade-estatisticas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.grade-estatisticas .numero {
  font-size: 2rem;
  font-weight: 700;
  margin: 0.25rem 0 0;
}
```

- [ ] **Step 7: Criar `client/src/config.js`**

```js
export const GENEROS = [
  "Thriller Psicológico",
  "Comédia Romântica",
  "Distopia",
  "Romance",
];

export const LITERATURAS = [
  { valor: "estrangeira", rotulo: "Estrangeira" },
  { valor: "brasileira", rotulo: "Brasileira" },
];

export const FORMATOS = [
  { valor: "fisico", rotulo: "Físico" },
  { valor: "ebook", rotulo: "E-book" },
  { valor: "audiobook", rotulo: "Audiobook" },
];
```

- [ ] **Step 8: Criar `client/src/auth/tokenStorage.js`**

```js
const CHAVE = "token";

export function getToken() {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(CHAVE, token);
  } catch {
    // storage indisponível (modo privado) — ignora
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // ignora
  }
}
```

- [ ] **Step 9: Criar `client/src/auth/RotaProtegida.jsx`**

```jsx
import { Navigate } from "react-router-dom";
import { getToken } from "./tokenStorage.js";

export default function RotaProtegida({ children }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
```

- [ ] **Step 10: Criar as três páginas stub**

`client/src/pages/Login.jsx`:
```jsx
export default function Login() {
  return <div data-testid="pagina-login">Login</div>;
}
```

`client/src/pages/ListaLivros.jsx`:
```jsx
export default function ListaLivros() {
  return <div data-testid="pagina-lista">Lista de livros</div>;
}
```

`client/src/pages/Estatisticas.jsx`:
```jsx
export default function Estatisticas() {
  return <div data-testid="pagina-estatisticas">Estatísticas</div>;
}
```

- [ ] **Step 11: Criar `client/src/App.jsx`**

```jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import ListaLivros from "./pages/ListaLivros.jsx";
import Estatisticas from "./pages/Estatisticas.jsx";
import RotaProtegida from "./auth/RotaProtegida.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RotaProtegida>
            <ListaLivros />
          </RotaProtegida>
        }
      />
      <Route
        path="/estatisticas"
        element={
          <RotaProtegida>
            <Estatisticas />
          </RotaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 12: Verificar o build**

Run: `npm run build -w client`
Expected: `built in ...` sem erros.

- [ ] **Step 13: Verificar no navegador**

Run: `npm run dev` (na raiz — sobe server + client)
Abrir `http://localhost:5173`.
Expected: redireciona para `/login` e mostra "Login" (sem token no localStorage). Ao rodar `localStorage.setItem("token","x")` no console e abrir `/`, mostra "Lista de livros".

- [ ] **Step 14: Commit**

```bash
git add client/ package-lock.json
git commit -m "feat(client): scaffold do front com Vite, rotas e proteção de rota"
```

---

## Task 11: Cliente — camada HTTP e API de login

**Files:**
- Create: `client/src/api/http.js`
- Create: `client/src/api/auth.js`

**Interfaces:**
- Consumes: `getToken` de `auth/tokenStorage.js`.
- Produces:
  - `client/src/api/http.js` exporta `request(method, path, body?)` e os atalhos `get(path)`, `post(path, body)`, `put(path, body)`, `del(path)`. Injeta `Authorization: Bearer <token>` quando há token. Em resposta não-2xx, lança `Error` com `.message` (do campo `error`), `.status` e `.errors` (array). Em `204`, resolve `null`.
  - `client/src/api/auth.js` exporta `login(username, password)` → `Promise<{ token }>`.

- [ ] **Step 1: Criar `client/src/api/http.js`**

```js
import { getToken } from "../auth/tokenStorage.js";

export async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (resposta.status === 204) return null;

  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    const erro = new Error((dados && dados.error) || "Erro na requisição");
    erro.status = resposta.status;
    erro.errors = (dados && dados.errors) || [];
    throw erro;
  }

  return dados;
}

export const get = (path) => request("GET", path);
export const post = (path, body) => request("POST", path, body);
export const put = (path, body) => request("PUT", path, body);
export const del = (path) => request("DELETE", path);
```

- [ ] **Step 2: Criar `client/src/api/auth.js`**

```js
import { post } from "./http.js";

export function login(username, password) {
  return post("/api/login", { username, password });
}
```

- [ ] **Step 3: Verificar o build**

Run: `npm run build -w client`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add client/src/api/http.js client/src/api/auth.js
git commit -m "feat(client): camada HTTP com token e API de login"
```

---

## Task 12: Cliente — página de Login

**Files:**
- Modify: `client/src/pages/Login.jsx` (substitui o stub)

**Interfaces:**
- Consumes: `login` de `api/auth.js`, `setToken` de `auth/tokenStorage.js`, `useNavigate` do React Router.
- Produces: página `/login` funcional. `data-testid`: `form-login`, `input-usuario`, `input-senha`, `botao-entrar`, `mensagem-erro-login`.

- [ ] **Step 1: Substituir `client/src/pages/Login.jsx`**

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth.js";
import { setToken } from "../auth/tokenStorage.js";

export default function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const { token } = await login(usuario, senha);
      setToken(token);
      navigate("/");
    } catch (e) {
      setErro(e.message || "Não foi possível entrar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="tela-login">
      <form className="cartao" onSubmit={aoEnviar} data-testid="form-login">
        <h1>Rastreador de Leitura</h1>
        <label>
          Usuário
          <input
            data-testid="input-usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            data-testid="input-senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {erro && (
          <p className="erro" data-testid="mensagem-erro-login">
            {erro}
          </p>
        )}
        <button type="submit" data-testid="botao-entrar" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Verificar no navegador — login incorreto**

`npm run dev` na raiz. Em `http://localhost:5173/login`, entrar com `admin` / `errada`.
Expected: aparece "Usuário ou senha inválidos" em `mensagem-erro-login`; continua em `/login`.

- [ ] **Step 3: Verificar no navegador — login correto**

Entrar com `admin` / `admin123`.
Expected: navega para `/` (mostra o stub "Lista de livros"); `localStorage.getItem("token")` === `"token-de-teste-123"`.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Login.jsx
git commit -m "feat(client): página de login"
```

---

## Task 13: Cliente — API de livros e estatísticas

**Files:**
- Create: `client/src/api/livros.js`
- Create: `client/src/api/stats.js`

**Interfaces:**
- Consumes: `get, post, put, del` de `api/http.js`.
- Produces:
  - `client/src/api/livros.js` exporta `listarLivros(filtros?)`, `obterLivro(id)`, `criarLivro(dados)`, `atualizarLivro(id, dados)`, `excluirLivro(id)`. `listarLivros` monta a query string ignorando valores vazios/undefined/null.
  - `client/src/api/stats.js` exporta `obterEstatisticas()`.

- [ ] **Step 1: Criar `client/src/api/livros.js`**

```js
import { get, post, put, del } from "./http.js";

function querystring(filtros = {}) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      params.set(chave, valor);
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function listarLivros(filtros) {
  return get(`/api/books${querystring(filtros)}`);
}

export function obterLivro(id) {
  return get(`/api/books/${id}`);
}

export function criarLivro(dados) {
  return post("/api/books", dados);
}

export function atualizarLivro(id, dados) {
  return put(`/api/books/${id}`, dados);
}

export function excluirLivro(id) {
  return del(`/api/books/${id}`);
}
```

- [ ] **Step 2: Criar `client/src/api/stats.js`**

```js
import { get } from "./http.js";

export function obterEstatisticas() {
  return get("/api/stats");
}
```

- [ ] **Step 3: Verificar o build**

Run: `npm run build -w client`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add client/src/api/livros.js client/src/api/stats.js
git commit -m "feat(client): API de livros e estatísticas"
```

---

## Task 14: Cliente — componente Cabeçalho

**Files:**
- Create: `client/src/components/Cabecalho.jsx`

**Interfaces:**
- Consumes: `clearToken` de `auth/tokenStorage.js`, `Link`/`useNavigate` do React Router.
- Produces: default export `Cabecalho` (sem props). `data-testid`: `link-inicio`, `link-estatisticas`, `botao-sair`. "Sair" limpa o token e navega para `/login`.

- [ ] **Step 1: Criar `client/src/components/Cabecalho.jsx`**

```jsx
import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../auth/tokenStorage.js";

export default function Cabecalho() {
  const navigate = useNavigate();

  function sair() {
    clearToken();
    navigate("/login");
  }

  return (
    <header className="cabecalho">
      <Link to="/" className="logo" data-testid="link-inicio">
        Rastreador de Leitura
      </Link>
      <nav>
        <Link to="/estatisticas" data-testid="link-estatisticas">
          Estatísticas
        </Link>
        <button type="button" onClick={sair} data-testid="botao-sair">
          Sair
        </button>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Verificar o build**

Run: `npm run build -w client`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/Cabecalho.jsx
git commit -m "feat(client): componente de cabeçalho com logout"
```

---

## Task 15: Cliente — componente CardLivro

**Files:**
- Create: `client/src/components/CardLivro.jsx`

**Interfaces:**
- Consumes: `FORMATOS`, `LITERATURAS` de `config.js`.
- Produces: default export `CardLivro`, props `{ livro, aoEditar, aoExcluir, aoMarcarLido }`. Cada callback recebe o objeto `livro`. Mostra os campos de "lido" só quando `livro.status === "lido"`. O botão "Marcar como lido" só aparece quando `livro.status === "quero_ler"`. Datas exibidas como `DD/MM/AAAA`. `data-testid`: `card-livro-<id>`, `botao-editar-<id>`, `botao-excluir-<id>`, `botao-marcar-lido-<id>`.

- [ ] **Step 1: Criar `client/src/components/CardLivro.jsx`**

```jsx
import { FORMATOS, LITERATURAS } from "../config.js";

function rotulo(lista, valor) {
  const item = lista.find((i) => i.valor === valor);
  return item ? item.rotulo : valor;
}

function formatarData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function CardLivro({ livro, aoEditar, aoExcluir, aoMarcarLido }) {
  return (
    <article className="card-livro" data-testid={`card-livro-${livro.id}`}>
      <h3>{livro.title}</h3>
      <p className="autor">{livro.author}</p>
      <ul className="detalhes">
        <li>Gênero: {livro.genre}</li>
        <li>Literatura: {rotulo(LITERATURAS, livro.literature)}</li>
        {livro.status === "lido" && (
          <>
            <li>Páginas: {livro.pages}</li>
            <li>Formato: {rotulo(FORMATOS, livro.format)}</li>
            <li>
              Leitura: {formatarData(livro.start_date)} até {formatarData(livro.end_date)}
            </li>
          </>
        )}
      </ul>
      <div className="acoes">
        <button
          type="button"
          onClick={() => aoEditar(livro)}
          data-testid={`botao-editar-${livro.id}`}
        >
          Editar
        </button>
        {livro.status === "quero_ler" && (
          <button
            type="button"
            onClick={() => aoMarcarLido(livro)}
            data-testid={`botao-marcar-lido-${livro.id}`}
          >
            Marcar como lido
          </button>
        )}
        <button
          type="button"
          className="perigo"
          onClick={() => aoExcluir(livro)}
          data-testid={`botao-excluir-${livro.id}`}
        >
          Excluir
        </button>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Verificar o build**

Run: `npm run build -w client`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/CardLivro.jsx
git commit -m "feat(client): componente de card de livro"
```

---

## Task 16: Cliente — componente Filtros

**Files:**
- Create: `client/src/components/Filtros.jsx`

**Interfaces:**
- Consumes: `GENEROS`, `FORMATOS`, `LITERATURAS` de `config.js`.
- Produces: default export `Filtros`, props `{ valores, aoAlterar }`. `valores` = `{ search, genre, format, literature }` (strings; `""` = sem filtro). `aoAlterar` recebe o objeto `valores` completo já atualizado. `data-testid`: `filtros`, `input-busca`, `select-genero`, `select-formato`, `select-literatura`.

- [ ] **Step 1: Criar `client/src/components/Filtros.jsx`**

```jsx
import { GENEROS, FORMATOS, LITERATURAS } from "../config.js";

export default function Filtros({ valores, aoAlterar }) {
  function alterar(campo, valor) {
    aoAlterar({ ...valores, [campo]: valor });
  }

  return (
    <div className="filtros" data-testid="filtros">
      <input
        placeholder="Buscar por título ou autor"
        value={valores.search}
        onChange={(e) => alterar("search", e.target.value)}
        data-testid="input-busca"
      />
      <select
        value={valores.genre}
        onChange={(e) => alterar("genre", e.target.value)}
        data-testid="select-genero"
      >
        <option value="">Todos os gêneros</option>
        {GENEROS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <select
        value={valores.format}
        onChange={(e) => alterar("format", e.target.value)}
        data-testid="select-formato"
      >
        <option value="">Todos os formatos</option>
        {FORMATOS.map((f) => (
          <option key={f.valor} value={f.valor}>
            {f.rotulo}
          </option>
        ))}
      </select>
      <select
        value={valores.literature}
        onChange={(e) => alterar("literature", e.target.value)}
        data-testid="select-literatura"
      >
        <option value="">Toda literatura</option>
        {LITERATURAS.map((l) => (
          <option key={l.valor} value={l.valor}>
            {l.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Verificar o build**

Run: `npm run build -w client`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/Filtros.jsx
git commit -m "feat(client): componente de filtros da lista"
```

---

## Task 17: Cliente — componente FormularioLivro

**Files:**
- Create: `client/src/components/FormularioLivro.jsx`

**Interfaces:**
- Consumes: `GENEROS`, `FORMATOS`, `LITERATURAS` de `config.js`.
- Produces: default export `FormularioLivro`, props `{ livroInicial, statusFixo, aoSalvar, aoCancelar }`.
  - `livroInicial`: objeto livro (edição) ou `null`/`undefined` (novo).
  - `statusFixo`: `"lido"` força o status e esconde o seletor de status (usado no "marcar como lido"); ausente = usuária escolhe.
  - `aoSalvar(payload)`: recebe `{ status, title, author, genre, literature }` e, se `status === "lido"`, também `{ pages: number, format, start_date, end_date }`. Deve ser `async` e **lançar** o `Error` da API em caso de falha (o formulário captura `.errors` e mostra por campo).
  - `aoCancelar()`: fecha sem salvar.
  - `data-testid`: `overlay-formulario`, `form-livro`, `select-status`, `input-titulo`, `input-autor`, `select-genero-form`, `select-literatura-form`, `input-paginas`, `select-formato-form`, `input-data-inicio`, `input-data-fim`, `botao-salvar-livro`, `botao-cancelar-livro`, `erro-formulario`.

- [ ] **Step 1: Criar `client/src/components/FormularioLivro.jsx`**

```jsx
import { useState } from "react";
import { GENEROS, FORMATOS, LITERATURAS } from "../config.js";

const VAZIO = {
  status: "quero_ler",
  title: "",
  author: "",
  genre: "",
  literature: "",
  pages: "",
  format: "",
  start_date: "",
  end_date: "",
};

export default function FormularioLivro({ livroInicial, statusFixo, aoSalvar, aoCancelar }) {
  const [dados, setDados] = useState(() => {
    const base = { ...VAZIO, ...(livroInicial || {}) };
    for (const chave of Object.keys(VAZIO)) {
      if (base[chave] === null || base[chave] === undefined) base[chave] = VAZIO[chave];
    }
    if (statusFixo) base.status = statusFixo;
    return base;
  });
  const [errosPorCampo, setErrosPorCampo] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);

  const ehLido = dados.status === "lido";
  const ehEdicao = Boolean(livroInicial && livroInicial.id);

  function alterar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErrosPorCampo({});
    setErroGeral("");
    setEnviando(true);

    const payload = {
      status: dados.status,
      title: dados.title,
      author: dados.author,
      genre: dados.genre,
      literature: dados.literature,
    };
    if (dados.status === "lido") {
      payload.pages = dados.pages === "" ? null : Number(dados.pages);
      payload.format = dados.format;
      payload.start_date = dados.start_date;
      payload.end_date = dados.end_date;
    }

    try {
      await aoSalvar(payload);
    } catch (e) {
      if (e.errors && e.errors.length > 0) {
        const mapa = {};
        for (const item of e.errors) mapa[item.field] = item.message;
        setErrosPorCampo(mapa);
      }
      setErroGeral(e.message || "Não foi possível salvar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="overlay" data-testid="overlay-formulario">
      <form className="cartao formulario" onSubmit={enviar} data-testid="form-livro">
        <h2>{ehEdicao ? "Editar livro" : "Novo livro"}</h2>

        {!statusFixo && (
          <label>
            Status
            <select
              value={dados.status}
              onChange={(e) => alterar("status", e.target.value)}
              data-testid="select-status"
            >
              <option value="quero_ler">Quero ler</option>
              <option value="lido">Lido</option>
            </select>
          </label>
        )}

        <label>
          Título
          <input
            value={dados.title}
            onChange={(e) => alterar("title", e.target.value)}
            data-testid="input-titulo"
          />
        </label>
        {errosPorCampo.title && <p className="erro">{errosPorCampo.title}</p>}

        <label>
          Autor
          <input
            value={dados.author}
            onChange={(e) => alterar("author", e.target.value)}
            data-testid="input-autor"
          />
        </label>
        {errosPorCampo.author && <p className="erro">{errosPorCampo.author}</p>}

        <label>
          Gênero
          <select
            value={dados.genre}
            onChange={(e) => alterar("genre", e.target.value)}
            data-testid="select-genero-form"
          >
            <option value="">Selecione</option>
            {GENEROS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        {errosPorCampo.genre && <p className="erro">{errosPorCampo.genre}</p>}

        <label>
          Literatura
          <select
            value={dados.literature}
            onChange={(e) => alterar("literature", e.target.value)}
            data-testid="select-literatura-form"
          >
            <option value="">Selecione</option>
            {LITERATURAS.map((l) => (
              <option key={l.valor} value={l.valor}>
                {l.rotulo}
              </option>
            ))}
          </select>
        </label>
        {errosPorCampo.literature && <p className="erro">{errosPorCampo.literature}</p>}

        {ehLido && (
          <>
            <label>
              Páginas
              <input
                type="number"
                min="1"
                value={dados.pages}
                onChange={(e) => alterar("pages", e.target.value)}
                data-testid="input-paginas"
              />
            </label>
            {errosPorCampo.pages && <p className="erro">{errosPorCampo.pages}</p>}

            <label>
              Formato
              <select
                value={dados.format}
                onChange={(e) => alterar("format", e.target.value)}
                data-testid="select-formato-form"
              >
                <option value="">Selecione</option>
                {FORMATOS.map((f) => (
                  <option key={f.valor} value={f.valor}>
                    {f.rotulo}
                  </option>
                ))}
              </select>
            </label>
            {errosPorCampo.format && <p className="erro">{errosPorCampo.format}</p>}

            <label>
              Início da leitura
              <input
                type="date"
                value={dados.start_date}
                onChange={(e) => alterar("start_date", e.target.value)}
                data-testid="input-data-inicio"
              />
            </label>
            {errosPorCampo.start_date && <p className="erro">{errosPorCampo.start_date}</p>}

            <label>
              Fim da leitura
              <input
                type="date"
                value={dados.end_date}
                onChange={(e) => alterar("end_date", e.target.value)}
                data-testid="input-data-fim"
              />
            </label>
            {errosPorCampo.end_date && <p className="erro">{errosPorCampo.end_date}</p>}
          </>
        )}

        {erroGeral && (
          <p className="erro" data-testid="erro-formulario">
            {erroGeral}
          </p>
        )}

        <div className="acoes">
          <button type="submit" data-testid="botao-salvar-livro" disabled={enviando}>
            {enviando ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" onClick={aoCancelar} data-testid="botao-cancelar-livro">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verificar o build**

Run: `npm run build -w client`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/FormularioLivro.jsx
git commit -m "feat(client): formulário de livro (novo/editar/marcar como lido)"
```

---

## Task 18: Cliente — componente ModalConfirmacao

**Files:**
- Create: `client/src/components/ModalConfirmacao.jsx`

**Interfaces:**
- Consumes: nada.
- Produces: default export `ModalConfirmacao`, props `{ mensagem, aoConfirmar, aoCancelar }`. `data-testid`: `modal-confirmacao`, `botao-confirmar-exclusao`, `botao-cancelar-exclusao`.

- [ ] **Step 1: Criar `client/src/components/ModalConfirmacao.jsx`**

```jsx
export default function ModalConfirmacao({ mensagem, aoConfirmar, aoCancelar }) {
  return (
    <div className="overlay" data-testid="modal-confirmacao">
      <div className="cartao">
        <p>{mensagem}</p>
        <div className="acoes">
          <button
            type="button"
            className="perigo"
            onClick={aoConfirmar}
            data-testid="botao-confirmar-exclusao"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={aoCancelar}
            data-testid="botao-cancelar-exclusao"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar o build**

Run: `npm run build -w client`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ModalConfirmacao.jsx
git commit -m "feat(client): modal de confirmação"
```

---

## Task 19: Cliente — página ListaLivros (completa)

**Files:**
- Modify: `client/src/pages/ListaLivros.jsx` (substitui o stub)

**Interfaces:**
- Consumes: `Cabecalho`, `Filtros`, `CardLivro`, `FormularioLivro`, `ModalConfirmacao`; `listarLivros`, `criarLivro`, `atualizarLivro`, `excluirLivro` de `api/livros.js`.
- Produces: página `/` completa — abas Lido / Quero ler, filtros, listagem, adicionar, editar, marcar como lido, excluir com confirmação. `data-testid`: `aba-lido`, `aba-quero-ler`, `botao-adicionar-livro`, `lista-livros`, `lista-vazia`, `carregando`, `erro-lista`.

- [ ] **Step 1: Substituir `client/src/pages/ListaLivros.jsx`**

```jsx
import { useCallback, useEffect, useState } from "react";
import Cabecalho from "../components/Cabecalho.jsx";
import Filtros from "../components/Filtros.jsx";
import CardLivro from "../components/CardLivro.jsx";
import FormularioLivro from "../components/FormularioLivro.jsx";
import ModalConfirmacao from "../components/ModalConfirmacao.jsx";
import {
  listarLivros,
  criarLivro,
  atualizarLivro,
  excluirLivro,
} from "../api/livros.js";

const FILTROS_VAZIOS = { search: "", genre: "", format: "", literature: "" };

export default function ListaLivros() {
  const [aba, setAba] = useState("lido");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [formAberto, setFormAberto] = useState(false);
  const [livroEmEdicao, setLivroEmEdicao] = useState(null);
  const [statusFixo, setStatusFixo] = useState(null);

  const [livroParaExcluir, setLivroParaExcluir] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const dados = await listarLivros({ status: aba, ...filtros });
      setLivros(dados);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os livros");
    } finally {
      setCarregando(false);
    }
  }, [aba, filtros]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirNovo() {
    setLivroEmEdicao(null);
    setStatusFixo(null);
    setFormAberto(true);
  }

  function abrirEdicao(livro) {
    setLivroEmEdicao(livro);
    setStatusFixo(null);
    setFormAberto(true);
  }

  function abrirMarcarLido(livro) {
    setLivroEmEdicao(livro);
    setStatusFixo("lido");
    setFormAberto(true);
  }

  function fecharForm() {
    setFormAberto(false);
    setLivroEmEdicao(null);
    setStatusFixo(null);
  }

  async function salvar(payload) {
    if (livroEmEdicao && livroEmEdicao.id) {
      await atualizarLivro(livroEmEdicao.id, payload);
    } else {
      await criarLivro(payload);
    }
    fecharForm();
    await carregar();
  }

  async function confirmarExclusao() {
    try {
      await excluirLivro(livroParaExcluir.id);
      setLivroParaExcluir(null);
      await carregar();
    } catch (e) {
      setErro(e.message || "Não foi possível excluir");
      setLivroParaExcluir(null);
    }
  }

  return (
    <div>
      <Cabecalho />
      <main className="conteudo">
        <div className="abas">
          <button
            type="button"
            className={aba === "lido" ? "ativa" : ""}
            onClick={() => setAba("lido")}
            data-testid="aba-lido"
          >
            Lido
          </button>
          <button
            type="button"
            className={aba === "quero_ler" ? "ativa" : ""}
            onClick={() => setAba("quero_ler")}
            data-testid="aba-quero-ler"
          >
            Quero ler
          </button>
        </div>

        <div className="barra-acoes">
          <Filtros valores={filtros} aoAlterar={setFiltros} />
          <button type="button" onClick={abrirNovo} data-testid="botao-adicionar-livro">
            Adicionar livro
          </button>
        </div>

        {erro && (
          <p className="erro" data-testid="erro-lista">
            {erro}
          </p>
        )}
        {carregando && <p data-testid="carregando">Carregando...</p>}
        {!carregando && livros.length === 0 && (
          <p data-testid="lista-vazia">Nenhum livro encontrado</p>
        )}

        <div className="lista-livros" data-testid="lista-livros">
          {livros.map((livro) => (
            <CardLivro
              key={livro.id}
              livro={livro}
              aoEditar={abrirEdicao}
              aoExcluir={setLivroParaExcluir}
              aoMarcarLido={abrirMarcarLido}
            />
          ))}
        </div>
      </main>

      {formAberto && (
        <FormularioLivro
          livroInicial={livroEmEdicao}
          statusFixo={statusFixo}
          aoSalvar={salvar}
          aoCancelar={fecharForm}
        />
      )}

      {livroParaExcluir && (
        <ModalConfirmacao
          mensagem={`Tem certeza que deseja excluir "${livroParaExcluir.title}"?`}
          aoConfirmar={confirmarExclusao}
          aoCancelar={() => setLivroParaExcluir(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Preparar dados e abrir o app**

```bash
curl -s -X POST http://localhost:3001/api/test/reset
npm run dev
```
Entrar em `http://localhost:5173` com `admin` / `admin123`.

- [ ] **Step 3: Verificar listagem e abas**

Expected: aba "Lido" mostra 5 cards; clicar em "Quero ler" mostra 3 cards; cards de "Quero ler" têm o botão "Marcar como lido", os de "Lido" não.

- [ ] **Step 4: Verificar filtros**

Na aba "Lido", escolher gênero "Distopia" → 2 cards. Digitar "orwell" na busca → 1 card ("1984"). Limpar → volta a 5.

- [ ] **Step 5: Verificar adicionar (com erro de validação)**

"Adicionar livro" → deixar título vazio, status "Quero ler", escolher gênero e literatura → "Salvar".
Expected: mensagem "O campo título é obrigatório" abaixo do campo título; modal continua aberto. Preencher o título e salvar → modal fecha, card aparece na aba "Quero ler".

- [ ] **Step 6: Verificar marcar como lido**

Num card de "Quero ler", clicar "Marcar como lido" → o formulário abre sem o seletor de status, com os campos de páginas/formato/datas. Preencher com data de fim anterior à de início → "Salvar" → erro "A data de fim não pode ser anterior à data de início". Corrigir → salva; o livro some de "Quero ler" e aparece em "Lido".

- [ ] **Step 7: Verificar editar e excluir**

Editar um card, mudar o título, salvar → título atualizado. Excluir um card → modal "Tem certeza que deseja excluir ...?"; "Cancelar" fecha sem remover; "Confirmar" remove e o card some.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/ListaLivros.jsx
git commit -m "feat(client): página principal de livros com CRUD, filtros e abas"
```

---

## Task 20: Cliente — página de Estatísticas

**Files:**
- Modify: `client/src/pages/Estatisticas.jsx` (substitui o stub)

**Interfaces:**
- Consumes: `Cabecalho`; `obterEstatisticas` de `api/stats.js`.
- Produces: página `/estatisticas`. `data-testid`: `stat-total-lidos`, `stat-total-quero-ler`, `stat-paginas-lidas`, `stat-por-genero`, `stat-por-formato`, `stat-por-literatura`, `erro-estatisticas`.

- [ ] **Step 1: Substituir `client/src/pages/Estatisticas.jsx`**

```jsx
import { useEffect, useState } from "react";
import Cabecalho from "../components/Cabecalho.jsx";
import { obterEstatisticas } from "../api/stats.js";

function Contagem({ titulo, dados, testid }) {
  const itens = Object.entries(dados || {});
  return (
    <div className="cartao" data-testid={testid}>
      <h3>{titulo}</h3>
      {itens.length === 0 ? (
        <p>Sem dados</p>
      ) : (
        <ul>
          {itens.map(([chave, valor]) => (
            <li key={chave}>
              {chave}: {valor}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Estatisticas() {
  const [stats, setStats] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    obterEstatisticas()
      .then(setStats)
      .catch((e) => setErro(e.message || "Não foi possível carregar as estatísticas"));
  }, []);

  return (
    <div>
      <Cabecalho />
      <main className="conteudo">
        <h1>Estatísticas</h1>
        {erro && (
          <p className="erro" data-testid="erro-estatisticas">
            {erro}
          </p>
        )}
        {stats && (
          <div className="grade-estatisticas">
            <div className="cartao" data-testid="stat-total-lidos">
              <h3>Livros lidos</h3>
              <p className="numero">{stats.totalLidos}</p>
            </div>
            <div className="cartao" data-testid="stat-total-quero-ler">
              <h3>Quero ler</h3>
              <p className="numero">{stats.totalQueroLer}</p>
            </div>
            <div className="cartao" data-testid="stat-paginas-lidas">
              <h3>Páginas lidas</h3>
              <p className="numero">{stats.totalPaginasLidas}</p>
            </div>
            <Contagem titulo="Por gênero" dados={stats.porGenero} testid="stat-por-genero" />
            <Contagem titulo="Por formato" dados={stats.porFormato} testid="stat-por-formato" />
            <Contagem titulo="Por literatura" dados={stats.porLiteratura} testid="stat-por-literatura" />
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verificar no navegador**

`curl -s -X POST http://localhost:3001/api/test/reset`, depois abrir `/estatisticas` (logada).
Expected: "Livros lidos" = 5, "Quero ler" = 3, "Páginas lidas" = 1740. "Por gênero" lista Thriller Psicológico: 1, Distopia: 2, Romance: 1, Comédia Romântica: 1. O link "Estatísticas" do cabeçalho leva a essa página; o logo volta para a lista.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Estatisticas.jsx
git commit -m "feat(client): página de estatísticas"
```

---

## Task 21: README final

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: tudo.
- Produces: `README.md` com instruções completas.

- [ ] **Step 1: Substituir `README.md`**

````markdown
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
````

- [ ] **Step 2: Verificar**

Run: `npm run dev` na raiz, do zero (sem `data.sqlite`), seguindo o README ao pé da letra.
Expected: app sobe, login funciona, `npm run reset` popula os dados, lista e estatísticas batem.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README com instruções de uso"
```

---

## Self-Review (feito pelo autor do plano)

**1. Cobertura da spec:**
- Login simples fixo → Tasks 6, 12. ✅
- Modelo de dados (campos, listas fixas, `start_date`/`end_date`, `literature` sempre obrigatório) → Tasks 2, 3. ✅
- Validações (obrigatórios, valores fora da lista, `end_date < start_date`, `pages > 0`) → Task 3. ✅
- API (login, CRUD com filtros, stats, reset, erros JSON, 404) → Tasks 5–9. ✅
- Telas (login, lista com abas, filtros+busca, formulário condicional, modal de exclusão, estatísticas) → Tasks 12, 16–20. ✅
- Mover "quero ler" → "lido" preenchendo o que falta → Task 17 (`statusFixo`), Task 19 (`abrirMarcarLido`). ✅
- Autenticação via `localStorage` + `Authorization: Bearer` + rota protegida + logout → Tasks 10, 11, 14. ✅
- `data-testid` em tudo → Global Constraints + cada task de UI. ✅
- Reset sem token, seed ~8 livros → Task 5. ✅
- Datas ISO no back, `DD/MM/AAAA` na tela → Tasks 3 (validação/armazenamento), 15 (`formatarData`), 17 (input `type="date"`). ✅
- README → Task 21. ✅
- Estrutura de pastas do design → Mapa de arquivos + Tasks 2, 10. ✅

**2. Placeholders:** nenhum "TBD"/"TODO". Os `<id>` nos comandos `curl` das Tasks 7 e 19 são valores que o worker lê da resposta anterior, não placeholders de código.

**3. Consistência de tipos:**
- `validateBook` → `{ valid, value | errors }` usado igual em `routes/books.js` (Task 7). ✅
- `value` de `validateBook` tem as 9 chaves; `books-repo.linhaCompleta` consome exatamente essas. ✅
- `TOKEN` (`"token-de-teste-123"`) idêntico em `middleware/auth.js`, `routes/login.js` (importa de auth), README e verificações. ✅
- Resposta de erro `{ error, errors }` produzida em `routes/books.js` e consumida em `http.js` (`.errors`) e `FormularioLivro` (`e.errors`). ✅
- `listarLivros({ status: aba, ...filtros })` (Task 19) → query params que `routes/books.js` lê (`status, genre, format, literature, search`). Chaves de `FILTROS_VAZIOS` = `search, genre, format, literature`, batem com o back. ✅
- `config.js` (`GENEROS`/`LITERATURAS`/`FORMATOS`) espelha `validation.js` (`GENRES`/`LITERATURES`/`FORMATS`). Valores conferidos um a um. ✅
- `data-testid` do formulário: `select-genero-form` / `select-literatura-form` / `select-formato-form` (com sufixo) para não colidir com os filtros `select-genero` / `select-literatura` / `select-formato`. ✅

**4. Ambiguidade:** contagens de `stats` são só de livros `lido` (dito na Task 8 e no design). `totalQueroLer` conta os `quero_ler`. Ordenação da lista: por título, sem diferenciar maiúsculas (Task 4).
