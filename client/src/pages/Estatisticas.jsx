import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Cabecalho from "../components/Cabecalho.jsx";
import { obterEstatisticas } from "../api/stats.js";
import { FORMATOS, LITERATURAS, rotulo } from "../config.js";

const CORES_ESTANTE = [
  "lombada-lavanda",
  "lombada-rosa",
  "lombada-azul",
  "lombada-pessego",
  "lombada-verde",
];
const ALTURAS_ESTANTE = [62, 82, 48, 70, 58, 90, 65, 76, 52, 68, 58];

function Contagem({ titulo, dados, testid, formatarChave }) {
  const itens = Object.entries(dados || {});
  const rotularChave = formatarChave || ((chave) => chave);
  return (
    <div className="cartao" data-testid={testid}>
      <h3>{titulo}</h3>
      {itens.length === 0 ? (
        <p>Sem dados</p>
      ) : (
        <ul>
          {itens.map(([chave, valor]) => (
            <li key={chave}>
              {rotularChave(chave)}: {valor}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Estatisticas() {
  const [stats, setStats] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    obterEstatisticas()
      .then(setStats)
      .catch((e) => setErro(e.message || "Não foi possível carregar as estatísticas"));
  }, []);

  return (
    <div>
      <Cabecalho />
      <main className="conteudo">
        <div className="topo-pagina">
          <h1>Estatísticas</h1>
          <Link to="/" className="botao-pilula" data-testid="botao-voltar">
            ← Voltar
          </Link>
        </div>
        {erro && (
          <p className="erro" data-testid="erro-estatisticas">
            {erro}
          </p>
        )}
        {stats && (
          <div className="grade-estatisticas">
            <div className="cartao" data-testid="stat-total-lidos">
              <h3>Livros lidos</h3>
              <p className="numero">{stats.totalLidos}</p>
            </div>
            <div className="cartao" data-testid="stat-total-quero-ler">
              <h3>Quero ler</h3>
              <p className="numero">{stats.totalQueroLer}</p>
            </div>
            <div className="cartao" data-testid="stat-paginas-lidas">
              <h3>Páginas lidas</h3>
              <p className="numero">{stats.totalPaginasLidas}</p>
            </div>
            <Contagem titulo="Por gênero" dados={stats.porGenero} testid="stat-por-genero" />
            <Contagem
              titulo="Por formato"
              dados={stats.porFormato}
              testid="stat-por-formato"
              formatarChave={(chave) => rotulo(FORMATOS, chave)}
            />
            <Contagem
              titulo="Por literatura"
              dados={stats.porLiteratura}
              testid="stat-por-literatura"
              formatarChave={(chave) => rotulo(LITERATURAS, chave)}
            />
          </div>
        )}

        <div className="estante" aria-hidden="true">
          {ALTURAS_ESTANTE.map((altura, indice) => (
            <span
              key={indice}
              className={`lombada ${CORES_ESTANTE[indice % CORES_ESTANTE.length]}`}
              style={{ height: `${altura}px` }}
            >
              {(indice === 0 || indice === ALTURAS_ESTANTE.length - 1) && (
                <span className="lombada-brilho">✦</span>
              )}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
