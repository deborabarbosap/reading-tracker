import { useCallback, useEffect, useState } from "react";
import Cabecalho from "../components/Cabecalho.jsx";
import Filtros from "../components/Filtros.jsx";
import CardLivro from "../components/CardLivro.jsx";
import FormularioLivro from "../components/FormularioLivro.jsx";
import ModalConfirmacao from "../components/ModalConfirmacao.jsx";
import {
  listarLivros,
  criarLivro,
  atualizarLivro,
  excluirLivro,
} from "../api/livros.js";

const FILTROS_VAZIOS = { search: "", genre: "", format: "", literature: "" };

export default function ListaLivros() {
  const [aba, setAba] = useState("lido");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [formAberto, setFormAberto] = useState(false);
  const [livroEmEdicao, setLivroEmEdicao] = useState(null);
  const [statusFixo, setStatusFixo] = useState(null);

  const [livroParaExcluir, setLivroParaExcluir] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const dados = await listarLivros({ status: aba, ...filtros });
      setLivros(dados);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os livros");
    } finally {
      setCarregando(false);
    }
  }, [aba, filtros]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirNovo() {
    setLivroEmEdicao(null);
    setStatusFixo(null);
    setFormAberto(true);
  }

  function abrirEdicao(livro) {
    setLivroEmEdicao(livro);
    setStatusFixo(null);
    setFormAberto(true);
  }

  function abrirMarcarLido(livro) {
    setLivroEmEdicao(livro);
    setStatusFixo("lido");
    setFormAberto(true);
  }

  function fecharForm() {
    setFormAberto(false);
    setLivroEmEdicao(null);
    setStatusFixo(null);
  }

  async function salvar(payload) {
    if (livroEmEdicao && livroEmEdicao.id) {
      await atualizarLivro(livroEmEdicao.id, payload);
    } else {
      await criarLivro(payload);
    }
    fecharForm();
    await carregar();
  }

  async function confirmarExclusao() {
    try {
      await excluirLivro(livroParaExcluir.id);
      setLivroParaExcluir(null);
      await carregar();
    } catch (e) {
      setErro(e.message || "Não foi possível excluir");
      setLivroParaExcluir(null);
    }
  }

  return (
    <div>
      <Cabecalho />
      <main className="conteudo">
        <div className="abas">
          <button
            type="button"
            className={aba === "lido" ? "ativa" : ""}
            onClick={() => setAba("lido")}
            data-testid="aba-lido"
          >
            Lido
          </button>
          <button
            type="button"
            className={aba === "quero_ler" ? "ativa" : ""}
            onClick={() => setAba("quero_ler")}
            data-testid="aba-quero-ler"
          >
            Quero ler
          </button>
        </div>

        <div className="barra-acoes">
          <Filtros valores={filtros} aoAlterar={setFiltros} />
          <button type="button" onClick={abrirNovo} data-testid="botao-adicionar-livro">
            Adicionar livro
          </button>
        </div>

        {erro && (
          <p className="erro" data-testid="erro-lista">
            {erro}
          </p>
        )}
        {carregando && <p data-testid="carregando">Carregando...</p>}
        {!carregando && livros.length === 0 && (
          <p data-testid="lista-vazia">Nenhum livro encontrado</p>
        )}

        <div className="lista-livros" data-testid="lista-livros">
          {livros.map((livro) => (
            <CardLivro
              key={livro.id}
              livro={livro}
              aoEditar={abrirEdicao}
              aoExcluir={setLivroParaExcluir}
              aoMarcarLido={abrirMarcarLido}
            />
          ))}
        </div>
      </main>

      {formAberto && (
        <FormularioLivro
          livroInicial={livroEmEdicao}
          statusFixo={statusFixo}
          aoSalvar={salvar}
          aoCancelar={fecharForm}
        />
      )}

      {livroParaExcluir && (
        <ModalConfirmacao
          mensagem={`Tem certeza que deseja excluir "${livroParaExcluir.title}"?`}
          aoConfirmar={confirmarExclusao}
          aoCancelar={() => setLivroParaExcluir(null)}
        />
      )}
    </div>
  );
}
