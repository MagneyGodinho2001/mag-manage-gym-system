# 00 - Como estudar o código do MagManage

Esta pasta explica o sistema por blocos de código.

A ideia não é decorar linha por linha. A ideia é perceber:

1. Para que serve o ficheiro.
2. Quais blocos existem dentro dele.
3. Que dados entram.
4. Que tratamento o código faz.
5. Onde os dados são guardados ou mostrados.

## Ordem recomendada de leitura

1. `01-app-rotas-layout.md`
2. `02-store-useStore-blocos.md`
3. `03-supabase-e-sql.md`
4. `04-paginas-gestao.md`
5. `05-treinos-pontos-horarios.md`
6. `06-stock-produtos-imagens.md`
7. `07-componentes-estilos-config.md`

## Como o sistema funciona em resumo

O sistema é uma aplicação React.

O utilizador abre o site, faz login e o React mostra páginas diferentes conforme o papel:

- gestor;
- treinador;
- atleta.

Os dados vêm da Supabase.

O estado central fica em:

```text
src/store/useStore.ts
```

As páginas ficam em:

```text
src/pages
```

A ligação com a Supabase fica em:

```text
src/lib/supabase.js
```

O upload de imagens fica em:

```text
src/lib/uploadImage.ts
```

## O que significa "bloco de código"

Neste projeto, um bloco pode ser:

- um `useState`;
- um `useEffect`;
- uma função como `handleSubmit`;
- um bloco de renderização JSX;
- uma função que busca dados na Supabase;
- uma função que grava dados na Supabase;
- uma função de filtro;
- uma função de cálculo.

Exemplo simples:

```tsx
const [search, setSearch] = useState('')
```

Este bloco cria uma variável de estado para guardar o texto pesquisado pelo utilizador.

Outro exemplo:

```tsx
useEffect(() => {
  carregarDados()
}, [])
```

Este bloco executa `carregarDados()` quando a página abre.

## Padrão que se repete nas páginas

Quase todas as páginas seguem este padrão:

1. Importações.
2. Constantes auxiliares.
3. Estados com `useState`.
4. Carregamento com `useEffect`.
5. Funções de criar, editar, apagar ou filtrar.
6. Retorno visual com JSX.
7. Modais ou componentes auxiliares no fim do ficheiro.

Se perceberes esse padrão, consegues ler quase qualquer página do projeto.

