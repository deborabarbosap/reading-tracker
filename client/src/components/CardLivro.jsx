import { useRef, useState } from "react";
import { FORMATOS, LITERATURAS, rotulo } from "../config.js";
import { enviarCapa, removerCapa } from "../api/livros.js";

function formatarData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function CardLivro({ livro, aoEditar, aoExcluir, aoMarcarLido, aoMudarCapa }) {
  const inputRef = useRef(null);
  const [erroCapa, setErroCapa] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function aoEscolherArquivo(evento) {
    const arquivo = evento.target.files[0];
    evento.target.value = "";
    if (!arquivo) return;
    setErroCapa("");
    setOcupado(true);
    try {
      await enviarCapa(livro.id, arquivo);
      if (aoMudarCapa) await aoMudarCapa();
    } catch (e) {
      setErroCapa(e.message || "Não foi possível enviar a capa");
    } finally {
      setOcupado(false);
    }
  }

  async function aoRemoverCapa() {
    setErroCapa("");
    setOcupado(true);
    try {
      await removerCapa(livro.id);
      if (aoMudarCapa) await aoMudarCapa();
    } catch (e) {
      setErroCapa(e.message || "Não foi possível remover a capa");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <article className="card-livro" data-testid={`card-livro-${livro.id}`}>
      <div className="card-livro-conteudo">
        <div className="card-livro-dados">
          <h3>{livro.title}</h3>
          <p className="autor">{livro.author}</p>
          <ul className="detalhes">
            <li>Gênero: {livro.genre}</li>
            <li>Literatura: {rotulo(LITERATURAS, livro.literature)}</li>
            {livro.status === "lido" && (
              <>
                <li>Páginas: {livro.pages}</li>
                <li>Formato: {rotulo(FORMATOS, livro.format)}</li>
                <li>
                  Leitura: {formatarData(livro.start_date)} até {formatarData(livro.end_date)}
                </li>
              </>
            )}
          </ul>
        </div>
        <div className="card-livro-capa">
          {livro.cover_url ? (
            <img
              src={livro.cover_url}
              alt={`Capa de ${livro.title}`}
              data-testid={`capa-livro-${livro.id}`}
            />
          ) : (
            <div className="capa-placeholder" data-testid={`capa-placeholder-${livro.id}`}>
              Sem capa
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        ref={inputRef}
        onChange={aoEscolherArquivo}
        hidden
        data-testid={`input-capa-${livro.id}`}
      />
      {erroCapa && (
        <p className="erro" data-testid={`erro-capa-${livro.id}`}>
          {erroCapa}
        </p>
      )}

      <div className="acoes">
        <button
          type="button"
          onClick={() => aoEditar(livro)}
          data-testid={`botao-editar-${livro.id}`}
        >
          Editar
        </button>
        {livro.status === "quero_ler" && (
          <button
            type="button"
            onClick={() => aoMarcarLido(livro)}
            data-testid={`botao-marcar-lido-${livro.id}`}
          >
            Marcar como lido
          </button>
        )}
        {livro.cover_url ? (
          <>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => inputRef.current.click()}
              data-testid={`botao-trocar-capa-${livro.id}`}
            >
              Trocar capa
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={aoRemoverCapa}
              data-testid={`botao-remover-capa-${livro.id}`}
            >
              Remover capa
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => inputRef.current.click()}
            data-testid={`botao-adicionar-capa-${livro.id}`}
          >
            Adicionar capa
          </button>
        )}
        <button
          type="button"
          className="perigo"
          onClick={() => aoExcluir(livro)}
          data-testid={`botao-excluir-${livro.id}`}
        >
          Excluir
        </button>
      </div>
    </article>
  );
}
