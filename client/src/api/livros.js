import { get, post, put, del } from "./http.js";
import { getToken } from "../auth/tokenStorage.js";

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

export async function enviarCapa(id, arquivo) {
  const form = new FormData();
  form.append("cover", arquivo);

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`/api/books/${id}/book-cover`, {
    method: "POST",
    headers,
    body: form,
  });

  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    const erro = new Error((dados && dados.error) || "Não foi possível enviar a capa");
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}

export function removerCapa(id) {
  return del(`/api/books/${id}/book-cover`);
}
