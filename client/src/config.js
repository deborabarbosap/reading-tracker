export const GENEROS = [
  "Thriller Psicológico",
  "Comédia Romântica",
  "Distopia",
  "Romance",
  "Dark Romance",
];

export const LITERATURAS = [
  { valor: "estrangeira", rotulo: "Estrangeira" },
  { valor: "brasileira", rotulo: "Brasileira" },
];

export const FORMATOS = [
  { valor: "fisico", rotulo: "Físico" },
  { valor: "ebook", rotulo: "E-book" },
  { valor: "audiobook", rotulo: "Audiobook" },
];

export function rotulo(lista, valor) {
  const item = lista.find((i) => i.valor === valor);
  return item ? item.rotulo : valor;
}
