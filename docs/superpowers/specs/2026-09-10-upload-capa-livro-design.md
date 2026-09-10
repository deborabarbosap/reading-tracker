# Upload da Capa do Livro — Documento de Design

**Data:** 2026-09-10
**Status:** Aprovado (design)
**Projeto:** Rastreador de Leitura (spec base: `2026-09-10-rastreador-de-leitura-design.md`)

## 1. Objetivo

Permitir que o usuário anexe uma imagem de capa a cada livro — nos livros
novos e nos que já existem sem capa. A capa é **opcional**: um livro sem
capa salva e funciona normalmente.

Como o app é um alvo de treino de automação, o upload de arquivo é um caso
deliberado de exercício (`cy.get(...).selectFile(...)` no Cypress,
`locator.setInputFiles(...)` no Playwright).

## 2. Escopo

### Incluído
- Coluna `cover_file` na tabela `books` (migração aditiva, não destrutiva).
- Endpoints dedicados: `POST /api/books/:id/book-cover` (enviar/trocar),
  `DELETE /api/books/:id/book-cover` (remover).
- Servir a imagem por arquivo estático: `GET /uploads/<arquivo>`.
- Upload por dois caminhos no cliente:
  - dentro do formulário de livro (criar / editar), com preview local
  - atalho direto no card do livro ("Adicionar capa" / "Trocar capa" / "Remover capa")
- Exibição da capa (ou de um placeholder "Sem capa") no card.
- `POST /api/test/reset` esvazia os uploads e recria 8 livros, 3 deles com
  uma capa de exemplo versionada no repo.
- Apagar o arquivo de capa quando o livro é excluído ou a capa é trocada/removida.
- `data-testid` em todos os elementos novos.
- Verificação por `curl` + walkthrough no navegador + `npm run build -w client`.

### Fora de escopo
- Redimensionar / comprimir / gerar miniatura no servidor (guarda como enviado).
- Múltiplas imagens por livro.
- Armazenamento externo (S3, Cloudinary).
- Recorte / edição da imagem no cliente.
- Testes automatizados no repositório (mantém a decisão do projeto).
- Capa como campo obrigatório.

## 3. Stack / dependências

- **`multer`** (nova dependência do `server/`) — middleware padrão de upload
  `multipart/form-data` no Express. Storage em disco.
- Sem dependência de processamento de imagem.
- `client/` não ganha dependência nova (usa `FormData` + `fetch`, já
  disponíveis).

## 4. Modelo de dados

### Coluna nova

| Campo | Tipo | Observação |
|---|---|---|
| `cover_file` | TEXT (nullable) | nome do arquivo em `server/uploads/`, ex.: `9-1737059460123.jpg`. `NULL` = sem capa. |

### Migração

Em `server/src/db.js`, após o `CREATE TABLE IF NOT EXISTS books (...)`,
rodar uma migração idempotente:

```
const colunas = db.prepare("PRAGMA table_info(books)").all().map((c) => c.name);
if (!colunas.includes("cover_file")) {
  db.exec("ALTER TABLE books ADD COLUMN cover_file TEXT");
}
```

Bancos existentes ganham a coluna com valor `NULL` em todas as linhas.
Nenhum dado é perdido.

### Campos derivados na resposta da API

O objeto `book` devolvido por qualquer rota passa a incluir:

- `cover_file`: o nome cru do arquivo, ou `null`
- `cover_url`: `"/uploads/<cover_file>"` quando há capa, senão `null`

`cover_url` é montado na camada de rotas/repo ao serializar o livro, não é
uma coluna. O cliente usa `cover_url` direto em `<img src>`.

## 5. Armazenamento de arquivos

- **Pasta:** `server/uploads/` — criada automaticamente na subida do
  servidor (`fs.mkdirSync(..., { recursive: true })` em `db.js` ou num
  módulo de storage). **Ignorada no git** (`.gitignore`).
- **Nome do arquivo salvo:** `<id-do-livro>-<Date.now()>.<ext>`, onde `ext`
  vem do mimetype (`image/jpeg`→`jpg`, `image/png`→`png`, `image/webp`→`webp`),
  **nunca** do nome original enviado (evita `../` e nomes maliciosos).
- **Troca de capa:** ao enviar uma nova capa para um livro que já tem uma,
  o arquivo antigo é apagado antes de gravar o novo `cover_file`.
- **Remoção / exclusão do livro:** o arquivo é apagado do disco; a falta do
  arquivo (já apagado) nunca causa erro 500 — é tolerada.

### Imagens de exemplo do seed

- **Pasta:** `server/seed-assets/` — **versionada no git**.
- 3 imagens de capa geradas (retângulo colorido com o título do livro),
  uma de cada formato: `.png`, `.jpg`, `.webp`. Cada uma ≤ 100 KB.
- Nomes fixos, ex.: `seed-garota-no-trem.jpg`, `seed-1984.png`,
  `seed-torto-arado.webp`.

## 6. API

Todas as rotas de `book-cover` exigem `Authorization: Bearer token-de-teste-123`.
Respostas de erro no padrão do projeto: `{ "error": "mensagem" }`.

### `POST /api/books/:id/book-cover`

- Content-Type `multipart/form-data`, um único campo de arquivo: `cover`.
- Validação:
  - livro `:id` existe? senão `404 { "error": "Livro não encontrado" }`
  - arquivo presente? senão `400 { "error": "Envie um arquivo de imagem" }`
  - mimetype em `image/png`, `image/jpeg`, `image/webp`? senão
    `400 { "error": "Formato inválido. Use PNG, JPEG ou WEBP" }`
  - tamanho ≤ 2 MB (2 * 1024 * 1024)? senão
    `400 { "error": "A imagem deve ter no máximo 2 MB" }`
- Efeito: apaga a capa anterior (se houver), grava o arquivo novo, atualiza
  `cover_file` e `updated_at`.
- Sucesso: `200` com o livro atualizado (com `cover_file` e `cover_url`).

### `DELETE /api/books/:id/book-cover`

- livro `:id` existe? senão `404`.
- Efeito: apaga `uploads/<cover_file>` (se houver) e seta `cover_file = NULL`,
  atualiza `updated_at`.
- Idempotente: se o livro já não tinha capa, ainda responde `200` com o livro.
- Sucesso: `200` com o livro atualizado.

### `GET /uploads/:arquivo`

- Servido por `express.static` apontando para `server/uploads/`, **sem
  autenticação** (como qualquer imagem `<img>` na web).
- Arquivo inexistente → `404`.
- Montado no `app.js` antes do handler 404.

### Rotas existentes afetadas

- `DELETE /api/books/:id` — passa a apagar também `uploads/<cover_file>` do
  livro antes de remover a linha.
- Toda rota que devolve um livro (`GET /api/books`, `GET /api/books/:id`,
  `POST`, `PUT`) passa a incluir `cover_file` e `cover_url` no objeto — via
  uma função de serialização única no `books-repo` ou numa camada fina.

### Tratamento de erros do multer

O `app.js` (ou o próprio router de book-cover) captura erros do multer:
- `err.code === "LIMIT_FILE_SIZE"` → `400 { "error": "A imagem deve ter no máximo 2 MB" }`
- erro do `fileFilter` (tipo inválido) → `400` com a mensagem de formato
- demais → cai no handler `500` genérico já existente

## 7. Repositório de dados (`books-repo.js`)

Funções novas / alteradas:

- `serializeBook(row)` — recebe uma linha crua, devolve o objeto com
  `cover_url` derivado de `cover_file`. **Todas** as leituras (`listBooks`,
  `getBook`, retornos de `createBook`/`updateBook`) passam por ela.
- `setBookCover(id, filename)` — grava `cover_file`, atualiza `updated_at`,
  devolve o livro serializado (ou `undefined` se o id não existe).
- `clearBookCover(id)` — seta `cover_file = NULL`, atualiza `updated_at`,
  devolve o livro serializado (ou `undefined`).
- `getBook(id)` continua devolvendo o livro (agora serializado) — usado para
  descobrir o `cover_file` atual antes de trocar/remover.
- `deleteBook(id)` — inalterado na assinatura; a limpeza do arquivo é
  responsabilidade da rota (que lê o livro antes de excluir), para manter o
  repo sem dependência de `fs`.

Um módulo separado `server/src/cover-storage.js` concentra o acesso ao
disco: `pastaUploads()`, `salvarCapa(id, buffer|tempPath, ext)`,
`apagarCapa(filename)`, `EXTENSOES_POR_MIME`. As rotas usam esse módulo; o
`books-repo` continua só falando com o banco.

## 8. Fluxo no cliente

### `api/livros.js` — funções novas

- `enviarCapa(id, arquivo)` — monta `FormData` com o campo `cover`, faz
  `POST /api/books/:id/book-cover`. **Não** usa o wrapper JSON `http.js`
  padrão (que fixa `Content-Type: application/json`); usa um `fetch`
  dedicado que injeta só o `Authorization` e deixa o browser definir o
  boundary do multipart. Trata erro no mesmo formato (`{ error }`).
- `removerCapa(id)` — `DELETE /api/books/:id/book-cover` (pode reusar o
  `del` do `http.js`).

### `FormularioLivro.jsx`

- Novo campo "Capa": `<input type="file" accept="image/png,image/jpeg,image/webp" data-testid="input-capa">`.
- Ao escolher arquivo: guarda o `File` em estado e mostra preview
  (`URL.createObjectURL`) num `<img data-testid="preview-capa">`.
- Se `livroInicial` já tem `cover_url`: mostra a capa atual e um botão
  "Remover capa" (`data-testid="botao-remover-capa"`) que marca a intenção
  de remover (aplicada no salvar).
- No `aoSalvar` (a página `ListaLivros` continua dona da orquestração — ver
  abaixo): o formulário entrega, além do payload JSON do livro, o `File`
  escolhido e/ou a flag "remover capa".
- Erros da etapa de capa aparecem em `data-testid="erro-capa"`, sem desfazer
  o livro já salvo.

### `ListaLivros.jsx` — orquestração

`salvar` passa a receber `{ payload, arquivoCapa, removerCapaFlag }`:

1. cria ou edita o livro (JSON) — como hoje
2. se `arquivoCapa`: `await enviarCapa(livro.id, arquivoCapa)`
3. senão se `removerCapaFlag` (só na edição): `await removerCapa(livro.id)`
4. fecha o form, `await carregar()`

Se o passo 2/3 falhar, o erro sobe para o formulário exibir em `erro-capa`;
o livro permanece salvo. (O formulário decide não fechar nesse caso.)

### `CardLivro.jsx` — atalho e exibição

- **Exibição:**
  - com `cover_url`: `<img src={livro.cover_url} data-testid={`capa-livro-${id}`}>`
    — largura fixa ~90px, altura automática, cantos arredondados.
  - sem capa: `<div data-testid={`capa-placeholder-${id}`}>Sem capa</div>` do
    mesmo tamanho.
- **Atalho:** um `<input type="file">` escondido por card + botões:
  - sem capa: "Adicionar capa" (`data-testid={`botao-adicionar-capa-${id}`}`)
  - com capa: "Trocar capa" (`botao-trocar-capa-${id}`) e "Remover capa"
    (`botao-remover-capa-${id}`)
- Clicar em adicionar/trocar dispara o seletor de arquivo; ao escolher,
  envia na hora (`enviarCapa`) e chama um callback `aoMudarCapa` que a
  página usa para recarregar a lista. "Remover capa" chama `removerCapa` +
  o mesmo callback.
- Erro no fluxo do card: faixa de erro no card (`data-testid={`erro-capa-${id}`}`).

### Layout do card

Dados à esquerda (como hoje) · imagem/placeholder à direita · botões
embaixo. Ajuste em `styles.css` (flex row no `.card-livro`).

## 9. Seed e `reset`

`POST /api/test/reset` passa a:

1. apagar todos os livros (como hoje)
2. **esvaziar `server/uploads/`** (apaga todos os arquivos da pasta)
3. recriar os 8 livros do seed (como hoje)
4. copiar as 3 imagens de `server/seed-assets/` para `server/uploads/` com o
   padrão de nome `<id>-<timestamp>.<ext>` e gravar `cover_file` em 3 livros
   `lido`: "A Garota no Trem", "1984", "Torto Arado"

Resultado determinístico: 8 livros, 3 com capa, 5 sem. `uploads/` contém
exatamente 3 arquivos.

## 10. `data-testid` novos

**Formulário:** `input-capa`, `preview-capa`, `capa-atual`, `botao-remover-capa`, `erro-capa`

**Card (com sufixo do id do livro):** `capa-livro-<id>`, `capa-placeholder-<id>`,
`input-capa-<id>`, `botao-adicionar-capa-<id>`, `botao-trocar-capa-<id>`,
`botao-remover-capa-<id>`, `erro-capa-<id>`

## 11. Estrutura de pastas (adições)

```
server/
├── uploads/                 # arquivos enviados (ignorado no git, criado em runtime)
├── seed-assets/             # 3 imagens de exemplo (versionadas)
│   ├── seed-garota-no-trem.jpg
│   ├── seed-1984.png
│   └── seed-torto-arado.webp
└── src/
    ├── cover-storage.js     # acesso ao disco: salvar/apagar capa, extensões por mime
    └── routes/
        └── book-cover.js    # POST e DELETE /api/books/:id/book-cover
client/
└── src/
    ├── api/livros.js        # + enviarCapa, removerCapa
    ├── components/
    │   ├── FormularioLivro.jsx   # + campo capa, preview, remover
    │   └── CardLivro.jsx         # + exibição e atalho de capa
    └── pages/ListaLivros.jsx     # orquestra livro + capa no salvar; callback do card
```

## 12. Verificação (sem framework de teste)

**Servidor (`curl`, com servidor rodando e após `reset`):**
- `curl -s -H "Authorization: Bearer token-de-teste-123" -F "cover=@server/seed-assets/seed-1984.png" -X POST http://localhost:3001/api/books/6/book-cover`
  → `200`, corpo com `cover_url` `/uploads/6-...png`; arquivo existe em `server/uploads/`
- upload de um `.txt` → `400` "Formato inválido..."
- upload de arquivo > 2 MB → `400` "A imagem deve ter no máximo 2 MB"
- `POST .../book-cover` para id inexistente → `404`
- `GET http://localhost:3001/uploads/<arquivo>` → `200`, `Content-Type: image/...`
- `DELETE .../book-cover` → `200`, `cover_file` volta a `null`, arquivo some
- trocar capa duas vezes → só o arquivo mais novo permanece em `uploads/`
- `DELETE /api/books/:id` de livro com capa → arquivo some de `uploads/`
- `POST /api/test/reset` → `uploads/` fica com exatamente 3 arquivos; 3 livros com `cover_url`, 5 com `null`

**Cliente:**
- `npm run build -w client` sem erros
- Walkthrough no navegador: adicionar capa pelo formulário (preview aparece,
  salva, card mostra a imagem); trocar capa pelo atalho do card; remover
  capa (volta o placeholder); tentar `.txt` pelo formulário → `erro-capa`;
  livro sem capa continua salvando

## 13. Riscos / notas

- **Concorrência de nome de arquivo:** `<id>-<Date.now()>` colide só se o
  mesmo livro receber duas capas no mesmo milissegundo — improvável no uso
  real; aceitável para um app de treino.
- **Arquivos órfãos:** se o servidor cair entre gravar o arquivo e atualizar
  o banco, sobra um arquivo sem referência. O `reset` limpa tudo; para o uso
  de treino é suficiente. Não haverá rotina de garbage collection.
- **`express.static` sem auth em `/uploads`:** intencional — imagens são
  públicas como em qualquer site. Nomes são não-adivinháveis (`id-timestamp`)
  mas isso não é um controle de segurança e não precisa ser.
- **Rebase:** este branch parte de `ajustes-1-2-ordenacao-genero`. Se aquele
  for mesclado à `main` primeiro, este segue por cima sem conflito
  esperado (arquivos em comum: `books-repo.js`, `routes/books.js`,
  `ListaLivros.jsx`, `README.md` — mudanças em regiões diferentes).
