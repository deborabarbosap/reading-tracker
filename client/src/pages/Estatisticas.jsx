import { useEffect, useState } from "react";
import Cabecalho from "../components/Cabecalho.jsx";
import { obterEstatisticas } from "../api/stats.js";

function Contagem({ titulo, dados, testid }) {
  const itens = Object.entries(dados || {});
  return (
    <div className="cartao" data-testid={testid}>
      <h3>{titulo}</h3>
      {itens.length === 0 ? (
        <p>Sem dados</p>
      ) : (
        <ul>
          {itens.map(([chave, valor]) => (
            <li key={chave}>
              {chave}: {valor}
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
        <h1>Estatísticas</h1>
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
            <Contagem titulo="Por formato" dados={stats.porFormato} testid="stat-por-formato" />
            <Contagem titulo="Por literatura" dados={stats.porLiteratura} testid="stat-por-literatura" />
          </div>
        )}
      </main>
    </div>
  );
}
