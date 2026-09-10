export default function ModalConfirmacao({ mensagem, aoConfirmar, aoCancelar, desabilitado }) {
  return (
    <div className="overlay" data-testid="modal-confirmacao">
      <div className="cartao">
        <p>{mensagem}</p>
        <div className="acoes">
          <button
            type="button"
            className="perigo"
            onClick={aoConfirmar}
            disabled={desabilitado}
            data-testid="botao-confirmar-exclusao"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={aoCancelar}
            data-testid="botao-cancelar-exclusao"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
