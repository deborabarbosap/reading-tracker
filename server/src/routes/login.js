const express = require("express");
const { TOKEN } = require("../middleware/auth");

const CREDENCIAIS = { username: "admin", password: "admin123" };
const router = express.Router();

router.post("/", (req, res) => {
  const { username, password } = req.body || {};
  if (username === CREDENCIAIS.username && password === CREDENCIAIS.password) {
    return res.json({ token: TOKEN });
  }
  res.status(401).json({ error: "Usuário ou senha inválidos" });
});

module.exports = router;
