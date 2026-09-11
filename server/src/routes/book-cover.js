const express = require("express");
const multer = require("multer");
const repo = require("../books-repo");
const coverStorage = require("../cover-storage");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: coverStorage.TAMANHO_MAXIMO },
  fileFilter: (req, file, cb) => {
    if (coverStorage.EXTENSOES_POR_MIME[file.mimetype]) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error("Formato inválido. Use PNG, JPEG ou WEBP"), {
          status: 400,
        })
      );
    }
  },
});

router.post("/:id/book-cover", upload.single("cover"), (req, res) => {
  const id = Number(req.params.id);
  const livro = repo.getBook(id);
  if (!livro) return res.status(404).json({ error: "Livro não encontrado" });
  if (!req.file) return res.status(400).json({ error: "Envie um arquivo de imagem" });

  const nome = coverStorage.salvarCapa(id, req.file.buffer, req.file.mimetype);
  if (livro.cover_file) coverStorage.apagarCapa(livro.cover_file);
  res.json(repo.setBookCover(id, nome));
});

router.delete("/:id/book-cover", (req, res) => {
  const id = Number(req.params.id);
  const livro = repo.getBook(id);
  if (!livro) return res.status(404).json({ error: "Livro não encontrado" });
  if (livro.cover_file) coverStorage.apagarCapa(livro.cover_file);
  res.json(repo.clearBookCover(id));
});

// Erros do upload: tamanho (multer) e tipo (fileFilter)
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "A imagem deve ter no máximo 2 MB" });
  }
  if (err && err.status === 400) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
