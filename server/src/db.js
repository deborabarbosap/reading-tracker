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

const colunasBooks = db.prepare("PRAGMA table_info(books)").all().map((c) => c.name);
if (!colunasBooks.includes("cover_file")) {
  db.exec("ALTER TABLE books ADD COLUMN cover_file TEXT");
}

module.exports = db;
