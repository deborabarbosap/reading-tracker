const fs = require("node:fs");
const path = require("node:path");

const PASTA_UPLOADS = path.join(__dirname, "..", "uploads");
const PASTA_SEED_ASSETS = path.join(__dirname, "..", "seed-assets");

const EXTENSOES_POR_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const TAMANHO_MAXIMO = 2 * 1024 * 1024;

function garantirPasta() {
  fs.mkdirSync(PASTA_UPLOADS, { recursive: true });
}

function salvarCapa(bookId, buffer, mimetype) {
  garantirPasta();
  const ext = EXTENSOES_POR_MIME[mimetype];
  const nome = `${bookId}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(PASTA_UPLOADS, nome), buffer);
  return nome;
}

function apagarCapa(nome) {
  if (!nome) return;
  try {
    fs.unlinkSync(path.join(PASTA_UPLOADS, nome));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}

function limparPasta() {
  garantirPasta();
  for (const nome of fs.readdirSync(PASTA_UPLOADS)) {
    fs.unlinkSync(path.join(PASTA_UPLOADS, nome));
  }
}

function copiarSeedAsset(nomeOrigem, bookId) {
  garantirPasta();
  const bruta = path.extname(nomeOrigem).slice(1).toLowerCase();
  const ext = bruta === "jpeg" ? "jpg" : bruta;
  const sufixo = Math.random().toString(36).slice(2, 8);
  const nomeDestino = `${bookId}-${Date.now()}-${sufixo}.${ext}`;
  fs.copyFileSync(
    path.join(PASTA_SEED_ASSETS, nomeOrigem),
    path.join(PASTA_UPLOADS, nomeDestino)
  );
  return nomeDestino;
}

module.exports = {
  PASTA_UPLOADS,
  PASTA_SEED_ASSETS,
  EXTENSOES_POR_MIME,
  TAMANHO_MAXIMO,
  garantirPasta,
  salvarCapa,
  apagarCapa,
  limparPasta,
  copiarSeedAsset,
};
