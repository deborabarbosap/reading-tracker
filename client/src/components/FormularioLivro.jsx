import { useState } from "react";
import { GENEROS, FORMATOS, LITERATURAS } from "../config.js";

const VAZIO = {
  status: "quero_ler",
  title: "",
  author: "",
  genre: "",
  literature: "",
  pages: "",
  format: "",
  start_date: "",
  end_date: "",
};

export default function FormularioLivro({ livroInicial, statusFixo, aoSalvar, aoCancelar }) {
  const [dados, setDados] = useState(() => {
    const base = { ...VAZIO, ...(livroInicial || {}) };
    for (const chave of Object.keys(VAZIO)) {
      if (base[chave] === null || base[chave] === undefined) base[chave] = VAZIO[chave];
    }
    if (statusFixo) base.status = statusFixo;
    return base;
  });
  const [errosPorCampo, setErrosPorCampo] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [arquivoCapa, setArquivoCapa] = useState(null);
  const [removerCapaFlag, setRemoverCapaFlag] = useState(false);
  const [erroCapa, setErroCapa] = useState("");

  const ehLido = dados.status === "lido";
  const ehEdicao = Boolean(livroInicial && livroInicial.id);

  function ErroCampo({ campo }) {
    return errosPorCampo[campo] ? (
      <p className="erro" data-testid={`erro-campo-${campo}`}>
        {errosPorCampo[campo]}
      </p>
    ) : null;
  }

  function alterar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErrosPorCampo({});
    setErroGeral("");
    setErroCapa("");
    setEnviando(true);

    const payload = {
      status: dados.status,
      title: dados.title,
      author: dados.author,
      genre: dados.genre,
      literature: dados.literature,
    };
    if (dados.status === "lido") {
      payload.pages = dados.pages === "" ? null : Number(dados.pages);
      payload.format = dados.format;
      payload.start_date = dados.start_date;
      payload.end_date = dados.end_date;
    }

    try {
      await aoSalvar(payload, { arquivo: arquivoCapa, remover: removerCapaFlag });
    } catch (e) {
      if (e.capa) {
        setErroCapa(e.message || "Não foi possível salvar a capa");
      } else if (e.errors && e.errors.length > 0) {
        const mapa = {};
        for (const item of e.errors) mapa[item.field] = item.message;
        setErrosPorCampo(mapa);
        setErroGeral(e.message || "Não foi possível salvar");
      } else {
        setErroGeral(e.message || "Não foi possível salvar");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="overlay" data-testid="overlay-formulario">
      <form className="cartao formulario" onSubmit={enviar} data-testid="form-livro">
        <h2>{ehEdicao ? "Editar livro" : "Novo livro"}</h2>

        {!statusFixo && (
          <label>
            Status
            <select
              value={dados.status}
              onChange={(e) => alterar("status", e.target.value)}
              data-testid="select-status"
            >
              <option value="quero_ler">Quero ler</option>
              <option value="lido">Lido</option>
            </select>
          </label>
        )}

        <label>
          Título
          <input
            value={dados.title}
            onChange={(e) => alterar("title", e.target.value)}
            data-testid="input-titulo"
          />
        </label>
        <ErroCampo campo="title" />

        <label>
          Autor
          <input
            value={dados.author}
            onChange={(e) => alterar("author", e.target.value)}
            data-testid="input-autor"
          />
        </label>
        <ErroCampo campo="author" />

        <label>
          Gênero
          <select
            value={dados.genre}
            onChange={(e) => alterar("genre", e.target.value)}
            data-testid="select-genero-form"
          >
            <option value="">Selecione</option>
            {GENEROS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <ErroCampo campo="genre" />

        <label>
          Literatura
          <select
            value={dados.literature}
            onChange={(e) => alterar("literature", e.target.value)}
            data-testid="select-literatura-form"
          >
            <option value="">Selecione</option>
            {LITERATURAS.map((l) => (
              <option key={l.valor} value={l.valor}>
                {l.rotulo}
              </option>
            ))}
          </select>
        </label>
        <ErroCampo campo="literature" />

        {ehLido && (
          <>
            <label>
              Páginas
              <input
                type="number"
                min="1"
                value={dados.pages}
                onChange={(e) => alterar("pages", e.target.value)}
                data-testid="input-paginas"
              />
            </label>
            <ErroCampo campo="pages" />

            <label>
              Formato
              <select
                value={dados.format}
                onChange={(e) => alterar("format", e.target.value)}
                data-testid="select-formato-form"
              >
                <option value="">Selecione</option>
                {FORMATOS.map((f) => (
                  <option key={f.valor} value={f.valor}>
                    {f.rotulo}
                  </option>
                ))}
              </select>
            </label>
            <ErroCampo campo="format" />

            <label>
              Início da leitura
              <input
                type="date"
                value={dados.start_date}
                onChange={(e) => alterar("start_date", e.target.value)}
                data-testid="input-data-inicio"
              />
            </label>
            <ErroCampo campo="start_date" />

            <label>
              Fim da leitura
              <input
                type="date"
                value={dados.end_date}
                onChange={(e) => alterar("end_date", e.target.value)}
                data-testid="input-data-fim"
              />
            </label>
            <ErroCampo campo="end_date" />
          </>
        )}

        <label>
          Capa (opcional)
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              setArquivoCapa(e.target.files[0] || null);
              setRemoverCapaFlag(false);
              setErroCapa("");
            }}
            data-testid="input-capa"
          />
        </label>

        {arquivoCapa && (
          <img
            className="preview-capa"
            src={URL.createObjectURL(arquivoCapa)}
            alt="Prévia da capa"
            data-testid="preview-capa"
          />
        )}

        {!arquivoCapa && livroInicial && livroInicial.cover_url && !removerCapaFlag && (
          <div className="capa-atual" data-testid="capa-atual">
            <img src={livroInicial.cover_url} alt="Capa atual" />
            <button
              type="button"
              onClick={() => setRemoverCapaFlag(true)}
              data-testid="botao-remover-capa"
            >
              Remover capa
            </button>
          </div>
        )}

        {removerCapaFlag && (
          <p data-testid="capa-marcada-remover">A capa será removida ao salvar.</p>
        )}

        {erroCapa && (
          <p className="erro" data-testid="erro-capa">
            {erroCapa}
          </p>
        )}

        {erroGeral && (
          <p className="erro" data-testid="erro-formulario">
            {erroGeral}
          </p>
        )}

        <div className="acoes">
          <button type="submit" data-testid="botao-salvar-livro" disabled={enviando}>
            {enviando ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" onClick={aoCancelar} data-testid="botao-cancelar-livro">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
