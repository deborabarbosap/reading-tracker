const TOKEN = "token-de-teste-123";

function requireAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const [esquema, valor] = header.split(" ");
  if (esquema !== "Bearer" || valor !== TOKEN) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

module.exports = { TOKEN, requireAuth };
