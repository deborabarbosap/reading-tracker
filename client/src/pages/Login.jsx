import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth.js";
import { setToken } from "../auth/tokenStorage.js";

export default function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const { token } = await login(usuario, senha);
      setToken(token);
      navigate("/");
    } catch (e) {
      setErro(e.message || "Não foi possível entrar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="tela-login">
      <form className="cartao" onSubmit={aoEnviar} data-testid="form-login">
        <h1>
          Rastreador de <span className="logo-destaque">Leitura</span>
        </h1>
        <label>
          Usuário
          <input
            data-testid="input-usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            data-testid="input-senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {erro && (
          <p className="erro" data-testid="mensagem-erro-login">
            {erro}
          </p>
        )}
        <button
          type="submit"
          className="botao-primario"
          data-testid="botao-entrar"
          disabled={enviando}
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
