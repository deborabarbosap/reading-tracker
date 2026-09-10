import { get, post, put, del } from "./http.js";

function querystring(filtros = {}) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      params.set(chave, valor);
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function listarLivros(filtros) {
  return get(`/api/books${querystring(filtros)}`);
}

export function obterLivro(id) {
  return get(`/api/books/${id}`);
}

export function criarLivro(dados) {
  return post("/api/books", dados);
}

export function atualizarLivro(id, dados) {
  return put(`/api/books/${id}`, dados);
}

export function excluirLivro(id) {
  return del(`/api/books/${id}`);
}
