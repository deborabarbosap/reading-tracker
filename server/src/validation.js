const GENRES = ["Thriller Psicológico", "Comédia Romântica", "Distopia", "Romance"];
const LITERATURES = ["estrangeira", "brasileira"];
const FORMATS = ["fisico", "ebook", "audiobook"];
const STATUSES = ["quero_ler", "lido"];

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const ROTULOS = { title: "título", author: "autor" };

function textoObrigatorio(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function validateBook(input) {
  const data = input || {};
  const errors = [];
  const value = {
    status: null,
    title: null,
    author: null,
    genre: null,
    literature: null,
    pages: null,
    format: null,
    start_date: null,
    end_date: null,
  };

  if (!STATUSES.includes(data.status)) {
    errors.push({ field: "status", message: "Status inválido" });
  } else {
    value.status = data.status;
  }

  for (const campo of ["title", "author"]) {
    const v = textoObrigatorio(data[campo]);
    if (!v) {
      errors.push({ field: campo, message: `O campo ${ROTULOS[campo]} é obrigatório` });
    } else {
      value[campo] = v;
    }
  }

  if (!GENRES.includes(data.genre)) {
    errors.push({ field: "genre", message: "Selecione um gênero válido" });
  } else {
    value.genre = data.genre;
  }

  if (!LITERATURES.includes(data.literature)) {
    errors.push({ field: "literature", message: "Selecione um tipo de literatura válido" });
  } else {
    value.literature = data.literature;
  }

  if (value.status === "lido") {
    const pages = Number(data.pages);
    if (!Number.isInteger(pages) || pages <= 0) {
      errors.push({ field: "pages", message: "Informe a quantidade de páginas (número maior que zero)" });
    } else {
      value.pages = pages;
    }

    if (!FORMATS.includes(data.format)) {
      errors.push({ field: "format", message: "Selecione um formato válido" });
    } else {
      value.format = data.format;
    }

    const inicio = typeof data.start_date === "string" && DATA_ISO.test(data.start_date) ? data.start_date : null;
    const fim = typeof data.end_date === "string" && DATA_ISO.test(data.end_date) ? data.end_date : null;

    if (!inicio) {
      errors.push({ field: "start_date", message: "Informe a data de início da leitura" });
    } else {
      value.start_date = inicio;
    }
    if (!fim) {
      errors.push({ field: "end_date", message: "Informe a data de fim da leitura" });
    } else {
      value.end_date = fim;
    }
    if (inicio && fim && fim < inicio) {
      errors.push({ field: "end_date", message: "A data de fim não pode ser anterior à data de início" });
    }
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, value };
}

module.exports = { GENRES, LITERATURES, FORMATS, STATUSES, validateBook };
