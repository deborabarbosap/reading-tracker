# API — Reading Tracker

Base: `/api`. Servidor Express na porta `3001` (configurável via variável
de ambiente `PORT`).

Autenticação: header `Authorization: Bearer <token>`. O token é fixo
(`token-de-teste-123`, ver `server/src/middleware/auth.js`) e é exigido em
todas as rotas de livros e estatísticas. `POST /api/login` e
`POST /api/test/reset` **não** exigem autenticação, de propósito.

Formato de erro padrão: `{ "error": "mensagem" }`. Erros de validação de
livro incluem também `{ "errors": [{ "field": "...", "message": "..." }] }`
(uma entrada por campo inválido).

---

## POST /api/login

Autentica e devolve o token fixo.

- **Autenticação:** nenhuma.
- **Payload:** `{ "username": "admin", "password": "admin123" }`.
- **Resposta (200):** `{ "token": "token-de-teste-123" }`.
- **Resposta (401):** `{ "error": "Usuário ou senha inválidos" }` quando
  usuário/senha não conferem.

## GET /api/books

Lista livros, com filtros opcionais via query string.

- **Autenticação:** obrigatória.
- **Parâmetros de query:**
  - `status` — `quero_ler` ou `lido`.
  - `genre`, `format`, `literature` — filtro exato por um dos valores
    fixos (ver `docs/requirements/business-rules.md`).
  - `search` — busca por texto em título/autor (case/acento-insensível).
  - `sort` — `fim_asc` ou `fim_desc`; só tem efeito combinado com
    `status=lido` (ordena por `end_date`). Sem esse combo, a lista é
    ordenada por título.
- **Resposta (200):** array de livros (ver formato do livro abaixo).

## GET /api/books/:id

Retorna um livro específico.

- **Autenticação:** obrigatória.
- **Resposta (200):** objeto do livro.
- **Resposta (404):** `{ "error": "Livro não encontrado" }`.

**Formato do livro** (resposta de todas as rotas de livro):

```json
{
  "id": 1,
  "status": "lido",
  "title": "1984",
  "author": "George Orwell",
  "genre": "Distopia",
  "literature": "estrangeira",
  "pages": 416,
  "format": "ebook",
  "start_date": "2026-02-01",
  "end_date": "2026-02-18",
  "cover_file": "1-1234567890.png",
  "cover_url": "/uploads/1-1234567890.png",
  "created_at": "2026-02-01T10:00:00.000Z",
  "updated_at": "2026-02-18T10:00:00.000Z"
}
```

`cover_file`/`cover_url` são `null` quando o livro não tem capa.

## POST /api/books

Cria um livro.

- **Autenticação:** obrigatória.
- **Payload:** campos do livro (ver regras de negócio para obrigatoriedade
  por status).
- **Resposta (201):** livro criado.
- **Resposta (400):** validação falhou — `{ "error", "errors": [...] }`.

## PUT /api/books/:id

Edita um livro — inclusive a transição de "quero ler" para "lido" (basta
enviar o novo `status` junto com os campos que passam a ser obrigatórios).

- **Autenticação:** obrigatória.
- **Payload:** mesmas regras de `POST`.
- **Resposta (200):** livro atualizado.
- **Resposta (400):** validação falhou.
- **Resposta (404):** livro não encontrado.

## DELETE /api/books/:id

Exclui um livro. Se o livro tiver capa, o arquivo da capa também é
apagado do disco.

- **Autenticação:** obrigatória.
- **Resposta (204):** sem corpo.
- **Resposta (404):** `{ "error": "Livro não encontrado" }`.

## POST /api/books/:id/book-cover

Envia ou troca a capa de um livro.

- **Autenticação:** obrigatória.
- **Parâmetros:** `:id` do livro.
- **Payload:** `multipart/form-data`, campo de arquivo `cover`.
- **Regras:** PNG/JPEG/WEBP, no máximo 2 MB. Capa anterior (se houver) é
  apagada do disco.
- **Resposta (200):** livro atualizado (com `cover_file`/`cover_url`
  novos).
- **Resposta (400):** `{ "error": "Envie um arquivo de imagem" }` (sem
  arquivo), `{ "error": "Formato inválido. Use PNG, JPEG ou WEBP" }`
  (mimetype não aceito) ou `{ "error": "A imagem deve ter no máximo 2 MB" }`
  (arquivo grande demais).
- **Resposta (404):** livro não encontrado.

## DELETE /api/books/:id/book-cover

Remove a capa de um livro (o livro continua existindo, só sem capa).

- **Autenticação:** obrigatória.
- **Resposta (200):** livro atualizado (`cover_file`/`cover_url` como
  `null`).
- **Resposta (404):** livro não encontrado.

## GET /uploads/:arquivo

Serve o arquivo de imagem da capa (estático, via `express.static`).

- **Autenticação:** nenhuma (rota pública, de propósito — é só uma
  imagem).

## GET /api/stats

Totais e contagens (ver regras de negócio para o que entra em cada
campo).

- **Autenticação:** obrigatória.
- **Resposta (200):**

```json
{
  "totalLidos": 5,
  "totalQueroLer": 3,
  "totalPaginasLidas": 1740,
  "porGenero": { "Distopia": 2, "Thriller Psicológico": 1 },
  "porFormato": { "fisico": 2, "ebook": 2 },
  "porLiteratura": { "estrangeira": 4, "brasileira": 1 }
}
```

## POST /api/test/reset

Reseta o banco para um estado conhecido — pensado para uso em testes
automatizados/manuais, não para uso normal da aplicação.

- **Autenticação:** nenhuma, de propósito.
- **Efeito:** apaga todos os livros e todos os uploads; recria 8 livros
  fixos (5 "lido" + 3 "quero ler") e aplica 3 capas de exemplo
  (`server/seed-assets/`) aos livros "A Garota no Trem", "1984" e "Torto
  Arado".
- **Resposta (200):** `{ "ok": true, "inseridos": 8 }`.
