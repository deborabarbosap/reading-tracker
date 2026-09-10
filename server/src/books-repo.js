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
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  // Ordenação: só a aba "Lido" pode ordenar por data de fim da leitura.
  // Nos demais casos (inclusive "Quero ler", que não tem datas), ordena por título.
  let orderBy = "title COLLATE NOCASE";
  if (filters.status === "lido" && filters.sort === "fim_asc") {
    orderBy = "end_date ASC, title COLLATE NOCASE";
  } else if (filters.status === "lido" && filters.sort === "fim_desc") {
    orderBy = "end_date DESC, title COLLATE NOCASE";
  }

  const linhas = db
    .prepare(`SELECT * FROM books ${where} ORDER BY ${orderBy}`)
    .all(params);

  if (!filters.search) return linhas;

  // A busca por texto é feita em JS, não em SQL: o LOWER() do SQLite é só-ASCII
  // (não dobra "COMÉDIA" -> "comédia") e "%"/"_" num LIKE agiriam como curingas.
  // toLowerCase() do JS dobra acentos e includes() trata "%" e "_" como literais.
  const termo = String(filters.search).toLowerCase();
  return linhas.filter(
    (livro) =>
      String(livro.title).toLowerCase().includes(termo) ||
      String(livro.author).toLowerCase().includes(termo)
  );
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
