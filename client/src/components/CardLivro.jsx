import { FORMATOS, LITERATURAS, rotulo } from "../config.js";

function formatarData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function CardLivro({ livro, aoEditar, aoExcluir, aoMarcarLido }) {
  return (
    <article className="card-livro" data-testid={`card-livro-${livro.id}`}>
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
