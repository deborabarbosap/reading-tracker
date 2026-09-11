const express = require("express");
const cors = require("cors");
const { requireAuth } = require("./middleware/auth");
const loginRouter = require("./routes/login");
const booksRouter = require("./routes/books");
const bookCoverRouter = require("./routes/book-cover");
const statsRouter = require("./routes/stats");
const testResetRouter = require("./routes/test-reset");
const coverStorage = require("./cover-storage");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(coverStorage.PASTA_UPLOADS));

app.use("/api/login", loginRouter);
app.use("/api/test", testResetRouter);
app.use("/api/books", requireAuth, bookCoverRouter);
app.use("/api/books", requireAuth, booksRouter);
app.use("/api/stats", requireAuth, statsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido no corpo da requisição" });
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});

module.exports = app;
