# Rastreador de Leitura — Documento de Design

**Data:** 2026-09-10
**Status:** Aprovado (design)

## 1. Objetivo

Aplicação web para registrar livros lidos e livros que ainda se quer ler.

O propósito principal é servir de **alvo de treino para automação de testes**
com Cypress e Playwright. Portanto o app precisa de: formulários, listas,
filtros, CRUD completo, modais de confirmação, estados de erro previsíveis,
um jeito de resetar os dados para um estado conhecido e `data-testid` em todos
os elementos interativos.

Os casos de teste E2E serão escritos pela usuária como exercício. O
repositório **não** inclui testes nem frameworks de teste.

## 2. Escopo

### Incluído
- Login simples com credenciais fixas (`admin` / `admin123`)
- CRUD de livros com dois status: "Quero ler" e "Lido"
- Mover livro de "Quero ler" para "Lido" preenchendo os campos que faltam
- Filtros e busca na lista
- Modal de confirmação antes de excluir
- Tela de estatísticas
- Endpoint de reset/semeadura de dados para testes
- `data-testid` em todos os elementos interativos

### Fora de escopo (por enquanto)
- Cadastro de usuários / múltiplos usuários
- Nota, resenha, data de conclusão isolada (só início e fim de leitura)
- Paginação
- Testes automatizados no repositório
- Investimento em design visual (interface limpa e funcional apenas)
- Deploy / hospedagem

Itens fora de escopo podem ser adicionados em iterações futuras.

## 3. Stack técnica

| Camada | Tecnologia |
|---|---|
| Front-end | React + Vite |
| Back-end | Node.js + Express |
| Banco de dados | SQLite (arquivo único) |
| Idioma da interface | Português |

Estrutura de duas pastas (`client/` e `server/`) rodando juntas em
desenvolvimento. O Vite serve o front na porta `5173` e redireciona chamadas
`/api/*` para o Express na porta `3001`.

## 4. Estrutura de pastas

```
rastreador-de-leitura/
├── package.json          # scripts da raiz (sobe client + server juntos via concurrently)
├── README.md             # como rodar, credenciais, como resetar dados
├── .gitignore            # node_modules, data.sqlite, dist
├── docs/
│   └── superpowers/specs/
│       └── 2026-09-10-rastreador-de-leitura-design.md
├── client/
│   ├── index.html
│   ├── vite.config.js    # proxy /api -> localhost:3001
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # rotas
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── ListaLivros.jsx
│       │   └── Estatisticas.jsx
│       ├── components/
│       │   ├── CardLivro.jsx
│       │   ├── FormularioLivro.jsx    # modal: adicionar / editar / marcar como lido
│       │   ├── ModalConfirmacao.jsx
│       │   ├── Filtros.jsx
│       │   └── Cabecalho.jsx          # título + botão Sair
│       ├── api/
│       │   ├── http.js               # wrapper fetch: injeta token, trata erro
│       │   ├── livros.js
│       │   ├── auth.js
│       │   └── stats.js
│       └── auth/
│           ├── tokenStorage.js       # ler/gravar/apagar token no localStorage
│           └── RotaProtegida.jsx     # redireciona para /login se não houver token
└── server/
    ├── package.json
    ├── data.sqlite       # criado automaticamente; ignorado no git
    └── src/
        ├── index.js      # sobe o Express
        ├── db.js         # abre o SQLite e cria a tabela se não existir
        ├── seed.js       # lista fixa de livros para o reset
        ├── middleware/
        │   └── auth.js   # valida header Authorization
        └── routes/
            ├── login.js
            ├── livros.js
            ├── stats.js
            └── testReset.js
```

### Como roda
1. `npm install` na raiz instala as dependências da raiz, do `client/` e do `server/`.
2. `npm run dev` sobe Express (`3001`) e Vite (`5173`) em paralelo.
3. Abrir `http://localhost:5173`.

### Fluxo de dados
Tela React → função em `client/src/api/` → requisição HTTP `/api/...` →
rota no Express → `db.js` → SQLite → resposta JSON de volta.

Cada unidade tem um propósito único: `db.js` só fala com o banco; as rotas
só traduzem HTTP ↔ banco; os componentes só desenham a tela; `http.js`
centraliza autenticação e tratamento de erro das chamadas.

## 5. Modelo de dados

Uma única tabela `books` no SQLite.

| Campo | Tipo | Obrigatório em "Quero ler" | Obrigatório em "Lido" | Observação |
|---|---|---|---|---|
| `id` | INTEGER | — (automático) | — (automático) | chave primária, autoincremento |
| `status` | TEXT | ✅ | ✅ | `"quero_ler"` ou `"lido"` |
| `title` | TEXT | ✅ | ✅ | título |
| `author` | TEXT | ✅ | ✅ | autor |
| `genre` | TEXT | ✅ | ✅ | lista fixa (ver abaixo) |
| `literature` | TEXT | ✅ | ✅ | `"estrangeira"` ou `"brasileira"` |
| `pages` | INTEGER | — | ✅ | quantidade de páginas |
| `format` | TEXT | — | ✅ | `"fisico"`, `"ebook"` ou `"audiobook"` |
| `start_date` | TEXT | — | ✅ | data de início da leitura (ISO `AAAA-MM-DD` no banco) |
| `end_date` | TEXT | — | ✅ | data de fim da leitura (ISO `AAAA-MM-DD` no banco) |
| `created_at` | TEXT | — (automático) | — (automático) | data/hora de criação (ISO) |
| `updated_at` | TEXT | — (automático) | — (automático) | data/hora da última edição (ISO) |

### Valores fixos

- **`genre`:** `Thriller Psicológico`, `Comédia Romântica`, `Distopia`, `Romance`, `Dark Romance`, `Suspense`
- **`literature`:** `estrangeira`, `brasileira`
- **`format`:** `fisico`, `ebook`, `audiobook`

Na interface esses campos são dropdowns; nunca texto livre.

### Regras de negócio

- Livro em **"Quero ler"** exige: `title`, `author`, `genre`, `literature`.
- Livro em **"Lido"** exige tudo: os anteriores mais `pages`, `format`,
  `start_date`, `end_date`.
- **Mover "Quero ler" → "Lido":** a interface abre o formulário pedindo os
  campos que faltam e envia um `PUT` com o novo `status` e os campos completos.
- Datas são exibidas na interface no formato `DD/MM/AAAA` e armazenadas no
  banco em ISO (`AAAA-MM-DD`).

### Validações no back-end (resposta `400`)

- Campo obrigatório ausente ou vazio para o `status` informado
- `genre`, `literature` ou `format` fora da lista permitida
- `pages` não numérico ou menor/igual a zero
- `end_date` anterior a `start_date`
- `status` diferente de `"quero_ler"` / `"lido"`

Formato de erro: `{ "error": "mensagem legível" }`.

## 6. API

Base: `/api`. Todas as respostas em JSON.

### Autenticação

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| `POST` | `/api/login` | `{ "username", "password" }` | `200 { "token": "token-de-teste-123" }` se `admin`/`admin123`; senão `401 { "error": "Usuário ou senha inválidos" }` |

### Livros — exigem header `Authorization: Bearer token-de-teste-123`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/books` | Lista livros. Query params opcionais: `status`, `genre`, `format`, `literature`, `search` (casa com título ou autor, sem diferenciar maiúsculas). Filtros combinam com E. Ordenação: por padrão por título; com `status=lido`, aceita `sort=fim_desc` (fim da leitura, mais recente primeiro) ou `sort=fim_asc` (mais antigo primeiro). |
| `GET` | `/api/books/:id` | Um livro. `404` se não existir. |
| `POST` | `/api/books` | Cria um livro. Valida as regras do `status`. `201` com o livro criado. |
| `PUT` | `/api/books/:id` | Substitui os dados do livro. Também usado para mover "quero ler" → "lido". Valida as regras do `status` final. `404` se não existir. |
| `DELETE` | `/api/books/:id` | Exclui o livro. `204` sem corpo. `404` se não existir. |

### Estatísticas — exige token

| Método | Rota | Resposta |
|---|---|---|
| `GET` | `/api/stats` | `{ "totalLidos", "totalQueroLer", "totalPaginasLidas", "porGenero": { ... }, "porFormato": { ... }, "porLiteratura": { ... } }`. As contagens por categoria consideram apenas livros com status `lido`. |

### Apoio a testes — sem autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/test/reset` | Apaga todos os livros e recria a lista fixa do `seed.js`. Responde `200 { "ok": true, "inseridos": <n> }`. Fica sem token de propósito, para os testes conseguirem resetar o estado facilmente. |

### Códigos de status usados
`200`, `201`, `204`, `400` (validação), `401` (sem token / token inválido /
login errado), `404` (recurso inexistente).

## 7. Telas do front-end

### 7.1 `/login`
- Campos: usuário, senha. Botão "Entrar".
- Credenciais erradas mostram mensagem "Usuário ou senha inválidos".
- Sucesso: grava o token no `localStorage` e navega para `/`.
- Qualquer rota protegida acessada sem token redireciona para `/login`.

### 7.2 `/` — Lista de livros (tela principal)
- `Cabecalho` com o nome do app e botão "Sair" (apaga o token, volta para `/login`).
- Duas abas: **"Lido"** e **"Quero ler"** — trocam a lista exibida (o status vira filtro).
- `Filtros`: campo de busca (título/autor) e dropdowns de gênero, formato e literatura.
- Botão "Adicionar livro" abre o `FormularioLivro` em modo criação.
- Lista de `CardLivro`. Cada card mostra os dados do livro e os botões
  **Editar** e **Excluir**. Na aba "Quero ler", também **"Marcar como lido"**.
- Estado vazio: mensagem "Nenhum livro encontrado".

### 7.3 `FormularioLivro` (modal)
- Um só componente para três usos: adicionar, editar e marcar como lido.
- Os campos exclusivos de "Lido" (`pages`, `format`, `start_date`, `end_date`)
  só aparecem quando o status selecionado é "Lido".
- Erros de validação aparecem abaixo do campo correspondente.
- Botões "Salvar" e "Cancelar".

### 7.4 `ModalConfirmacao` (exclusão)
- Texto: "Tem certeza que deseja excluir *[título]*?"
- Botões "Confirmar" e "Cancelar". "Confirmar" chama `DELETE` e atualiza a lista.

### 7.5 `/estatisticas`
- Cards com os números de `GET /api/stats`: total lido, total quero ler,
  total de páginas lidas, e contagens por gênero, formato e literatura.
- Link no cabeçalho para voltar à lista.

### Convenção de `data-testid`
Todos os elementos interativos recebem `data-testid`, em português e em
kebab-case. Exemplos:
`input-usuario`, `input-senha`, `botao-entrar`, `mensagem-erro-login`,
`aba-lido`, `aba-quero-ler`, `botao-adicionar-livro`, `input-busca`,
`select-genero`, `select-formato`, `select-literatura`,
`card-livro-<id>`, `botao-editar-<id>`, `botao-excluir-<id>`,
`botao-marcar-lido-<id>`, `form-livro`, `input-titulo`, `input-autor`,
`input-paginas`, `input-data-inicio`, `input-data-fim`,
`botao-salvar-livro`, `botao-cancelar-livro`,
`modal-confirmacao`, `botao-confirmar-exclusao`, `botao-cancelar-exclusao`,
`stat-total-lidos`, `stat-total-quero-ler`, `stat-paginas-lidas`.

## 8. Autenticação (versão simples)

- Credenciais fixas numa constante do servidor: `admin` / `admin123`.
- `POST /api/login` compara e, se bater, devolve um **token fixo**
  (`"token-de-teste-123"`). Não é JWT; é só o suficiente para exercitar o fluxo.
- O front guarda o token no `localStorage` (`tokenStorage.js`) e o envia no
  header `Authorization: Bearer token-de-teste-123` em toda chamada (via `http.js`).
- O middleware `auth.js` responde `401` a qualquer rota de livros/stats sem o
  header correto.
- "Sair" apaga o token e redireciona para `/login`.
- `RotaProtegida.jsx` impede a renderização de telas protegidas sem token.
- Para testes, o login pode ser feito pela interface ou "por atalho",
  gravando o token no `localStorage` antes da navegação.

## 9. Tratamento de erros

- **Back-end:** cada rota valida a entrada e responde com o status adequado e
  `{ "error": "..." }`. Um handler de erro final do Express captura exceções
  não previstas e responde `500 { "error": "Erro interno" }`.
- **Front-end:** `http.js` detecta respostas não-2xx, extrai a mensagem de
  `error` e a repassa para o componente, que a exibe (mensagem no formulário,
  faixa de erro na lista, ou mensagem no login).
- **`404` de rota inexistente** no Express responde JSON, não HTML.

## 10. Dados de semeadura (`seed.js`)

O `POST /api/test/reset` recria uma lista fixa de cerca de 8 livros,
cobrindo variação de gênero, formato e literatura:

- ~5 livros com status `lido`, todos com `pages`, `format`, `start_date`,
  `end_date` preenchidos, distribuídos entre os quatro gêneros, os três
  formatos e os dois tipos de literatura.
- ~3 livros com status `quero_ler`, apenas com `title`, `author`, `genre`,
  `literature`.

Os títulos e autores exatos são definidos na implementação; o importante é a
lista ser estável entre execuções, para que os testes possam afirmar
contagens e textos específicos.

## 11. Testes

O repositório **não contém testes nem frameworks de teste**. A usuária
instala e configura Cypress e Playwright separadamente e escreve os casos de
teste como exercício de aprendizado.

O que o projeto oferece como base para essa automação:
- `POST /api/test/reset` para estado inicial conhecido
- `data-testid` em todos os elementos interativos
- Mensagens de erro e códigos de status previsíveis
- README explicando como rodar o app e como chamar o reset

## 12. README (conteúdo mínimo)

- Pré-requisitos: Node.js 18 ou superior
- `npm install` na raiz
- `npm run dev` e as URLs (`5173` front, `3001` API)
- Credenciais: `admin` / `admin123`
- Como resetar os dados: `curl -X POST http://localhost:3001/api/test/reset`
- Estrutura de pastas resumida
- Lista de valores fixos (gêneros, formatos, tipos de literatura)

## 13. Iterações futuras possíveis

- Cadastro e login real de múltiplos usuários, com estante por usuário
- Nota, resenha e avaliação dos livros lidos
- Paginação e ordenação da lista
- Melhorias visuais / tema
- Importar livros de uma API externa (ex.: Google Books)
- Deploy
