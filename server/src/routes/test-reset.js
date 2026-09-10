const express = require("express");
const repo = require("../books-repo");
const { SEED_BOOKS } = require("../seed");

const router = express.Router();

router.post("/reset", (req, res) => {
  repo.deleteAllBooks();
  const inseridos = repo.insertSeed(SEED_BOOKS);
  res.json({ ok: true, inseridos });
});

module.exports = router;
