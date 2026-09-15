# Achados — Ciclo 1

Tudo o que a execução encontrou, em um só lugar:

- **Bug (`BUG`):** o sistema contraria uma regra de negócio.
- **Melhoria (`MEL`):** o comportamento está correto pelas regras, mas
  pode ficar melhor.
- **Risco (`RISCO`):** decisão consciente das regras atuais que pode
  virar problema em outro contexto.

Onde cada achado apareceu: ver o
[relatório de execução](execution-report.md).

## Visão geral

| ID | Tipo | Título | Severidade | Origem | Status |
|---|---|---|---|---|---|
| [BUG-002](#bug-002) | Bug | API cai durante o upload de capa | 🔴 Crítica | CT-033, EX-01 | Aberto |
| [BUG-004](#bug-004) | Bug | Busca não ignora acentos | 🟡 Média | CT-022.1, EX-02 | Aberto |
| [BUG-007](#bug-007) | Bug | Capa com exatamente 2 MB é recusada | 🟢 Baixa | CT-036, EX-01 | Aberto |
| [BUG-008](#bug-008) | Bug | Mensagens de erro não somem ao corrigir o campo | 🟢 Baixa | CT-009, CT-010, EX-03 | Aberto |
| [MEL-01](#melhorias) | Melhoria | Login chama a API com campos vazios | — | CT-004 | Sugerido |
| [MEL-02](#melhorias) | Melhoria | Busca faz uma requisição por letra digitada | — | EX-02 | Sugerido |
| [MEL-03](#melhorias) | Melhoria | Modal de exclusão não fecha com Esc | — | EX-03 | Sugerido |
| [MEL-08](#melhorias) | Melhoria | Busca não remove espaços das pontas | — | EX-02 | Sugerido |
| [MEL-09](#melhorias) | Melhoria | Filtro de formato ativo na aba "Quero ler" | — | CT-020.2 | Sugerido |
| [RISCO-01](#riscos) | Risco | Capa validada só pelo mimetype | — | CT-034.3, EX-01 | Aceito |
| [RISCO-02](#riscos) | Risco | Reset sem autenticação | — | EX-04 | Aceito |
| [RISCO-03](#riscos) | Risco | Credenciais e token fixos | — | EX-04 | Aceito |

> **Sobre os IDs pulados:** os achados foram numerados na ordem em que
> apareceram. Quando o documento de regras chegou, alguns foram
> reclassificados ou descartados, e os números foram mantidos para não
> quebrar referências. Por isso a sequência tem lacunas.

**Severidade:** 🔴 Crítica (derruba o sistema ou perde dados, sem
contorno) · 🟠 Alta (função principal não funciona) · 🟡 Média (funciona
errado, com contorno) · 🟢 Baixa (visual, texto ou usabilidade).

**Ciclo de vida de um bug:** Aberto → Em análise → Corrigido → Retestado
→ Fechado (ou Reaberto, se falhar no reteste).

**Ambiente de todos os bugs:** branch `main`, commit `05df2da`, Chrome
152, Linux, Node.js v24.20.0.

---

## Bugs

### BUG-002

**API cai durante o upload de capa**

| Severidade | Prioridade | Caso | Frequência |
|---|---|---|---|
| 🔴 Crítica | Alta | CT-033 | Intermitente (1 de 2 execuções) |

**Passos para reproduzir**

1. Fazer login e deixar visíveis o terminal do `npm run dev` e a aba Rede
   do DevTools.
2. Cadastrar um livro de teste sem capa.
3. No card, clicar em **Adicionar capa** e enviar um arquivo `.txt`
   (retorna 400).
4. No mesmo livro, enviar um PNG de cerca de 6 MB (retorna 400).
5. Enviar um PNG válido e pequeno (retorna 200, e a capa aparece).
6. Clicar em **Trocar capa** e enviar um PNG com 2 MB + 1 byte
   (2.097.153 bytes).
7. Recarregar a página.

**Esperado:** o passo 6 retorna 400 com "A imagem deve ter no máximo
2 MB", e a API continua respondendo.

**Obtido:** o passo 6 termina com 500 (`ECONNRESET`) e o processo da API
é encerrado. O terminal mostra `node::Assert` e
`Statement::~Statement()` do `better-sqlite3`, seguidos de "Failed
running 'src/index.js'. Waiting for file changes before restarting...".
Depois disso, todas as requisições falham com `ECONNREFUSED` e a
listagem mostra "Erro na requisição" até a API ser reiniciada
manualmente.

**Análise:** o log aponta para o módulo nativo do banco, e não para a
validação de tamanho, que funcionou na segunda execução. As falhas seguintes de
"Trocar capa" e "Remover capa" eram consequência da API fora do ar e não
foram registradas como bugs separados.

**Evidências:** `BUG-002-listagem-erro.png`, `BUG-002-log-servidor.txt`

---

### BUG-004

**Busca não ignora acentos**

| Severidade | Prioridade | Caso | Frequência |
|---|---|---|---|
| 🟡 Média | Média | CT-022.1 | Sempre |

**Passos para reproduzir**

1. Fazer login.
2. Garantir que existe um livro lido com acento no título (ex.:
   "Saboroso Cadáver").
3. Na aba **Lido**, buscar `cadaver` (sem acento).
4. Buscar `cadáver` (com acento).

**Esperado:** o livro aparece nas duas buscas. A regra de negócio diz que
a busca não diferencia maiúsculas nem acentos, e o PO confirmou.

**Obtido:** no passo 3 aparece "Nenhum livro encontrado". O livro só
aparece no passo 4. Maiúsculas são ignoradas (`SABOROSO CADÁVER`
encontra), mas acentos não.

**Análise:** `server/src/books-repo.js` só converte o termo para
minúsculas antes de comparar — não remove acentos. Essa limitação já
está documentada em `business-rules.md`; o comportamento aqui bate com
o que está escrito, não há divergência entre documentação e código. Fica
registrado como bug porque, na prática, quem digitar sem acento não
encontra o livro — mesmo sendo um comportamento conhecido, vale corrigir
(ex.: normalizar acentos dos dois lados da comparação).

**Evidências:** `BUG-004-busca-acento.png`

---

### BUG-007

**Capa com exatamente 2 MB é recusada**

| Severidade | Prioridade | Caso | Frequência |
|---|---|---|---|
| 🟢 Baixa | Baixa | CT-036 | Sempre |

**Passos para reproduzir**

1. Fazer login.
2. Gerar um PNG com exatamente 2.097.152 bytes (2 MB).
3. No card de um livro de teste, clicar em **Adicionar capa** (ou
   **Trocar capa**) e selecionar o arquivo.

**Esperado:** a capa é aceita, porque a regra define o **máximo** como
2 MB.

**Obtido:** a API retorna 400 e o card mostra "A imagem deve ter no
máximo 2 MB".

**Análise:** o limite está sendo tratado como "menor que 2 MB" em vez de
"até 2 MB". Os valores ao redor confirmam: 1,8 MB é aceito, e 2 MB + 1
byte, 2,1 MB e 6 MB são recusados corretamente.

**Evidências:** `BUG-007-limite-2mb.png`

---

### BUG-008

**Mensagens de erro não somem ao corrigir o campo**

| Severidade | Prioridade | Caso | Frequência |
|---|---|---|---|
| 🟢 Baixa | Baixa | CT-009.1 (também em CT-009.2 a CT-009.4 e CT-010.1 a CT-010.4) | Sempre |

**Passos para reproduzir**

1. Fazer login.
2. Clicar em **Adicionar livro**.
3. Sem preencher nada, clicar em **Salvar**.
4. Digitar um título válido no campo **Título**.

**Esperado:** a mensagem "O campo título é obrigatório" some quando o
campo é preenchido, e cada mensagem aparece uma única vez.

**Obtido:** a mensagem continua na tela até o próximo clique em
**Salvar**. Além disso, a primeira mensagem aparece duas vezes: abaixo do
campo e no rodapé do formulário.

**Análise:** não impede o cadastro, mas o usuário não sabe se já
corrigiu o problema.

**Evidências:** `BUG-008-erros-persistentes.png`

---

## Melhorias

Comportamento correto pelas regras atuais, com sugestão de melhoria.

| ID | Descrição | Sugestão | Origem |
|---|---|---|---|
| MEL-01 | O login chama a API mesmo com usuário e senha vazios (recebe 401) | Validar os campos no front antes de enviar | CT-004 |
| MEL-02 | A busca dispara uma requisição a cada letra digitada | Aplicar debounce (ex.: 300 ms) | EX-02 |
| MEL-03 | O modal de confirmação de exclusão não fecha com Esc | Fechar com Esc, como cancelar | EX-03 |
| MEL-08 | Espaços nas pontas do termo não são removidos, e uma busca com espaço a mais pode não encontrar nada | Aplicar `trim()` no termo | EX-02 |
| MEL-09 | O filtro de formato aparece na aba "Quero ler", onde o resultado é sempre vazio (esses livros não têm formato) | Ocultar ou desabilitar o filtro nessa aba | CT-020.2 |

## Riscos

Decisões das regras atuais que são aceitáveis em ambiente de teste, mas
seriam problema fora dele.

| ID | Descrição | Impacto se ignorado | Origem |
|---|---|---|---|
| RISCO-01 | A capa é validada só pelo mimetype enviado pelo navegador, sem checar o conteúdo real (magic bytes). Um texto renomeado para `.png` é aceito | Arquivos que não são imagem gravados no servidor | CT-034.3, EX-01 |
| RISCO-02 | `POST /api/test/reset` não exige autenticação (proposital, para facilitar os testes) | Qualquer pessoa apaga todos os dados, se o endpoint estiver exposto em produção | EX-04 |
| RISCO-03 | Login e token fixos no código (`admin`/`admin123`, `token-de-teste-123`), sem expiração nem múltiplos usuários | Acesso indevido fora do ambiente de teste | EX-04 |

## Como registrar um novo achado

1. Use o próximo número livre do tipo (`BUG-009`, `MEL-10`, `RISCO-04`).
2. Adicione a linha na **Visão geral**.
3. Para bug, crie a seção com passos, esperado × obtido, análise e
   evidência. Para melhoria ou risco, basta a linha na tabela.
4. No [relatório](execution-report.md), coloque o link na coluna
   "Achado" do caso correspondente.