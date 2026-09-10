import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../auth/tokenStorage.js";

export default function Cabecalho() {
  const navigate = useNavigate();

  function sair() {
    clearToken();
    navigate("/login");
  }

  return (
    <header className="cabecalho">
      <Link to="/" className="logo" data-testid="link-inicio">
        Rastreador de Leitura
      </Link>
      <nav>
        <Link to="/estatisticas" data-testid="link-estatisticas">
          Estatísticas
        </Link>
        <button type="button" onClick={sair} data-testid="botao-sair">
          Sair
        </button>
      </nav>
    </header>
  );
}
