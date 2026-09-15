# Casos de teste (Gherkin/BDD)

Cenários funcionais dos principais fluxos da aplicação, derivados das
regras documentadas em `docs/requirements/business-rules.md` e
`docs/api/endpoints.md`. Este documento cobre o **desenho** dos casos —
ainda não há registro de execução nem resultados (isso é uma próxima
etapa, quando a execução — manual ou automatizada — de fato acontecer).

## Login

```gherkin
Funcionalidade: Login

  Cenário: Login com credenciais válidas
    Dado que estou na tela de login
    Quando informo o usuário "admin" e a senha "admin123"
    E clico em "Entrar"
    Então devo ser redirecionado para a lista de livros

  Cenário: Login com senha incorreta
    Dado que estou na tela de login
    Quando informo o usuário "admin" e uma senha incorreta
    E clico em "Entrar"
    Então devo ver a mensagem "Usuário ou senha inválidos"
    E devo permanecer na tela de login

  Cenário: Login com usuário inexistente
    Dado que estou na tela de login
    Quando informo um usuário que não existe e qualquer senha
    E clico em "Entrar"
    Então devo ver a mensagem "Usuário ou senha inválidos"

  Cenário: Login com campos vazios
    Dado que estou na tela de login
    Quando clico em "Entrar" sem preencher usuário e senha
    Então devo ver a mensagem "Usuário ou senha inválidos"
```

## Cadastro de livro

```gherkin
Funcionalidade: Cadastro de livro

  Cenário: Cadastrar livro "quero ler" com dados válidos
    Dado que estou no formulário de novo livro
    Quando preencho título, autor, gênero e literatura
    E seleciono o status "quero ler"
    E clico em "Salvar"
    Então o livro aparece na aba "Quero ler"

  Cenário: Cadastrar livro "lido" com dados válidos
    Dado que estou no formulário de novo livro
    Quando preencho título, autor, gênero, literatura, páginas, formato,
      data de início e data de fim
    E seleciono o status "lido"
    E clico em "Salvar"
    Então o livro aparece na aba "Lido"

  Esquema do Cenário: Tentar salvar sem um campo sempre obrigatório
    Dado que estou no formulário de novo livro
    Quando deixo o campo "<campo>" em branco
    E clico em "Salvar"
    Então devo ver uma mensagem de erro no campo "<campo>"
    E o livro não é salvo

    Exemplos:
      | campo      |
      | título     |
      | autor      |
      | gênero     |
      | literatura |

  Esquema do Cenário: Tentar salvar um livro "lido" sem um campo condicional
    Dado que estou no formulário de novo livro com status "lido"
    Quando deixo o campo "<campo>" em branco
    E clico em "Salvar"
    Então devo ver uma mensagem de erro no campo "<campo>"
    E o livro não é salvo

    Exemplos:
      | campo          |
      | páginas        |
      | formato        |
      | data de início |
      | data de fim    |

  Cenário: Data de fim anterior à data de início
    Dado que estou no formulário de novo livro com status "lido"
    Quando informo uma data de fim anterior à data de início
    E clico em "Salvar"
    Então devo ver a mensagem "A data de fim não pode ser anterior à data de início"
    E o livro não é salvo
```

## Transição de status ("quero ler" → "lido")

```gherkin
Funcionalidade: Mover livro para "lido"

  Cenário: Mover um livro de "quero ler" para "lido" preenchendo os dados
    Dado que existe um livro com status "quero ler"
    Quando edito o livro, mudo o status para "lido"
    E preencho páginas, formato, data de início e data de fim
    E salvo
    Então o livro passa a aparecer na aba "Lido"
    E deixa de aparecer na aba "Quero ler"

  Cenário: Tentar mover para "lido" sem preencher os novos campos obrigatórios
    Dado que existe um livro com status "quero ler"
    Quando edito o livro e mudo o status para "lido"
    E não preencho páginas, formato nem as datas
    E salvo
    Então devo ver mensagens de erro nos campos faltantes
    E o livro permanece como "quero ler"
```

## Filtros, busca e ordenação

```gherkin
Funcionalidade: Filtros, busca e ordenação

  Cenário: Filtrar por status
    Dado que existem livros "lido" e "quero ler" cadastrados
    Quando seleciono a aba "Lido"
    Então só vejo livros com status "lido"

  Esquema do Cenário: Filtrar por gênero, formato ou literatura
    Dado que existem livros com diferentes valores de "<filtro>"
    Quando seleciono o valor "<valor>" no filtro "<filtro>"
    Então só vejo livros cujo "<filtro>" é "<valor>"

    Exemplos:
      | filtro     | valor      |
      | gênero     | Distopia   |
      | formato    | ebook      |
      | literatura | brasileira |

  Cenário: Buscar por texto sem resultado
    Dado que estou na lista de livros
    Quando busco por um texto que não existe em nenhum título ou autor
    Então a lista aparece vazia

  Cenário: Ordenar a aba "Lido" por data de fim
    Dado que estou na aba "Lido"
    Quando seleciono a ordenação "mais recente primeiro"
    Então os livros aparecem ordenados por data de fim, do mais recente
      para o mais antigo

  Cenário: Ordenação não se aplica à aba "Quero ler"
    Dado que estou na aba "Quero ler"
    Então os livros aparecem ordenados por título
    E não há opção de ordenar por data de fim
```

## Exclusão de livro

```gherkin
Funcionalidade: Excluir livro

  Cenário: Excluir um livro com confirmação
    Dado que existe um livro cadastrado
    Quando clico em "Excluir" no card do livro
    E confirmo a exclusão no modal
    Então o livro deixa de aparecer na lista

  Cenário: Cancelar a exclusão
    Dado que existe um livro cadastrado
    Quando clico em "Excluir" no card do livro
    E fecho o modal sem confirmar
    Então o livro continua aparecendo na lista

  Cenário: Exclusão reflete nas estatísticas
    Dado que existe um livro "lido" cadastrado
    Quando excluo esse livro com confirmação
    E acesso a página de Estatísticas
    Então os totais não incluem mais esse livro
```

## Capa do livro

```gherkin
Funcionalidade: Capa do livro

  Cenário: Adicionar capa a um livro sem capa
    Dado que existe um livro sem capa
    Quando envio uma imagem PNG de até 2 MB como capa
    Então a capa passa a aparecer no card do livro

  Cenário: Trocar a capa de um livro
    Dado que existe um livro com capa
    Quando envio uma nova imagem como capa
    Então a capa antiga é substituída pela nova

  Cenário: Remover a capa de um livro
    Dado que existe um livro com capa
    Quando clico em "Remover capa"
    Então o card volta a mostrar o espaço reservado sem imagem

  Cenário: Tentar enviar um arquivo maior que 2 MB
    Dado que estou adicionando uma capa
    Quando seleciono um arquivo de imagem maior que 2 MB
    Então devo ver a mensagem "A imagem deve ter no máximo 2 MB"
    E a capa não é salva

  Esquema do Cenário: Tentar enviar um tipo de arquivo não suportado
    Dado que estou adicionando uma capa
    Quando seleciono um arquivo do tipo "<tipo>"
    Então devo ver a mensagem "Formato inválido. Use PNG, JPEG ou WEBP"
    E a capa não é salva

    Exemplos:
      | tipo |
      | GIF  |
      | PDF  |
      | SVG  |
```

## Estatísticas

```gherkin
Funcionalidade: Estatísticas

  Cenário: Totais refletem os livros cadastrados
    Dado que existem livros "lido" e "quero ler" cadastrados
    Quando acesso a página de Estatísticas
    Então o total de livros lidos corresponde à quantidade de livros com
      status "lido"
    E o total de páginas lidas corresponde à soma das páginas desses
      livros

  Cenário: Estatísticas não contam livros "quero ler"
    Dado que existem livros "quero ler" cadastrados
    Quando acesso a página de Estatísticas
    Então esses livros não entram nas contagens por gênero, formato ou
      literatura
```
