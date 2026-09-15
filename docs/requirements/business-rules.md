# Regras de negócio

Este documento descreve as regras de negócio realmente implementadas no
Reading Tracker. Fonte: `server/src/validation.js`, `server/src/books-repo.js`
e `server/src/cover-storage.js`.

## Status do livro

Todo livro tem um `status`: `quero_ler` ou `lido`. Não existe um terceiro
status nem um fluxo de aprovação — a mudança de status acontece editando o
livro (`PUT /api/books/:id`) com o novo valor de `status`.

Não há um endpoint específico de "mover para lido": a edição revalida o
livro inteiro de acordo com o status de destino. Ou seja, ao mudar de
`quero_ler` para `lido`, os campos que passam a ser obrigatórios (ver
abaixo) precisam ser enviados na mesma requisição.

## Campos obrigatórios

Sempre obrigatórios, independente do status:

- `title` (texto não vazio)
- `author` (texto não vazio)
- `genre` (um dos valores fixos, ver abaixo)
- `literature` (um dos valores fixos, ver abaixo)

Obrigatórios **somente quando `status = "lido"`**:

- `pages` — número inteiro maior que zero.
- `format` (um dos valores fixos, ver abaixo).
- `start_date` e `end_date` — data no formato `YYYY-MM-DD`.
- `end_date` não pode ser anterior a `start_date`.

Livros com `status = "quero_ler"` não têm páginas, formato nem datas de
leitura.

## Valores fixos

- **Gêneros:** Thriller Psicológico, Comédia Romântica, Distopia, Romance,
  Dark Romance, Suspense.
- **Literatura:** `estrangeira`, `brasileira`.
- **Formato:** `fisico`, `ebook`, `audiobook`.

Qualquer valor fora dessas listas é rejeitado na validação (400, com
`errors: [{ field, message }]`).

## Capa do livro

- Campo opcional em qualquer status.
- Formatos aceitos: PNG, JPEG, WEBP (validado pelo mimetype enviado).
- Tamanho máximo: 2 MB.
- Ao enviar uma nova capa para um livro que já tinha uma, a capa anterior
  é apagada do disco (`server/uploads/`).
- Ao excluir um livro que tem capa, o arquivo da capa é apagado junto.
- Capas ficam fora do banco de dados (só o nome do arquivo é salvo na
  coluna `cover_file`); os arquivos em si vivem em `server/uploads/`
  (fora do git).

## Busca e ordenação

- A busca por texto (`?search=`) compara `title` e `author`, sem
  diferenciar maiúsculas/minúsculas nem acentuação, e é feita em memória
  (JavaScript), não via `LIKE` do SQLite — o `LOWER()` do SQLite não dobra
  acentos.
- A ordenação por data de fim de leitura (`?sort=fim_asc` / `?sort=fim_desc`)
  só tem efeito quando o filtro `status=lido` também está presente. Em
  qualquer outro caso (incluindo a aba "quero ler", que não tem datas), a
  lista é ordenada por título.

## Estatísticas

Calculadas apenas sobre livros com `status = "lido"`:

- `totalLidos` — quantidade de livros lidos.
- `totalQueroLer` — quantidade de livros com status "quero ler" (não entra
  no cálculo dos demais totais).
- `totalPaginasLidas` — soma de `pages` de todos os livros lidos.
- `porGenero`, `porFormato`, `porLiteratura` — contagem de livros lidos
  agrupada por cada um desses campos.

## Autenticação

- Usuário e senha são fixos no código (`admin` / `admin123`), sem cadastro
  de usuários.
- O login bem-sucedido devolve um token fixo, que deve ser enviado no
  header `Authorization: Bearer <token>` em toda rota protegida.
- Não há expiração de token nem múltiplos usuários.

## Reset de dados de teste

`POST /api/test/reset` apaga todos os livros e uploads e recria uma lista
fixa de 8 livros (5 com status "lido", 3 com status "quero ler"), aplicando
capas de exemplo a 3 desses livros. Não exige autenticação, de propósito,
para facilitar o uso em testes.
