const CHAVE = "token";

export function getToken() {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(CHAVE, token);
  } catch {
    // storage indisponível (modo privado) — ignora
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // ignora
  }
}
