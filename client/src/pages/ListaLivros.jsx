import { useCallback, useEffect, useRef, useState } from "react";
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
  enviarCapa,
  removerCapa,
} from "../api/livros.js";

const FILTROS_VAZIOS = { search: "", genre: "", format: "", literature: "" };

export default function ListaLivros() {
  const [aba, setAba] = useState("lido");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [ordenacao, setOrdenacao] = useState("fim_desc");
  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [formAberto, setFormAberto] = useState(false);
  const [livroEmEdicao, setLivroEmEdicao] = useState(null);
  const [statusFixo, setStatusFixo] = useState(null);

  const [livroParaExcluir, setLivroParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const requisicaoRef = useRef(0);

  const carregar = useCallback(async () => {
    const requisicao = ++requisicaoRef.current;
    setCarregando(true);
    setErro("");
    try {
      const criterios = { status: aba, ...filtros };
      if (aba === "lido") criterios.sort = ordenacao;
      const dados = await listarLivros(criterios);
      if (requisicao !== requisicaoRef.current) return;
      setLivros(dados);
    } catch (e) {
      if (requisicao !== requisicaoRef.current) return;
      setErro(e.message || "Não foi possível carregar os livros");
      setLivros([]);
    } finally {
      if (requisicao === requisicaoRef.current) setCarregando(false);
    }
  }, [aba, filtros, ordenacao]);

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

  async function salvar(payload, capa = {}) {
    const editando = Boolean(livroEmEdicao && livroEmEdicao.id);
    const livro = editando
      ? await atualizarLivro(livroEmEdicao.id, payload)
      : await criarLivro(payload);

    try {
      if (capa.arquivo) {
        await enviarCapa(livro.id, capa.arquivo);
      } else if (capa.remover && editando) {
        await removerCapa(livro.id);
      }
    } catch (e) {
      await carregar();
      const err = new Error(e.message || "Não foi possível salvar a capa");
      err.capa = true;
      throw err;
    }

    fecharForm();
    await carregar();
  }

  async function confirmarExclusao() {
    if (excluindo) return;
    setExcluindo(true);
    try {
      await excluirLivro(livroParaExcluir.id);
      setLivroParaExcluir(null);
      await carregar();
    } catch (e) {
      setErro(e.message || "Não foi possível excluir");
      setLivroParaExcluir(null);
    } finally {
      setExcluindo(false);
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

        {aba === "lido" && (
          <label className="ordenacao">
            Ordenar por
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              data-testid="select-ordenacao"
            >
              <option value="fim_desc">Fim da leitura: mais recentes</option>
              <option value="fim_asc">Fim da leitura: mais antigos</option>
            </select>
          </label>
        )}

        {erro && (
          <p className="erro" data-testid="erro-lista">
            {erro}
          </p>
        )}
        {carregando && <p data-testid="carregando">Carregando...</p>}
        {!carregando && !erro && livros.length === 0 && (
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
              aoMudarCapa={carregar}
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
          desabilitado={excluindo}
        />
      )}
    </div>
  );
}
