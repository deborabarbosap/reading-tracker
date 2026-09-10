const express = require("express");
const repo = require("../books-repo");
const coverStorage = require("../cover-storage");
const { validateBook } = require("../validation");

const router = express.Router();

router.get("/", (req, res) => {
  const { status, genre, format, literature, search, sort } = req.query;
  res.json(repo.listBooks({ status, genre, format, literature, search, sort }));
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
  const id = Number(req.params.id);
  const livro = repo.getBook(id);
  const removido = repo.deleteBook(id);
  if (!removido) return res.status(404).json({ error: "Livro não encontrado" });
  if (livro && livro.cover_file) coverStorage.apagarCapa(livro.cover_file);
  res.status(204).end();
});

module.exports = router;
