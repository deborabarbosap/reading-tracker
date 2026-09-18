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
  rating: 0,
};

function IconeKindle() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.3em"
      height="1.3em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="6.5" y="4.5" width="11" height="13" rx="0.6" fill="currentColor" fillOpacity="0.18" stroke="none" />
      <circle cx="12" cy="19.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

const ICONES_FORMATO = {
  fisico: "📕",
  ebook: <IconeKindle />,
  audiobook: "🎧",
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
  const temCapaExistente = Boolean(livroInicial && livroInicial.cover_url);

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
      payload.rating = dados.rating || null;
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
      <form className="cartao ficha-leitura" onSubmit={enviar} data-testid="form-livro">
        <div className="ficha-cabecalho">
          <span className="ficha-estrela e1" aria-hidden="true">
            ✦
          </span>
          <span className="ficha-estrela e2" aria-hidden="true">
            ★
          </span>
          <span className="ficha-estrela e3" aria-hidden="true">
            ✧
          </span>
          <span className="ficha-estrela e4" aria-hidden="true">
            ⋆
          </span>
          <h2 className="ficha-titulo">
            Ficha de <span className="ficha-titulo-destaque">Leitura</span>
          </h2>
          <p className="ficha-subtitulo">{ehEdicao ? "Editar livro" : "Novo livro"}</p>
        </div>

        {!statusFixo && (
          <div className="ficha-status">
            <button
              type="button"
              className={`botao-aba ${dados.status === "quero_ler" ? "ativa" : ""}`}
              onClick={() => alterar("status", "quero_ler")}
              data-testid="status-quero-ler"
            >
              Quero ler
            </button>
            <button
              type="button"
              className={`botao-aba ${dados.status === "lido" ? "ativa" : ""}`}
              onClick={() => alterar("status", "lido")}
              data-testid="status-lido"
            >
              Lido
            </button>
          </div>
        )}

        <div className="ficha-corpo">
          <div className="ficha-coluna-esquerda">
            <label className="ficha-capa">
              <span className="ficha-capa-titulo">
                <span aria-hidden="true">📎</span> ‹ Capa do Livro ›
              </span>
              <span className="ficha-capa-area">
                {arquivoCapa ? (
                  <img
                    className="preview-capa"
                    src={URL.createObjectURL(arquivoCapa)}
                    alt="Prévia da capa"
                    data-testid="preview-capa"
                  />
                ) : temCapaExistente && !removerCapaFlag ? (
                  <span className="capa-atual" data-testid="capa-atual">
                    <img src={livroInicial.cover_url} alt="Capa atual" />
                  </span>
                ) : (
                  <span className="ficha-capa-placeholder">Sem capa</span>
                )}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  setArquivoCapa(e.target.files[0] || null);
                  setRemoverCapaFlag(false);
                  setErroCapa("");
                }}
                hidden
                data-testid="input-capa"
              />
            </label>

            {ehLido && (
              <div className="ficha-avaliacao">
                <p className="ficha-avaliacao-titulo">Classificação</p>
                <div className="ficha-estrelas-input" data-testid="input-avaliacao">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`ficha-estrela-botao ${dados.rating >= n ? "preenchida" : ""}`}
                      onClick={() => alterar("rating", dados.rating === n ? 0 : n)}
                      aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                      data-testid={`estrela-${n}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )}
            {ehLido && <ErroCampo campo="rating" />}

            {!arquivoCapa && temCapaExistente && !removerCapaFlag && (
              <button
                type="button"
                className="botao-pilula"
                onClick={() => setRemoverCapaFlag(true)}
                data-testid="botao-remover-capa"
              >
                Remover capa
              </button>
            )}
            {removerCapaFlag && (
              <p className="ficha-aviso" data-testid="capa-marcada-remover">
                A capa será removida ao salvar.
              </p>
            )}
            {erroCapa && (
              <p className="erro" data-testid="erro-capa">
                {erroCapa}
              </p>
            )}
          </div>

          <div className="ficha-coluna-direita">
            <div className="ficha-campo">
              <label htmlFor="campo-titulo" className="ficha-rotulo">
                <span className="ficha-icone ficha-icone-titulo" aria-hidden="true">
                  ✦
                </span>
                Título:
              </label>
              <input
                id="campo-titulo"
                className="ficha-input"
                value={dados.title}
                onChange={(e) => alterar("title", e.target.value)}
                data-testid="input-titulo"
              />
            </div>
            <ErroCampo campo="title" />

            <div className="ficha-campo">
              <label htmlFor="campo-autor" className="ficha-rotulo">
                <span className="ficha-icone ficha-icone-autor" aria-hidden="true">
                  ✎
                </span>
                Autor(a):
              </label>
              <input
                id="campo-autor"
                className="ficha-input"
                value={dados.author}
                onChange={(e) => alterar("author", e.target.value)}
                data-testid="input-autor"
              />
            </div>
            <ErroCampo campo="author" />

            <div className="ficha-campo">
              <label htmlFor="campo-genero" className="ficha-rotulo">
                <span className="ficha-icone ficha-icone-genero" aria-hidden="true">
                  ★
                </span>
                Gênero:
              </label>
              <select
                id="campo-genero"
                className="ficha-input"
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
            </div>
            <ErroCampo campo="genre" />

            <div className="ficha-campo">
              <label htmlFor="campo-literatura" className="ficha-rotulo">
                <span className="ficha-icone ficha-icone-literatura" aria-hidden="true">
                  📚
                </span>
                Literatura:
              </label>
              <select
                id="campo-literatura"
                className="ficha-input"
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
            </div>
            <ErroCampo campo="literature" />

            {ehLido && (
              <div className="ficha-campo">
                <label htmlFor="campo-paginas" className="ficha-rotulo">
                  <span className="ficha-icone ficha-icone-paginas" aria-hidden="true">
                    📖
                  </span>
                  Nº de Páginas:
                </label>
                <input
                  id="campo-paginas"
                  type="number"
                  min="1"
                  className="ficha-input"
                  value={dados.pages}
                  onChange={(e) => alterar("pages", e.target.value)}
                  data-testid="input-paginas"
                />
              </div>
            )}
            {ehLido && <ErroCampo campo="pages" />}
          </div>
        </div>

        {ehLido && (
          <div className="ficha-formato" data-testid="select-formato-form">
            <p className="ficha-formato-titulo">
              <span className="ficha-pilula-selo">Formato de Leitura</span>
            </p>
            <div className="ficha-formato-opcoes">
              {FORMATOS.map((f) => (
                <label
                  key={f.valor}
                  className={`ficha-formato-opcao ${dados.format === f.valor ? "selecionada" : ""}`}
                >
                  <span className="ficha-formato-icone" aria-hidden="true">
                    {ICONES_FORMATO[f.valor]}
                  </span>
                  <span>{f.rotulo}</span>
                  <input
                    type="radio"
                    name="formato"
                    value={f.valor}
                    checked={dados.format === f.valor}
                    onChange={(e) => alterar("format", e.target.value)}
                    data-testid={`opcao-formato-${f.valor}`}
                  />
                </label>
              ))}
            </div>
          </div>
        )}
        {ehLido && <ErroCampo campo="format" />}

        {ehLido && (
          <div className="ficha-datas">
            <div className="ficha-data-box">
              <p className="ficha-data-titulo">
                <span className="ficha-data-icone" aria-hidden="true">
                  📅
                </span>
                Início da Leitura
              </p>
              <input
                type="date"
                value={dados.start_date}
                onChange={(e) => alterar("start_date", e.target.value)}
                data-testid="input-data-inicio"
              />
            </div>
            <div className="ficha-data-box">
              <p className="ficha-data-titulo">
                <span className="ficha-data-icone" aria-hidden="true">
                  📅
                </span>
                Término da Leitura
              </p>
              <input
                type="date"
                value={dados.end_date}
                onChange={(e) => alterar("end_date", e.target.value)}
                data-testid="input-data-fim"
              />
            </div>
          </div>
        )}
        {ehLido && (
          <>
            <ErroCampo campo="start_date" />
            <ErroCampo campo="end_date" />
          </>
        )}

        {erroGeral && (
          <p className="erro" data-testid="erro-formulario">
            {erroGeral}
          </p>
        )}

        <div className="acoes ficha-acoes">
          <button
            type="submit"
            className="botao-primario"
            data-testid="botao-salvar-livro"
            disabled={enviando}
          >
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
