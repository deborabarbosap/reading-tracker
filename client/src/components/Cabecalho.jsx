import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../auth/tokenStorage.js";
import { aplicarTema, obterTemaInicial } from "../tema.js";

export default function Cabecalho() {
  const navigate = useNavigate();
  const [tema, setTema] = useState(obterTemaInicial);

  function sair() {
    clearToken();
    navigate("/login");
  }

  function alternarTema() {
    const novoTema = tema === "escuro" ? "claro" : "escuro";
    aplicarTema(novoTema);
    setTema(novoTema);
  }

  return (
    <header className="cabecalho">
      <Link to="/" className="logo" data-testid="link-inicio">
        Rastreador de <span className="logo-destaque">Leitura</span>
      </Link>
      <nav>
        <Link to="/estatisticas" className="link-nav" data-testid="link-estatisticas">
          Estatísticas
        </Link>
        <button
          type="button"
          className="botao-pilula"
          onClick={alternarTema}
          data-testid="botao-tema"
        >
          {tema === "escuro" ? "Modo claro" : "Modo escuro"}
        </button>
        <button type="button" className="botao-pilula" onClick={sair} data-testid="botao-sair">
          Sair
        </button>
      </nav>
    </header>
  );
}
