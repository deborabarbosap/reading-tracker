const CHAVE = "tema";

export function obterTemaInicial() {
  try {
    return localStorage.getItem(CHAVE) === "escuro" ? "escuro" : "claro";
  } catch {
    return "claro";
  }
}

export function aplicarTema(tema) {
  document.documentElement.setAttribute("data-tema", tema);
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    // storage indisponível (modo privado) — ignora
  }
}
