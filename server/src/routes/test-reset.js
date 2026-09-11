const express = require("express");
const repo = require("../books-repo");
const coverStorage = require("../cover-storage");
const { SEED_BOOKS } = require("../seed");

const router = express.Router();

const CAPAS_SEED = {
  "A Garota no Trem": "seed-garota-no-trem.jpg",
  "1984": "seed-1984.png",
  "Torto Arado": "seed-torto-arado.webp",
};

router.post("/reset", (req, res) => {
  repo.deleteAllBooks();
  coverStorage.limparPasta();
  const inseridos = repo.insertSeed(SEED_BOOKS);

  for (const livro of repo.listBooks()) {
    const asset = CAPAS_SEED[livro.title];
    if (asset) {
      const nome = coverStorage.copiarSeedAsset(asset, livro.id);
      repo.setBookCover(livro.id, nome);
    }
  }

  res.json({ ok: true, inseridos });
});

module.exports = router;
