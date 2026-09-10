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
