# Upload da Capa do Livro — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:executing-plans (inline, com checkpoints) para executar este plano tarefa a tarefa. Steps usam checkbox (`- [ ]`).

**Goal:** Anexar uma imagem de capa (PNG/JPEG/WEBP, ≤ 2 MB) a cada livro — opcional, pelo formulário ou por atalho no card — com armazenamento em arquivo no servidor e endpoints dedicados.

**Architecture:** `multer` recebe o `multipart/form-data` em memória; um módulo `server/src/cover-storage.js` grava/apaga o arquivo em `server/uploads/` (o `books-repo` continua só falando com o banco). Coluna nova `cover_file` (migração aditiva). Endpoints `POST`/`DELETE /api/books/:id/book-cover`; imagens servidas por `express.static` em `/uploads`. No cliente, `FormData` + `fetch` dedicado (o wrapper JSON não serve para multipart).

**Tech Stack:** Node 18+, Express 4, better-sqlite3, `multer` (nova dep do server), React 18, Vite 5. Sem dependência de processamento de imagem. Python + Pillow (já instalado) só para gerar as 3 imagens de exemplo.

**Spec:** `docs/superpowers/specs/2026-09-10-upload-capa-livro-design.md`

## Global Constraints

- **Node.js 18+.** Todo texto de interface e mensagem de erro em **português**.
- **Sem framework de testes no repositório.** Verificação por `curl`, `node -e`, `npm run build -w client` e walkthrough no navegador. Não instalar Vitest/Jest/Cypress/Playwright.
- **Branch:** `feature-upload-capa` (parte de `ajustes-1-2-ordenacao-genero`).
- **Versionamento é da usuária.** Nenhum commit automático. Cada tarefa termina com o comando `git` **para a usuária rodar**. O worker mostra o comando e para; não executa `git add`/`git commit`/`git push`.
- **Capa é opcional.** Livro sem capa salva e funciona normalmente.
- **Formatos aceitos:** `image/png`, `image/jpeg`, `image/webp`. **Tamanho máximo:** `2 * 1024 * 1024` bytes. Sem redimensionar — guarda como enviado.
- **Pasta `server/uploads/`** — ignorada no git, criada em runtime. **`server/seed-assets/`** — versionada.
- **Nome do arquivo salvo:** `<id>-<Date.now()>.<ext>`, `ext` derivada do mimetype (`image/jpeg`→`jpg`), **nunca** do nome original.
- **Respostas de erro:** JSON `{ "error": "mensagem" }`. Status: `200`, `204`, `400`, `401`, `404`, `500`.
- **Token:** `Authorization: Bearer token-de-teste-123` nas rotas de `book-cover` (não em `GET /uploads/...`).
- **`cover_url`** é derivado (`"/uploads/" + cover_file` ou `null`), montado em `serializeBook`, presente em toda resposta que devolve um livro.
- **`data-testid` novos** (todos obrigatórios): formulário — `input-capa`, `preview-capa`, `capa-atual`, `botao-remover-capa`, `erro-capa`. Card (sufixo `-<id>`) — `capa-livro-<id>`, `capa-placeholder-<id>`, `input-capa-<id>`, `botao-adicionar-capa-<id>`, `botao-trocar-capa-<id>`, `botao-remover-capa-<id>`, `erro-capa-<id>`.

## Verificação (por que não há testes automatizados)

Decisão de produto: o repositório não tem test runner. Cada tarefa define o
comportamento esperado e o verifica com um comando concreto (`curl` com
saída esperada, `node -e`, build, passos no navegador). Scripts descartáveis
vão em `scratch/` (git-ignored).

---

## Mapa de arquivos

**Servidor**
- `server/package.json` — + `multer`
- `server/.gitignore` *(ou raiz)* — + `server/uploads/`
- `server/src/db.js` — migração `ALTER TABLE books ADD COLUMN cover_file`
- `server/src/cover-storage.js` — **novo**: acesso ao disco (salvar/apagar/limpar/copiar seed asset), constantes de mime/tamanho
- `server/src/books-repo.js` — `serializeBook`, `setBookCover`, `clearBookCover`; todas as leituras serializadas
- `server/src/routes/book-cover.js` — **novo**: `POST`/`DELETE /:id/book-cover` + tratamento de erro do multer
- `server/src/routes/books.js` — `DELETE /:id` apaga o arquivo de capa
- `server/src/routes/test-reset.js` — limpa `uploads/`, aplica 3 capas de exemplo
- `server/src/app.js` — monta `book-cover` e `express.static("/uploads")`
- `server/seed-assets/` — **novo**: `seed-garota-no-trem.jpg`, `seed-1984.png`, `seed-torto-arado.webp` + `gerar.py`

**Cliente**
- `client/src/api/livros.js` — `enviarCapa(id, arquivo)`, `removerCapa(id)`
- `client/src/components/CardLivro.jsx` — exibição da capa + atalho (adicionar/trocar/remover)
- `client/src/pages/ListaLivros.jsx` — `salvar(payload, capa)` orquestra livro + capa; `aoMudarCapa={carregar}` no card
- `client/src/components/FormularioLivro.jsx` — campo "Capa", preview, remover, `erro-capa`
- `client/src/styles.css` — layout do card em duas colunas + estilo da capa/placeholder

**Docs**
- `README.md`, spec — endpoints, uploads, reset, testids

---

## Task 1: Servidor — dependência, storage de disco, migração da coluna

**Files:**
- Modify: `server/package.json`
- Modify: `.gitignore`
- Create: `server/src/cover-storage.js`
- Modify: `server/src/db.js`
- Test: `scratch/check-cover-storage.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `cover-storage.js` exporta `PASTA_UPLOADS`, `PASTA_SEED_ASSETS`, `EXTENSOES_POR_MIME` (`{ "image/png":"png", "image/jpeg":"jpg", "image/webp":"webp" }`), `TAMANHO_MAXIMO` (`2*1024*1024`), `garantirPasta()`, `salvarCapa(bookId, buffer, mimetype) → nomeArquivo`, `apagarCapa(nome)` (tolera ausência), `limparPasta()`, `copiarSeedAsset(nomeOrigem, bookId) → nomeDestino`.
  - `db.js` — tabela `books` ganha a coluna `cover_file TEXT` (NULL nas linhas existentes).

- [ ] **Step 1: Adicionar `multer` ao `server/package.json`**

Em `dependencies`, adicionar `"multer": "^1.4.5-lts.1"` (mantendo a ordem alfabética: entre `express` e o que vier depois — na prática, após `express`).

- [ ] **Step 2: Instalar**

Run (na raiz): `npm install`
Expected: instala `multer` sem erro.

- [ ] **Step 3: Ignorar a pasta de uploads**

No `.gitignore` da raiz, adicionar a linha:
```
server/uploads/
```

- [ ] **Step 4: Criar `server/src/cover-storage.js`**

```js
const fs = require("node:fs");
const path = require("node:path");

const PASTA_UPLOADS = path.join(__dirname, "..", "uploads");
const PASTA_SEED_ASSETS = path.join(__dirname, "..", "seed-assets");

const EXTENSOES_POR_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const TAMANHO_MAXIMO = 2 * 1024 * 1024;

function garantirPasta() {
  fs.mkdirSync(PASTA_UPLOADS, { recursive: true });
}

function salvarCapa(bookId, buffer, mimetype) {
  garantirPasta();
  const ext = EXTENSOES_POR_MIME[mimetype];
  const nome = `${bookId}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(PASTA_UPLOADS, nome), buffer);
  return nome;
}

function apagarCapa(nome) {
  if (!nome) return;
  try {
    fs.unlinkSync(path.join(PASTA_UPLOADS, nome));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}

function limparPasta() {
  garantirPasta();
  for (const nome of fs.readdirSync(PASTA_UPLOADS)) {
    fs.unlinkSync(path.join(PASTA_UPLOADS, nome));
  }
}

function copiarSeedAsset(nomeOrigem, bookId) {
  garantirPasta();
  const bruta = path.extname(nomeOrigem).slice(1).toLowerCase();
  const ext = bruta === "jpeg" ? "jpg" : bruta;
  const sufixo = Math.random().toString(36).slice(2, 8);
  const nomeDestino = `${bookId}-${Date.now()}-${sufixo}.${ext}`;
  fs.copyFileSync(
    path.join(PASTA_SEED_ASSETS, nomeOrigem),
    path.join(PASTA_UPLOADS, nomeDestino)
  );
  return nomeDestino;
}

module.exports = {
  PASTA_UPLOADS,
  PASTA_SEED_ASSETS,
  EXTENSOES_POR_MIME,
  TAMANHO_MAXIMO,
  garantirPasta,
  salvarCapa,
  apagarCapa,
  limparPasta,
  copiarSeedAsset,
};
```

- [ ] **Step 5: Migração da coluna em `server/src/db.js`**

Depois do bloco `db.exec(\`CREATE TABLE IF NOT EXISTS books (...)\`);` e antes de `module.exports = db;`, inserir:

```js
const colunasBooks = db.prepare("PRAGMA table_info(books)").all().map((c) => c.name);
if (!colunasBooks.includes("cover_file")) {
  db.exec("ALTER TABLE books ADD COLUMN cover_file TEXT");
}
```

- [ ] **Step 6: Criar `scratch/check-cover-storage.js`**

```js
const fs = require("node:fs");
const path = require("node:path");
const cs = require("../server/src/cover-storage");
const db = require("../server/src/db");

const colunas = db.prepare("PRAGMA table_info(books)").all().map((c) => c.name);
console.log("coluna cover_file existe:", colunas.includes("cover_file"));

const nome = cs.salvarCapa(42, Buffer.from("conteudo-fake-png"), "image/png");
console.log("salvarCapa ->", nome, "| padrão ok:", /^42-\d+\.png$/.test(nome));
console.log("arquivo existe:", fs.existsSync(path.join(cs.PASTA_UPLOADS, nome)));

cs.apagarCapa(nome);
console.log("após apagar, existe:", fs.existsSync(path.join(cs.PASTA_UPLOADS, nome)));
cs.apagarCapa(nome); // segunda vez não pode lançar
console.log("apagar de novo: ok (sem erro)");

cs.salvarCapa(1, Buffer.from("a"), "image/jpeg");
cs.salvarCapa(2, Buffer.from("b"), "image/webp");
cs.limparPasta();
console.log("após limparPasta, arquivos:", fs.readdirSync(cs.PASTA_UPLOADS).length);
```

- [ ] **Step 7: Rodar a verificação**

Run: `node scratch/check-cover-storage.js`
Expected:
```
coluna cover_file existe: true
salvarCapa -> 42-<n>.png | padrão ok: true
arquivo existe: true
após apagar, existe: false
apagar de novo: ok (sem erro)
após limparPasta, arquivos: 0
```

- [ ] **Step 8: Verificar migração idempotente**

Run: `node -e "require('./server/src/db'); require('./server/src/db'); console.log('carregou 2x sem erro')"`
Expected: `carregou 2x sem erro` (o `ALTER TABLE` não roda de novo).

- [ ] **Step 9: Commit (você roda)**

```bash
git add server/package.json package-lock.json .gitignore server/src/cover-storage.js server/src/db.js
git commit -m "feat(server): multer, módulo de storage de capa e coluna cover_file"
```

---

## Task 2: Servidor — imagens de exemplo do seed

**Files:**
- Create: `server/seed-assets/gerar.py`
- Create: `server/seed-assets/seed-garota-no-trem.jpg`
- Create: `server/seed-assets/seed-1984.png`
- Create: `server/seed-assets/seed-torto-arado.webp`

**Interfaces:**
- Consumes: nada.
- Produces: 3 arquivos de imagem pequenos e válidos em `server/seed-assets/`, um de cada formato aceito. Usados pela Task 6 (`reset`).

- [ ] **Step 1: Criar `server/seed-assets/gerar.py`**

```python
"""Gera as 3 imagens de capa de exemplo do seed. Requer Pillow (pip install pillow)."""
from PIL import Image, ImageDraw

CAPAS = [
    ("seed-garota-no-trem.jpg", "JPEG", (46, 64, 92), "A GAROTA\nNO TREM"),
    ("seed-1984.png", "PNG", (120, 30, 30), "1984"),
    ("seed-torto-arado.webp", "WEBP", (74, 52, 38), "TORTO\nARADO"),
]

for nome, formato, cor, texto in CAPAS:
    img = Image.new("RGB", (400, 600), cor)
    d = ImageDraw.Draw(img)
    d.multiline_text((30, 250), texto, fill=(240, 240, 240), spacing=12)
    kwargs = {"quality": 80} if formato in ("JPEG", "WEBP") else {}
    img.save(f"server/seed-assets/{nome}", formato, **kwargs)
    print("gerado:", nome)
```

- [ ] **Step 2: Gerar as imagens**

Run (na raiz): `python3 server/seed-assets/gerar.py`
Expected:
```
gerado: seed-garota-no-trem.jpg
gerado: seed-1984.png
gerado: seed-torto-arado.webp
```

- [ ] **Step 3: Verificar os arquivos**

Run:
```bash
node -e "
const fs=require('node:fs'); const p='server/seed-assets/';
for (const f of ['seed-garota-no-trem.jpg','seed-1984.png','seed-torto-arado.webp']) {
  const b=fs.readFileSync(p+f);
  const sig = b.slice(0,4).toString('hex');
  console.log(f, b.length, 'bytes', '| < 100KB:', b.length < 100*1024, '| assinatura:', sig);
}
"
```
Expected: cada arquivo existe, `< 100KB: true`. Assinaturas: jpg começa com `ffd8ff...`, png com `89504e47`, webp com `52494646` (RIFF).

- [ ] **Step 4: Commit (você roda)**

```bash
git add server/seed-assets/
git commit -m "feat(server): imagens de capa de exemplo para o seed"
```

---

## Task 3: Servidor — serialização e set/clear da capa no repositório

**Files:**
- Modify: `server/src/books-repo.js`
- Test: `scratch/check-repo-cover.js`

**Interfaces:**
- Consumes: `db` de `db.js`.
- Produces (adições ao export de `books-repo.js`):
  - `serializeBook(row)` → mesmo objeto + `cover_url` (`"/uploads/"+cover_file` ou `null`); `null`/`undefined` passam direto.
  - `setBookCover(id, filename)` → livro serializado, ou `undefined` se o id não existe.
  - `clearBookCover(id)` → livro serializado (com `cover_file: null`), ou `undefined`.
  - `listBooks`, `getBook`, `createBook`, `updateBook` agora devolvem livros **serializados** (com `cover_url`).

- [ ] **Step 1: Adicionar `serializeBook` e usar em `getBook`**

No topo de `books-repo.js` (após `const db = ...`), adicionar:

```js
function serializeBook(row) {
  if (!row) return row;
  return {
    ...row,
    cover_url: row.cover_file ? `/uploads/${row.cover_file}` : null,
  };
}
```

Trocar `getBook`:

```js
function getBook(id) {
  return serializeBook(db.prepare("SELECT * FROM books WHERE id = ?").get(id));
}
```

- [ ] **Step 2: Serializar `listBooks`**

No `listBooks`, o retorno tem dois caminhos (com e sem `search`). Serializar os dois:

- trocar `if (!filters.search) return linhas;` por `if (!filters.search) return linhas.map(serializeBook);`
- trocar o `return linhas.filter(...)` final por `return linhas.filter(...).map(serializeBook);`

- [ ] **Step 3: `createBook` e `updateBook` já usam `getBook`**

`createBook` termina com `return getBook(info.lastInsertRowid);` e `updateBook` com `return getBook(id);` — como `getBook` agora serializa, nada mais a fazer nessas duas.

- [ ] **Step 4: Adicionar `setBookCover` e `clearBookCover`**

Antes do `module.exports`:

```js
function setBookCover(id, filename) {
  const existe = db.prepare("SELECT id FROM books WHERE id = ?").get(id);
  if (!existe) return undefined;
  db.prepare("UPDATE books SET cover_file = @f, updated_at = @u WHERE id = @id").run({
    f: filename,
    u: new Date().toISOString(),
    id,
  });
  return getBook(id);
}

function clearBookCover(id) {
  const existe = db.prepare("SELECT id FROM books WHERE id = ?").get(id);
  if (!existe) return undefined;
  db.prepare("UPDATE books SET cover_file = NULL, updated_at = @u WHERE id = @id").run({
    u: new Date().toISOString(),
    id,
  });
  return getBook(id);
}
```

- [ ] **Step 5: Exportar as funções novas**

Adicionar `serializeBook`, `setBookCover`, `clearBookCover` ao objeto `module.exports`.

- [ ] **Step 6: Criar `scratch/check-repo-cover.js`**

```js
const repo = require("../server/src/books-repo");

repo.deleteAllBooks();
const livro = repo.createBook({
  status: "quero_ler", title: "T", author: "A", genre: "Romance", literature: "brasileira",
});
console.log("novo livro cover_url:", livro.cover_url); // null

const comCapa = repo.setBookCover(livro.id, "9-123.png");
console.log("setBookCover cover_file:", comCapa.cover_file, "| cover_url:", comCapa.cover_url);

const naLista = repo.listBooks()[0];
console.log("listBooks traz cover_url:", "cover_url" in naLista, "->", naLista.cover_url);

const semCapa = repo.clearBookCover(livro.id);
console.log("clearBookCover cover_file:", semCapa.cover_file, "| cover_url:", semCapa.cover_url);

console.log("setBookCover id inexistente:", repo.setBookCover(999999, "x.png"));
repo.deleteAllBooks();
```

- [ ] **Step 7: Rodar a verificação**

Run: `node scratch/check-repo-cover.js`
Expected:
```
novo livro cover_url: null
setBookCover cover_file: 9-123.png | cover_url: /uploads/9-123.png
listBooks traz cover_url: true -> /uploads/9-123.png
clearBookCover cover_file: null | cover_url: null
setBookCover id inexistente: undefined
```

- [ ] **Step 8: Restaurar o seed** (o check esvaziou o banco)

Run: `node -e "const r=require('./server/src/books-repo'); const {SEED_BOOKS}=require('./server/src/seed'); r.deleteAllBooks(); r.insertSeed(SEED_BOOKS); console.log('seed restaurado:', r.listBooks().length)"`
Expected: `seed restaurado: 8`

- [ ] **Step 9: Commit (você roda)**

```bash
git add server/src/books-repo.js
git commit -m "feat(server): cover_url serializado e set/clear da capa no repo"
```

---

## Task 4: Servidor — rotas POST/DELETE book-cover, estático /uploads

**Files:**
- Create: `server/src/routes/book-cover.js`
- Modify: `server/src/app.js`
- Test: `curl`

**Interfaces:**
- Consumes: `repo` (`getBook`, `setBookCover`, `clearBookCover`), `cover-storage` (`salvarCapa`, `apagarCapa`, `TAMANHO_MAXIMO`, `EXTENSOES_POR_MIME`, `PASTA_UPLOADS`), `requireAuth`.
- Produces:
  - `POST /api/books/:id/book-cover` (multipart, campo `cover`, exige token) → `200` livro serializado; `400` (sem arquivo / tipo inválido / > 2 MB); `404` (livro inexistente).
  - `DELETE /api/books/:id/book-cover` (exige token) → `200` livro serializado; `404`.
  - `GET /uploads/:arquivo` → imagem estática, sem token; `404` se não existe.

- [ ] **Step 1: Criar `server/src/routes/book-cover.js`**

```js
const express = require("express");
const multer = require("multer");
const repo = require("../books-repo");
const coverStorage = require("../cover-storage");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: coverStorage.TAMANHO_MAXIMO },
  fileFilter: (req, file, cb) => {
    if (coverStorage.EXTENSOES_POR_MIME[file.mimetype]) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error("Formato inválido. Use PNG, JPEG ou WEBP"), {
          status: 400,
        })
      );
    }
  },
});

router.post("/:id/book-cover", upload.single("cover"), (req, res) => {
  const id = Number(req.params.id);
  const livro = repo.getBook(id);
  if (!livro) return res.status(404).json({ error: "Livro não encontrado" });
  if (!req.file) return res.status(400).json({ error: "Envie um arquivo de imagem" });

  const nome = coverStorage.salvarCapa(id, req.file.buffer, req.file.mimetype);
  if (livro.cover_file) coverStorage.apagarCapa(livro.cover_file);
  res.json(repo.setBookCover(id, nome));
});

router.delete("/:id/book-cover", (req, res) => {
  const id = Number(req.params.id);
  const livro = repo.getBook(id);
  if (!livro) return res.status(404).json({ error: "Livro não encontrado" });
  if (livro.cover_file) coverStorage.apagarCapa(livro.cover_file);
  res.json(repo.clearBookCover(id));
});

// Erros do upload: tamanho (multer) e tipo (fileFilter)
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "A imagem deve ter no máximo 2 MB" });
  }
  if (err && err.status === 400) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
```

- [ ] **Step 2: Montar em `server/src/app.js`**

Adicionar aos `require` do topo:
```js
const bookCoverRouter = require("./routes/book-cover");
const coverStorage = require("./cover-storage");
```

Depois de `app.use(express.json());` e **antes** das rotas de `/api`, servir os arquivos:
```js
app.use("/uploads", express.static(coverStorage.PASTA_UPLOADS));
```

Nas montagens de rota, adicionar `book-cover` logo **antes** de `booksRouter` (as duas sob `/api/books`, ambas com `requireAuth`):
```js
app.use("/api/books", requireAuth, bookCoverRouter);
app.use("/api/books", requireAuth, booksRouter);
```

- [ ] **Step 3: Subir o servidor e preparar**

```bash
node -e "const r=require('./server/src/books-repo'); const {SEED_BOOKS}=require('./server/src/seed'); r.deleteAllBooks(); r.insertSeed(SEED_BOOKS)"
npm run dev -w server &
sleep 2
```

- [ ] **Step 4: Upload válido**

Run:
```bash
curl -s -H "Authorization: Bearer token-de-teste-123" \
  -F "cover=@server/seed-assets/seed-1984.png" \
  -X POST http://localhost:3001/api/books/2/book-cover
```
Expected: `200`, JSON do livro 2 com `"cover_file":"2-<n>.png"` e `"cover_url":"/uploads/2-<n>.png"`. O arquivo aparece em `server/uploads/`.

- [ ] **Step 5: Servir a imagem**

Run: `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3001/uploads/$(ls server/uploads | head -1)`
Expected: `200 image/png`

- [ ] **Step 6: Tipo inválido**

Run:
```bash
echo "nao sou imagem" > scratch/x.txt
curl -s -w " [%{http_code}]\n" -H "Authorization: Bearer token-de-teste-123" \
  -F "cover=@scratch/x.txt" -X POST http://localhost:3001/api/books/2/book-cover
```
Expected: `{"error":"Formato inválido. Use PNG, JPEG ou WEBP"} [400]`

- [ ] **Step 7: Arquivo grande demais**

Run:
```bash
head -c 3000000 /dev/urandom > scratch/grande.png
curl -s -w " [%{http_code}]\n" -H "Authorization: Bearer token-de-teste-123" \
  -F "cover=@scratch/grande.png;type=image/png" -X POST http://localhost:3001/api/books/2/book-cover
```
Expected: `{"error":"A imagem deve ter no máximo 2 MB"} [400]`

- [ ] **Step 8: Livro inexistente e sem arquivo**

```bash
curl -s -w " [%{http_code}]\n" -H "Authorization: Bearer token-de-teste-123" \
  -F "cover=@server/seed-assets/seed-1984.png" -X POST http://localhost:3001/api/books/99999/book-cover
curl -s -w " [%{http_code}]\n" -H "Authorization: Bearer token-de-teste-123" \
  -X POST http://localhost:3001/api/books/2/book-cover
```
Expected: primeiro `{"error":"Livro não encontrado"} [404]`; segundo `{"error":"Envie um arquivo de imagem"} [400]`.

- [ ] **Step 9: DELETE da capa**

```bash
curl -s -w " [%{http_code}]\n" -H "Authorization: Bearer token-de-teste-123" \
  -X DELETE http://localhost:3001/api/books/2/book-cover
ls server/uploads
```
Expected: `200`, livro 2 com `"cover_file":null`, `"cover_url":null`. O arquivo `2-*.png` sumiu de `server/uploads/`.

- [ ] **Step 10: Parar o servidor, restaurar o seed**

```bash
pkill -f "node --watch src/index.js"
node -e "const r=require('./server/src/books-repo'); const {SEED_BOOKS}=require('./server/src/seed'); r.deleteAllBooks(); r.insertSeed(SEED_BOOKS)"
node -e "const cs=require('./server/src/cover-storage'); cs.limparPasta()"
```

- [ ] **Step 11: Commit (você roda)**

```bash
git add server/src/routes/book-cover.js server/src/app.js
git commit -m "feat(server): endpoints de capa e arquivos estáticos em /uploads"
```

---

## Task 5: Servidor — excluir o livro apaga a capa

**Files:**
- Modify: `server/src/routes/books.js`
- Test: `curl`

**Interfaces:**
- Consumes: `repo` (`getBook`, `deleteBook`), `cover-storage` (`apagarCapa`).
- Produces: `DELETE /api/books/:id` continua `204`/`404`, e agora apaga `uploads/<cover_file>` do livro removido.

- [ ] **Step 1: Editar `server/src/routes/books.js`**

Adicionar ao topo: `const coverStorage = require("../cover-storage");`

Trocar o handler do `DELETE /:id` por:

```js
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const livro = repo.getBook(id);
  const removido = repo.deleteBook(id);
  if (!removido) return res.status(404).json({ error: "Livro não encontrado" });
  if (livro && livro.cover_file) coverStorage.apagarCapa(livro.cover_file);
  res.status(204).end();
});
```

- [ ] **Step 2: Verificar**

```bash
node -e "const r=require('./server/src/books-repo'); const {SEED_BOOKS}=require('./server/src/seed'); r.deleteAllBooks(); r.insertSeed(SEED_BOOKS)"
node -e "const cs=require('./server/src/cover-storage'); cs.limparPasta()"
npm run dev -w server &
sleep 2
H="Authorization: Bearer token-de-teste-123"
curl -s -H "$H" -F "cover=@server/seed-assets/seed-1984.png" -X POST http://localhost:3001/api/books/3/book-cover > /dev/null
echo "uploads antes:"; ls server/uploads
curl -s -o /dev/null -w "delete: %{http_code}\n" -H "$H" -X DELETE http://localhost:3001/api/books/3
echo "uploads depois:"; ls server/uploads
pkill -f "node --watch src/index.js"
```
Expected: `uploads antes` lista `3-*.png`; `delete: 204`; `uploads depois` vazio.

- [ ] **Step 3: Restaurar o seed**

Run: `node -e "const r=require('./server/src/books-repo'); const {SEED_BOOKS}=require('./server/src/seed'); r.deleteAllBooks(); r.insertSeed(SEED_BOOKS)"`

- [ ] **Step 4: Commit (você roda)**

```bash
git add server/src/routes/books.js
git commit -m "feat(server): excluir livro remove o arquivo de capa"
```

---

## Task 6: Servidor — reset limpa uploads e aplica 3 capas de exemplo

**Files:**
- Modify: `server/src/routes/test-reset.js`
- Test: `curl`

**Interfaces:**
- Consumes: `repo` (`deleteAllBooks`, `insertSeed`, `listBooks`, `setBookCover`), `cover-storage` (`limparPasta`, `copiarSeedAsset`), `SEED_BOOKS`.
- Produces: `POST /api/test/reset` → `{ "ok": true, "inseridos": 8 }`; `server/uploads/` fica com exatamente 3 arquivos; os livros "A Garota no Trem", "1984", "Torto Arado" ganham `cover_file`/`cover_url`; os outros 5 ficam com `null`.

- [ ] **Step 1: Reescrever `server/src/routes/test-reset.js`**

```js
const express = require("express");
const repo = require("../books-repo");
const coverStorage = require("../cover-storage");
const { SEED_BOOKS } = require("../seed");

const router = express.Router();

const CAPAS_SEED = {
  "A Garota no Trem": "seed-garota-no-trem.jpg",
  "1984": "seed-1984.png",
  "Torto Arado": "seed-torto-arado.webp",
};

router.post("/reset", (req, res) => {
  repo.deleteAllBooks();
  coverStorage.limparPasta();
  const inseridos = repo.insertSeed(SEED_BOOKS);

  for (const livro of repo.listBooks()) {
    const asset = CAPAS_SEED[livro.title];
    if (asset) {
      const nome = coverStorage.copiarSeedAsset(asset, livro.id);
      repo.setBookCover(livro.id, nome);
    }
  }

  res.json({ ok: true, inseridos });
});

module.exports = router;
```

- [ ] **Step 2: Verificar**

```bash
npm run dev -w server &
sleep 2
curl -s -X POST http://localhost:3001/api/test/reset
echo
echo "arquivos em uploads:"; ls server/uploads | wc -l
curl -s -H "Authorization: Bearer token-de-teste-123" http://localhost:3001/api/books \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const b=JSON.parse(s);console.log('com capa:', b.filter(x=>x.cover_url).map(x=>x.title).join(', '));console.log('sem capa:', b.filter(x=>!x.cover_url).length)})"
for f in $(ls server/uploads); do curl -s -o /dev/null -w "$f -> %{http_code} %{content_type}\n" http://localhost:3001/uploads/$f; done
pkill -f "node --watch src/index.js"
```
Expected:
```
{"ok":true,"inseridos":8}
arquivos em uploads: 3
com capa: A Garota no Trem, 1984, Torto Arado
sem capa: 5
<arquivo>.jpg -> 200 image/jpeg
<arquivo>.png -> 200 image/png
<arquivo>.webp -> 200 image/webp
```

- [ ] **Step 3: Commit (você roda)**

```bash
git add server/src/routes/test-reset.js
git commit -m "feat(server): reset limpa uploads e aplica 3 capas de exemplo"
```

---

## Task 7: Cliente — funções de API da capa

**Files:**
- Modify: `client/src/api/livros.js`
- Test: `npm run build -w client`

**Interfaces:**
- Consumes: `del` de `http.js`, `getToken` de `auth/tokenStorage.js`.
- Produces:
  - `enviarCapa(id, arquivo)` → `Promise<livro>`; monta `FormData` com o campo `cover`, `POST` com header só de `Authorization` (deixa o browser definir o `Content-Type` do multipart). Em erro, lança `Error` com `.message` (do campo `error`) e `.status`.
  - `removerCapa(id)` → `del("/api/books/:id/book-cover")`.

- [ ] **Step 1: Editar `client/src/api/livros.js`**

Trocar a primeira linha de import por:
```js
import { get, post, put, del } from "./http.js";
import { getToken } from "../auth/tokenStorage.js";
```

Adicionar ao final do arquivo:
```js
export async function enviarCapa(id, arquivo) {
  const form = new FormData();
  form.append("cover", arquivo);

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`/api/books/${id}/book-cover`, {
    method: "POST",
    headers,
    body: form,
  });

  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    const erro = new Error((dados && dados.error) || "Não foi possível enviar a capa");
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}

export function removerCapa(id) {
  return del(`/api/books/${id}/book-cover`);
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build -w client`
Expected: build sem erros.

- [ ] **Step 3: Commit (você roda)**

```bash
git add client/src/api/livros.js
git commit -m "feat(client): enviarCapa e removerCapa na API"
```

---

## Task 8: Cliente — exibição da capa e atalho no card

**Files:**
- Modify: `client/src/components/CardLivro.jsx`
- Test: `npm run build -w client`

**Interfaces:**
- Consumes: `enviarCapa`, `removerCapa` de `api/livros.js`; nova prop `aoMudarCapa` (função, opcional — chamada após enviar/remover a capa; a página usa para recarregar).
- Produces: card com imagem (`capa-livro-<id>`) ou placeholder (`capa-placeholder-<id>`), `<input type="file">` escondido (`input-capa-<id>`), botões `botao-adicionar-capa-<id>` / `botao-trocar-capa-<id>` / `botao-remover-capa-<id>`, faixa de erro `erro-capa-<id>`.

- [ ] **Step 1: Reescrever `client/src/components/CardLivro.jsx`**

```jsx
import { useRef, useState } from "react";
import { FORMATOS, LITERATURAS, rotulo } from "../config.js";
import { enviarCapa, removerCapa } from "../api/livros.js";

function formatarData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function CardLivro({ livro, aoEditar, aoExcluir, aoMarcarLido, aoMudarCapa }) {
  const inputRef = useRef(null);
  const [erroCapa, setErroCapa] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function aoEscolherArquivo(evento) {
    const arquivo = evento.target.files[0];
    evento.target.value = "";
    if (!arquivo) return;
    setErroCapa("");
    setOcupado(true);
    try {
      await enviarCapa(livro.id, arquivo);
      if (aoMudarCapa) await aoMudarCapa();
    } catch (e) {
      setErroCapa(e.message || "Não foi possível enviar a capa");
    } finally {
      setOcupado(false);
    }
  }

  async function aoRemoverCapa() {
    setErroCapa("");
    setOcupado(true);
    try {
      await removerCapa(livro.id);
      if (aoMudarCapa) await aoMudarCapa();
    } catch (e) {
      setErroCapa(e.message || "Não foi possível remover a capa");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <article className="card-livro" data-testid={`card-livro-${livro.id}`}>
      <div className="card-livro-conteudo">
        <div className="card-livro-dados">
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
        </div>
        <div className="card-livro-capa">
          {livro.cover_url ? (
            <img
              src={livro.cover_url}
              alt={`Capa de ${livro.title}`}
              data-testid={`capa-livro-${livro.id}`}
            />
          ) : (
            <div className="capa-placeholder" data-testid={`capa-placeholder-${livro.id}`}>
              Sem capa
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        ref={inputRef}
        onChange={aoEscolherArquivo}
        hidden
        data-testid={`input-capa-${livro.id}`}
      />
      {erroCapa && (
        <p className="erro" data-testid={`erro-capa-${livro.id}`}>
          {erroCapa}
        </p>
      )}

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
        {livro.cover_url ? (
          <>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => inputRef.current.click()}
              data-testid={`botao-trocar-capa-${livro.id}`}
            >
              Trocar capa
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={aoRemoverCapa}
              data-testid={`botao-remover-capa-${livro.id}`}
            >
              Remover capa
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => inputRef.current.click()}
            data-testid={`botao-adicionar-capa-${livro.id}`}
          >
            Adicionar capa
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

- [ ] **Step 2: Verificar**

Run: `npm run build -w client`
Expected: build sem erros.

- [ ] **Step 3: Commit (você roda)**

```bash
git add client/src/components/CardLivro.jsx
git commit -m "feat(client): capa e atalho de upload no card do livro"
```

---

## Task 9: Cliente — campo de capa no formulário

**Files:**
- Modify: `client/src/components/FormularioLivro.jsx`
- Test: `npm run build -w client`

**Interfaces:**
- Consumes: nada novo (só `useState` já importado).
- Produces: `aoSalvar` passa a ser chamado como `aoSalvar(payload, { arquivo, remover })` — `arquivo` é o `File` escolhido ou `null`; `remover` é `true` só quando o usuário clicou "Remover capa" numa edição. O `catch` de `enviar` trata erro com `e.capa === true` mostrando em `data-testid="erro-capa"`, sem fechar o formulário. `data-testid`: `input-capa`, `preview-capa`, `capa-atual`, `botao-remover-capa`, `erro-capa`.

- [ ] **Step 1: Adicionar estado da capa**

Após `const [enviando, setEnviando] = useState(false);`:
```js
  const [arquivoCapa, setArquivoCapa] = useState(null);
  const [removerCapaFlag, setRemoverCapaFlag] = useState(false);
  const [erroCapa, setErroCapa] = useState("");
```

- [ ] **Step 2: Passar a capa no `aoSalvar` e tratar o erro dela**

Dentro de `enviar`, no início adicionar `setErroCapa("");` junto aos outros resets.

Trocar `await aoSalvar(payload);` por:
```js
      await aoSalvar(payload, { arquivo: arquivoCapa, remover: removerCapaFlag });
```

No `catch (e)`, trocar o corpo por:
```js
    } catch (e) {
      if (e.capa) {
        setErroCapa(e.message || "Não foi possível salvar a capa");
      } else if (e.errors && e.errors.length > 0) {
        const mapa = {};
        for (const item of e.errors) mapa[item.field] = item.message;
        setErrosPorCampo(mapa);
        setErroGeral(e.message || "Não foi possível salvar");
      } else {
        setErroGeral(e.message || "Não foi possível salvar");
      }
    } finally {
```

- [ ] **Step 3: Adicionar o campo "Capa" no JSX**

Logo **antes** do bloco `{erroGeral && (...)}`:

```jsx
        <label>
          Capa (opcional)
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              setArquivoCapa(e.target.files[0] || null);
              setRemoverCapaFlag(false);
              setErroCapa("");
            }}
            data-testid="input-capa"
          />
        </label>

        {arquivoCapa && (
          <img
            className="preview-capa"
            src={URL.createObjectURL(arquivoCapa)}
            alt="Prévia da capa"
            data-testid="preview-capa"
          />
        )}

        {!arquivoCapa && livroInicial && livroInicial.cover_url && !removerCapaFlag && (
          <div className="capa-atual" data-testid="capa-atual">
            <img src={livroInicial.cover_url} alt="Capa atual" />
            <button
              type="button"
              onClick={() => setRemoverCapaFlag(true)}
              data-testid="botao-remover-capa"
            >
              Remover capa
            </button>
          </div>
        )}

        {removerCapaFlag && (
          <p data-testid="capa-marcada-remover">A capa será removida ao salvar.</p>
        )}

        {erroCapa && (
          <p className="erro" data-testid="erro-capa">
            {erroCapa}
          </p>
        )}
```

- [ ] **Step 4: Verificar**

Run: `npm run build -w client`
Expected: build sem erros.

(Nota: `URL.createObjectURL` sem `revokeObjectURL` vaza um pouco de memória por preview trocado. Aceitável num app de treino; não corrigir agora.)

- [ ] **Step 5: Commit (você roda)**

```bash
git add client/src/components/FormularioLivro.jsx
git commit -m "feat(client): campo de capa com preview no formulário"
```

---

## Task 10: Cliente — orquestração livro + capa na página

**Files:**
- Modify: `client/src/pages/ListaLivros.jsx`
- Test: `npm run build -w client` + walkthrough

**Interfaces:**
- Consumes: `enviarCapa`, `removerCapa` de `api/livros.js`; `criarLivro`/`atualizarLivro` (que devolvem o livro).
- Produces: `salvar(payload, capa = {})` — cria/edita o livro; se `capa.arquivo`, `enviarCapa`; senão se `capa.remover` (só edição), `removerCapa`; erro na etapa da capa recarrega a lista e re-lança um `Error` com `.capa = true` (o formulário mostra em `erro-capa` e não fecha). `CardLivro` recebe `aoMudarCapa={carregar}`.

- [ ] **Step 1: Importar as funções de capa**

Trocar o bloco de import de `../api/livros.js` por:
```js
import {
  listarLivros,
  criarLivro,
  atualizarLivro,
  excluirLivro,
  enviarCapa,
  removerCapa,
} from "../api/livros.js";
```

- [ ] **Step 2: Reescrever `salvar`**

```js
  async function salvar(payload, capa = {}) {
    const editando = Boolean(livroEmEdicao && livroEmEdicao.id);
    const livro = editando
      ? await atualizarLivro(livroEmEdicao.id, payload)
      : await criarLivro(payload);

    try {
      if (capa.arquivo) {
        await enviarCapa(livro.id, capa.arquivo);
      } else if (capa.remover && editando) {
        await removerCapa(livro.id);
      }
    } catch (e) {
      await carregar();
      const err = new Error(e.message || "Não foi possível salvar a capa");
      err.capa = true;
      throw err;
    }

    fecharForm();
    await carregar();
  }
```

- [ ] **Step 3: Passar `aoMudarCapa` ao card**

No `<CardLivro ... />`, adicionar a prop:
```jsx
              aoMudarCapa={carregar}
```

- [ ] **Step 4: Verificar build**

Run: `npm run build -w client`
Expected: build sem erros.

- [ ] **Step 5: Walkthrough no navegador**

```bash
node -e "const r=require('./server/src/books-repo'); const {SEED_BOOKS}=require('./server/src/seed'); r.deleteAllBooks(); r.insertSeed(SEED_BOOKS)"
npm run dev
```
Entrar (admin/admin123). Verificar:
- aba "Lido": "A Garota no Trem", "1984", "Torto Arado" mostram imagem; os outros mostram "Sem capa"
- num card "Sem capa": "Adicionar capa" → escolher `server/seed-assets/seed-1984.png` → o card passa a mostrar a imagem, sem recarregar a página
- num card com capa: "Trocar capa" → escolher outra → imagem muda; "Remover capa" → volta o placeholder
- "Adicionar livro": preencher, escolher um arquivo no campo "Capa" (preview aparece), salvar → card novo já com a imagem
- editar um livro com capa → aparece "Capa atual" + "Remover capa"; marcar remover + salvar → card sem capa
- escolher um `.txt` no card → faixa `erro-capa-<id>` com "Formato inválido..."

Parar os servidores (`Ctrl+C`).

- [ ] **Step 6: Restaurar o estado**

```bash
node -e "const r=require('./server/src/books-repo'); const {SEED_BOOKS}=require('./server/src/seed'); r.deleteAllBooks(); r.insertSeed(SEED_BOOKS)"
node -e "const cs=require('./server/src/cover-storage'); cs.limparPasta()"
```

- [ ] **Step 7: Commit (você roda)**

```bash
git add client/src/pages/ListaLivros.jsx
git commit -m "feat(client): orquestra livro + capa no salvar e recarrega pelo card"
```

---

## Task 11: Cliente — layout do card e estilo da capa

**Files:**
- Modify: `client/src/styles.css`
- Test: `npm run build -w client` + olhar no navegador

**Interfaces:**
- Consumes: classes usadas em `CardLivro.jsx` (`card-livro-conteudo`, `card-livro-dados`, `card-livro-capa`, `capa-placeholder`) e `FormularioLivro.jsx` (`preview-capa`, `capa-atual`).
- Produces: card com dados à esquerda e capa/placeholder (~90×135) à direita; preview e capa atual limitados no formulário.

- [ ] **Step 1: Adicionar ao final de `client/src/styles.css`**

```css
.card-livro-conteudo {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.card-livro-dados {
  flex: 1;
  min-width: 0;
}

.card-livro-capa img,
.card-livro-capa .capa-placeholder {
  width: 90px;
  height: 135px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--cor-borda);
  flex-shrink: 0;
}

.card-livro-capa .capa-placeholder {
  display: grid;
  place-items: center;
  text-align: center;
  font-size: 0.75rem;
  color: #71717a;
  background: #f4f4f5;
}

.preview-capa,
.capa-atual img {
  max-width: 120px;
  height: auto;
  border-radius: 6px;
  border: 1px solid var(--cor-borda);
  display: block;
  margin-bottom: 0.5rem;
}

.capa-atual {
  margin-bottom: 0.75rem;
}
```

(Se `--cor-borda` não existir no arquivo, usar `#d4d4d8` no lugar.)

- [ ] **Step 2: Verificar**

Run: `npm run build -w client`
Expected: build sem erros. No navegador (com `npm run dev` e dados do `reset`): cards com e sem capa alinhados, altura estável.

- [ ] **Step 3: Commit (você roda)**

```bash
git add client/src/styles.css
git commit -m "style(client): layout do card em duas colunas com a capa"
```

---

## Task 12: Docs — README e spec

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-10-upload-capa-livro-design.md`
- Test: walkthrough completo + suíte de `curl`

**Interfaces:**
- Consumes: tudo.
- Produces: README documenta os endpoints de capa, `/uploads`, a pasta, o comportamento do `reset` e os novos `data-testid`. Spec com `Status: Implementado`.

- [ ] **Step 1: README — tabela da API**

Na tabela de `## API`, após a linha do `DELETE /api/books/:id`, adicionar:
```
| POST | `/api/books/:id/book-cover` | envia/troca a capa (`multipart/form-data`, campo `cover`; PNG/JPEG/WEBP, ≤ 2 MB) |
| DELETE | `/api/books/:id/book-cover` | remove a capa |
| GET | `/uploads/<arquivo>` | serve a imagem da capa (sem token) |
```

- [ ] **Step 2: README — nova seção "Capas dos livros"**

Após a seção `## Valores fixos`, adicionar:

```markdown
## Capas dos livros

A capa é opcional. É enviada pelo formulário de livro ou pelo atalho no
card (Adicionar / Trocar / Remover capa). Os arquivos ficam em
`server/uploads/` (fora do git, criada em runtime) e são servidos em
`/uploads/<arquivo>`. Formatos: PNG, JPEG, WEBP; máximo 2 MB.

`POST /api/test/reset` esvazia `server/uploads/` e recria os 8 livros com
3 capas de exemplo (livros "A Garota no Trem", "1984", "Torto Arado"),
usando as imagens versionadas em `server/seed-assets/`.
```

- [ ] **Step 3: README — data-testid**

Na seção `## data-testid`, acrescentar ao final da lista de exemplos:
`input-capa`, `preview-capa`, `botao-remover-capa`, `erro-capa`,
`capa-livro-<id>`, `capa-placeholder-<id>`, `botao-adicionar-capa-<id>`,
`botao-trocar-capa-<id>`.

- [ ] **Step 4: Spec — status**

No cabeçalho da spec, trocar `**Status:** Aprovado (design)` por `**Status:** Implementado`.

- [ ] **Step 5: Suíte de verificação final**

```bash
node -e "const r=require('./server/src/books-repo'); const {SEED_BOOKS}=require('./server/src/seed'); r.deleteAllBooks(); r.insertSeed(SEED_BOOKS)"
node -e "const cs=require('./server/src/cover-storage'); cs.limparPasta()"
npm run build -w client
npm run dev -w server &
sleep 2
H="Authorization: Bearer token-de-teste-123"
curl -s -X POST http://localhost:3001/api/test/reset; echo
echo "uploads: $(ls server/uploads | wc -l) (esperado 3)"
curl -s -H "$H" -F "cover=@server/seed-assets/seed-torto-arado.webp" -X POST http://localhost:3001/api/books/6/book-cover \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log('upload:', JSON.parse(s).cover_url))"
curl -s -o /dev/null -w "txt -> %{http_code}\n" -H "$H" -F "cover=@README.md;type=text/plain" -X POST http://localhost:3001/api/books/6/book-cover
curl -s -o /dev/null -w "delete capa -> %{http_code}\n" -H "$H" -X DELETE http://localhost:3001/api/books/6/book-cover
curl -s -o /dev/null -w "delete livro c/ capa -> %{http_code}\n" -H "$H" -X DELETE http://localhost:3001/api/books/1
echo "uploads após excluir livro 1: $(ls server/uploads | wc -l) (esperado 2)"
pkill -f "node --watch src/index.js"
node -e "const r=require('./server/src/books-repo'); const {SEED_BOOKS}=require('./server/src/seed'); r.deleteAllBooks(); r.insertSeed(SEED_BOOKS)"
node -e "const cs=require('./server/src/cover-storage'); cs.limparPasta()"
```
Expected: `uploads: 3`; `upload: /uploads/6-...webp`; `txt -> 400`; `delete capa -> 200`; `delete livro c/ capa -> 204`; `uploads após excluir livro 1: 2`.

- [ ] **Step 6: Commit (você roda)**

```bash
git add README.md docs/superpowers/specs/2026-09-10-upload-capa-livro-design.md
git commit -m "docs: capa do livro no README e spec"
```

---

## Self-Review (feito pelo autor do plano)

**1. Cobertura da spec:**
- Coluna `cover_file` + migração aditiva → Task 1 (Steps 5, 8). ✅
- `cover-storage.js` dono do disco; `books-repo` só banco → Tasks 1, 3. ✅
- `serializeBook` / `cover_url` em toda leitura → Task 3 (Steps 1–3). ✅
- `POST`/`DELETE /api/books/:id/book-cover`, validação de tipo/tamanho/existência → Task 4. ✅
- `GET /uploads/<arquivo>` estático sem auth → Task 4 (Step 2). ✅
- Excluir livro apaga a capa → Task 5. ✅
- `reset` limpa uploads + 3 capas de exemplo → Task 6; assets → Task 2. ✅
- Cliente: `enviarCapa`/`removerCapa` (multipart, não o wrapper JSON) → Task 7. ✅
- Card: exibição + atalho adicionar/trocar/remover → Task 8. ✅
- Formulário: campo capa, preview, remover, `erro-capa` → Task 9. ✅
- Orquestração livro+capa, capa opcional, livro salvo mesmo se a capa falhar → Task 10 (Step 2). ✅
- Layout do card com a capa → Task 11. ✅
- `data-testid` novos → Global Constraints + Tasks 8, 9. ✅
- README + spec → Task 12. ✅

**2. Placeholders:** nenhum "TBD"/"TODO". Os `<n>` e `<arquivo>` nos comandos são valores lidos da saída anterior.

**3. Consistência de tipos:**
- `cover-storage` exporta os nomes usados nas Tasks 4/5/6 (`salvarCapa`, `apagarCapa`, `limparPasta`, `copiarSeedAsset`, `TAMANHO_MAXIMO`, `EXTENSOES_POR_MIME`, `PASTA_UPLOADS`). ✅
- `books-repo` exporta `serializeBook`, `setBookCover`, `clearBookCover` (Task 3 Step 5), consumidos nas Tasks 4/6. ✅
- `setBookCover`/`clearBookCover` devolvem `undefined` para id inexistente — mas as rotas (Task 4) já checaram `getBook` antes, então na prática só recebem id válido. Consistente.
- `enviarCapa` (Task 7) devolve o livro; `salvar` (Task 10) usa `livro.id` do retorno de `criarLivro`/`atualizarLivro`, não de `enviarCapa`. ✅
- `aoSalvar(payload, capa)` (Task 9) ↔ `salvar(payload, capa = {})` (Task 10). Assinaturas batem. ✅
- `aoMudarCapa` prop (Task 8) ↔ `aoMudarCapa={carregar}` (Task 10 Step 3). ✅
- `data-testid` do form usam `-form`/sufixos já estabelecidos; capa usa `input-capa` (form) vs `input-capa-<id>` (card) — sem colisão. ✅

**4. Ambiguidade:** `reset` associa capas por **título** (não por id), então a ordem do seed não importa. O upload no card recarrega a lista inteira (`carregar`) — simples e determinístico, alinhado com o resto da página. O `POST` de capa mantém a capa anterior no disco só até o `setBookCover` — a ordem no handler (salvar nova → apagar velha → gravar no banco) garante que uma falha ao gravar a nova não apaga a existente.
