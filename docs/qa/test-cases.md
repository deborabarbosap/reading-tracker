# Casos de teste (Gherkin/BDD)

Cenários funcionais derivados das
[regras de negócio](../requirements/business-rules.md) e do
[contrato da API](../api/endpoints.md). Este documento descreve **como
testar**. Os resultados ficam no
[relatório de execução](execution-report.md).

- Cada cenário tem um ID (`CT-XXX`). Em um "Esquema do Cenário", cada
  linha de Exemplos tem o próprio ID (`CT-XXX.N`).
- Tags: `@alta`, `@media` ou `@baixa` indicam a prioridade. `@smoke`
  marca os 8 casos que precisam passar antes de qualquer liberação.
- Pré-condição geral: aplicação rodando e dados em estado conhecido
  (ver [README de QA](README.md#ambiente-e-dados-de-teste)).

## Login e sessão

```gherkin
Funcionalidade: Login e sessão

  @CT-001 @smoke @alta
  Cenário: Login com credenciais válidas
    Dado que estou na tela de login
    Quando informo o usuário "admin" e a senha "admin123"
    E clico em "Entrar"
    Então devo ser redirecionada para a lista de livros

  @CT-002 @alta
  Cenário: Login com senha incorreta
    Dado que estou na tela de login
    Quando informo o usuário "admin" e uma senha incorreta
    E clico em "Entrar"
    Então devo ver a mensagem "Usuário ou senha inválidos"
    E devo permanecer na tela de login

  @CT-003 @media
  Cenário: Login com usuário inexistente
    Dado que estou na tela de login
    Quando informo um usuário que não existe e qualquer senha
    E clico em "Entrar"
    Então devo ver a mensagem "Usuário ou senha inválidos"

  @CT-004 @media
  Cenário: Login com campos vazios
    Dado que estou na tela de login
    Quando clico em "Entrar" sem preencher usuário e senha
    Então devo ver a mensagem "Usuário ou senha inválidos"

  @CT-005 @alta
  Cenário: Acessar a lista sem estar logada
    Dado que não tenho um token salvo
    Quando acesso a URL da lista de livros diretamente
    Então devo ser redirecionada para a tela de login

  @CT-006 @media
  Cenário: Sair da aplicação
    Dado que estou logada e na lista de livros
    Quando clico em "Sair"
    Então devo ser redirecionada para a tela de login
    E ao acessar a lista de livros diretamente, volto para o login
```

## Cadastro de livro

```gherkin
Funcionalidade: Cadastro de livro

  @CT-007 @smoke @alta
  Cenário: Cadastrar livro "quero ler" com dados válidos
    Dado que estou no formulário de novo livro
    Quando preencho título, autor, gênero e literatura
    E seleciono o status "Quero ler"
    E clico em "Salvar"
    Então o livro aparece na aba "Quero ler"

  @CT-008 @smoke @alta
  Cenário: Cadastrar livro "lido" com dados válidos
    Dado que estou no formulário de novo livro
    Quando preencho título, autor, gênero, literatura, páginas, formato,
      data de início e data de fim
    E seleciono o status "Lido"
    E clico em "Salvar"
    Então o livro aparece na aba "Lido"

  @alta
  Esquema do Cenário: CT-009 — Salvar sem um campo sempre obrigatório
    Dado que estou no formulário de novo livro
    Quando deixo o campo "<campo>" em branco
    E clico em "Salvar"
    Então devo ver a mensagem "<mensagem>"
    E o livro não é salvo

    Exemplos:
      | id       | campo      | mensagem                               |
      | CT-009.1 | título     | O campo título é obrigatório           |
      | CT-009.2 | autor      | O campo autor é obrigatório            |
      | CT-009.3 | gênero     | Selecione um gênero válido             |
      | CT-009.4 | literatura | Selecione um tipo de literatura válido |

  @alta
  Esquema do Cenário: CT-010 — Salvar livro "lido" sem um campo condicional
    Dado que estou no formulário de novo livro com status "Lido"
    Quando deixo o campo "<campo>" em branco
    E clico em "Salvar"
    Então devo ver a mensagem "<mensagem>"
    E o livro não é salvo

    Exemplos:
      | id       | campo          | mensagem                                                |
      | CT-010.1 | páginas        | Informe a quantidade de páginas (número maior que zero) |
      | CT-010.2 | formato        | Selecione um formato válido                             |
      | CT-010.3 | data de início | Informe a data de início da leitura                     |
      | CT-010.4 | data de fim    | Informe a data de fim da leitura                        |

  @CT-011 @alta
  Cenário: Data de fim anterior à data de início
    Dado que estou no formulário de novo livro com status "Lido"
    Quando informo uma data de fim anterior à data de início
    E clico em "Salvar"
    Então devo ver a mensagem "A data de fim não pode ser anterior à data de início"
    E o livro não é salvo

  @CT-012 @media
  Cenário: Data de fim igual à data de início
    Dado que estou no formulário de novo livro com status "Lido"
    Quando informo a mesma data para início e fim da leitura
    E clico em "Salvar"
    Então o livro é salvo normalmente

  @media
  Esquema do Cenário: CT-013 — Quantidade de páginas inválida
    Dado que estou no formulário de novo livro com status "Lido"
    Quando informo "<paginas>" no campo de páginas
    E clico em "Salvar"
    Então o envio é bloqueado com uma mensagem no campo "páginas"
    E o livro não é salvo

    Exemplos:
      | id       | paginas |
      | CT-013.1 | 0       |
      | CT-013.2 | -5      |
      | CT-013.3 | 10.5    |

  @CT-014 @baixa
  Cenário: Cancelar o cadastro
    Dado que estou no formulário de novo livro com dados preenchidos
    Quando clico em "Cancelar"
    Então o formulário fecha
    E nenhum livro novo é salvo

  @CT-015 @media
  Cenário: Título preenchido só com espaços
    Dado que estou no formulário de novo livro
    Quando preencho o título só com espaços em branco
    E clico em "Salvar"
    Então devo ver a mensagem "O campo título é obrigatório"
    E o livro não é salvo
```

## Transição de status

```gherkin
Funcionalidade: Transição de status

  @CT-016 @smoke @alta
  Cenário: Marcar livro como lido preenchendo os dados
    Dado que existe um livro com status "quero ler"
    Quando clico em "Marcar como lido" no card do livro
    E preencho páginas, formato, data de início e data de fim
    E salvo
    Então o livro passa a aparecer na aba "Lido"
    E deixa de aparecer na aba "Quero ler"

  @CT-017 @alta
  Cenário: Marcar como lido sem os campos obrigatórios
    Dado que existe um livro com status "quero ler"
    Quando clico em "Marcar como lido" no card do livro
    E salvo sem preencher páginas, formato e datas
    Então devo ver mensagens de erro nos quatro campos
    E o livro continua como "quero ler"

  @CT-018 @media
  Cenário: Mudar o status pela edição do livro
    Dado que existe um livro com status "quero ler"
    Quando clico em "Editar" no card do livro
    E mudo o status para "Lido"
    E preencho páginas, formato, data de início e data de fim
    E salvo
    Então o livro passa a aparecer na aba "Lido"
```

## Filtros, busca e ordenação

```gherkin
Funcionalidade: Filtros, busca e ordenação

  @CT-019 @smoke @alta
  Cenário: Filtrar por status (abas)
    Dado que existem livros "lido" e "quero ler" cadastrados
    Quando seleciono a aba "Lido"
    Então só vejo livros com status "lido"

  @media
  Esquema do Cenário: CT-020 — Filtrar por gênero, formato ou literatura
    Dado que existem livros com diferentes valores de "<filtro>"
    Quando seleciono "<valor>" no filtro "<filtro>"
    Então só vejo livros cujo "<filtro>" é "<valor>"

    Exemplos:
      | id       | filtro     | valor      |
      | CT-020.1 | gênero     | Distopia   |
      | CT-020.2 | formato    | E-book     |
      | CT-020.3 | literatura | Brasileira |

  @CT-021 @media
  Cenário: Buscar texto sem resultado
    Dado que estou na lista de livros
    Quando busco por um texto que não existe em nenhum título ou autor
    Então vejo a mensagem "Nenhum livro encontrado"

  @alta
  Esquema do Cenário: CT-022 — Busca ignora maiúsculas, mas não acentos (BUG-004)
    Dado que estou na aba "Lido" com a massa inicial do reset
    Quando busco por "<termo>"
    Então o resultado é "<resultado>"

    Exemplos:
      | id       | termo     | resultado                              | o que verifica    |
      | CT-022.1 | admiravel | Não encontra "Admirável Mundo Novo" (limitação conhecida — ver BUG-004) | acento não é ignorado |
      | CT-022.2 | ADMIRÁVEL | Encontra "Admirável Mundo Novo"        | maiúsculas são ignoradas |
      | CT-022.3 | orwell    | Encontra "1984"                        | busca também no autor    |

  @CT-023 @media
  Cenário: Ordenar "Lido" do mais recente para o mais antigo
    Dado que estou na aba "Lido"
    Quando seleciono a ordenação "Fim da leitura: mais recentes"
    Então os livros aparecem do fim de leitura mais recente para o mais antigo

  @CT-024 @media
  Cenário: Ordenar "Lido" do mais antigo para o mais recente
    Dado que estou na aba "Lido"
    Quando seleciono a ordenação "Fim da leitura: mais antigos"
    Então os livros aparecem do fim de leitura mais antigo para o mais recente

  @CT-025 @baixa
  Cenário: Ordenação por data não se aplica à aba "Quero ler"
    Dado que estou na aba "Quero ler"
    Então os livros aparecem em ordem alfabética de título
    E não há opção de ordenar por data de fim

  @CT-026 @media
  Cenário: Combinar aba e filtro de gênero
    Dado que estou na aba "Lido"
    Quando seleciono o gênero "Distopia" no filtro
    Então só vejo livros com status "lido" e gênero "Distopia"
```

## Exclusão

```gherkin
Funcionalidade: Excluir livro

  @CT-027 @smoke @alta
  Cenário: Excluir um livro com confirmação
    Dado que existe um livro cadastrado
    Quando clico em "Excluir" no card do livro
    E confirmo a exclusão no modal
    Então o livro deixa de aparecer na lista

  @CT-028 @alta
  Cenário: Cancelar a exclusão
    Dado que existe um livro cadastrado
    Quando clico em "Excluir" no card do livro
    E fecho o modal sem confirmar
    Então o livro continua aparecendo na lista

  @CT-029 @media
  Cenário: Exclusão reflete nas estatísticas
    Dado que existe um livro "lido" cadastrado
    Quando excluo esse livro com confirmação
    E acesso a página de Estatísticas
    Então os totais não incluem mais esse livro
```

## Capa do livro

```gherkin
Funcionalidade: Capa do livro

  @CT-030 @smoke @media
  Cenário: Adicionar capa a um livro sem capa
    Dado que existe um livro sem capa
    Quando envio uma imagem PNG de até 2 MB como capa
    Então a capa passa a aparecer no card do livro

  @CT-031 @media
  Cenário: Trocar a capa de um livro
    Dado que existe um livro com capa
    Quando envio uma nova imagem como capa
    Então a capa antiga é substituída pela nova

  @CT-032 @media
  Cenário: Remover a capa de um livro
    Dado que existe um livro com capa
    Quando clico em "Remover capa"
    Então o card volta a mostrar "Sem capa"

  @CT-033 @media
  Cenário: Enviar arquivo maior que 2 MB
    Dado que estou adicionando uma capa
    Quando seleciono uma imagem maior que 2 MB
    Então devo ver a mensagem "A imagem deve ter no máximo 2 MB"
    E a capa não é salva
    E a API continua respondendo

  @media
  Esquema do Cenário: CT-034 — Enviar tipo de arquivo não suportado
    Dado que estou adicionando uma capa
    Quando seleciono um arquivo do tipo "<tipo>"
    Então devo ver a mensagem "Formato inválido. Use PNG, JPEG ou WEBP"
    E a capa não é salva

    Exemplos:
      | id       | tipo |
      | CT-034.1 | GIF  |
      | CT-034.2 | PDF  |
      | CT-034.3 | SVG  |

  @media
  Esquema do Cenário: CT-035 — Enviar capa JPEG e WEBP
    Dado que estou adicionando uma capa
    Quando envio uma imagem do tipo "<tipo>" de até 2 MB
    Então a capa é salva e aparece no card

    Exemplos:
      | id       | tipo |
      | CT-035.1 | JPEG |
      | CT-035.2 | WEBP |

  @CT-036 @baixa
  Cenário: Enviar capa com exatamente 2 MB
    Dado que estou adicionando uma capa
    Quando seleciono uma imagem com exatamente 2.097.152 bytes
    Então a capa é salva normalmente
```

## Estatísticas

```gherkin
Funcionalidade: Estatísticas

  @CT-037 @smoke @alta
  Cenário: Estatísticas batem com a massa inicial
    Dado que os dados foram recriados com o reset
    Quando acesso a página de Estatísticas
    Então vejo 5 livros lidos, 3 "quero ler" e 1.740 páginas lidas

  @CT-038 @alta
  Cenário: Totais atualizam ao cadastrar livro "lido"
    Dado que anotei os totais da página de Estatísticas
    Quando cadastro um novo livro com status "Lido"
    E volto para a página de Estatísticas
    Então o total de lidos e o total de páginas aumentam de acordo com o livro

  @CT-039 @alta
  Cenário: Estatísticas não contam livros "quero ler"
    Dado que existem livros "quero ler" cadastrados
    Quando acesso a página de Estatísticas
    Então esses livros só entram no total "Quero ler"
    E não entram nas páginas nem nas contagens por gênero, formato ou literatura

  @CT-040 @media
  Cenário: Estatísticas atualizam ao marcar livro como lido
    Dado que anotei os totais da página de Estatísticas
    Quando marco um livro "quero ler" como lido
    E volto para a página de Estatísticas
    Então o total de lidos sobe 1, o total "quero ler" cai 1
    E as páginas do livro entram na soma
```

## Sessões exploratórias

Além dos 40 cenários, cada ciclo reserva tempo para sessões sem roteiro
fixo (`EX-01` a `EX-04`). As missões e o que foi encontrado estão no
[relatório de execução](execution-report.md#4-sessões-exploratórias).