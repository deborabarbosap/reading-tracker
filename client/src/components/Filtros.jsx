import { GENEROS, FORMATOS, LITERATURAS } from "../config.js";

export default function Filtros({ valores, aoAlterar }) {
  function alterar(campo, valor) {
    aoAlterar({ ...valores, [campo]: valor });
  }

  return (
    <div className="filtros" data-testid="filtros">
      <input
        placeholder="Buscar por título ou autor"
        value={valores.search}
        onChange={(e) => alterar("search", e.target.value)}
        data-testid="input-busca"
      />
      <select
        value={valores.genre}
        onChange={(e) => alterar("genre", e.target.value)}
        data-testid="select-genero"
      >
        <option value="">Todos os gêneros</option>
        {GENEROS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <select
        value={valores.format}
        onChange={(e) => alterar("format", e.target.value)}
        data-testid="select-formato"
      >
        <option value="">Todos os formatos</option>
        {FORMATOS.map((f) => (
          <option key={f.valor} value={f.valor}>
            {f.rotulo}
          </option>
        ))}
      </select>
      <select
        value={valores.literature}
        onChange={(e) => alterar("literature", e.target.value)}
        data-testid="select-literatura"
      >
        <option value="">Toda literatura</option>
        {LITERATURAS.map((l) => (
          <option key={l.valor} value={l.valor}>
            {l.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
