# 06 - Stock, produtos e imagens

Ficheiros principais:

```text
src/pages/StockPage.tsx
src/pages/ProductsPage.tsx
src/lib/uploadImage.ts
supabase-online.sql
```

## `StockPage.tsx`

Página usada pelo gestor.

### Bloco de imports

Importa:

- Supabase;
- tipos;
- ícones;
- utilitários;
- função de upload.

### Bloco `categories`

Define categorias de produtos:

- equipamento;
- uniforme;
- suplemento;
- limpeza;
- outro.

### Estados principais

Guarda:

- pesquisa;
- categoria filtrada;
- produtos;
- movimentos;
- produto selecionado;
- modais abertos;
- tipo de movimento;
- carregamento.

### `useEffect`

Quando a página abre, chama:

```ts
carregarProdutos()
carregarMovimentos()
```

### `carregarProdutos`

Busca produtos na tabela:

```text
produtos
```

Depois converte os campos para o formato `StockItem`.

Exemplo:

- `nome` vira `name`;
- `imagem_url` vira `imageUrl`;
- `quantidade_minima` vira `minQuantity`.

### `carregarMovimentos`

Busca histórico em:

```text
movimentos_estoque
```

### Filtros

Filtra produtos por:

- nome;
- categoria;
- baixo stock.

### `handleAdd`

Abre modal para criar produto.

### `handleEdit`

Abre modal com produto selecionado.

### `confirmDelete`

Apaga produto da Supabase.

### Bloco da tabela

Mostra:

- imagem ou ícone;
- nome;
- categoria;
- quantidade;
- preço;
- fornecedor;
- ações.

### `StockItemModal`

Modal de criar/editar produto.

Blocos internos:

- estado do formulário;
- imagem selecionada;
- pré-visualização;
- upload da imagem;
- validação;
- envio para `onSave`.

### Upload no produto

Se o gestor escolhe ficheiro:

1. `uploadImageFile` envia para Supabase Storage.
2. Recebe URL pública.
3. Guarda em `produtos.imagem_url`.

Se o gestor cola link:

1. O link é usado diretamente.
2. Também fica em `imagem_url`.

### `MovementModal`

Modal de entrada/saída de stock.

Recebe:

- produto;
- tipo;
- quantidade;
- motivo.

### Movimento de entrada

Soma quantidade ao stock.

### Movimento de saída

Subtrai quantidade.

Se a saída for maior que o stock, mostra erro.

### Histórico

Mostra movimentos do produto selecionado.

## `ProductsPage.tsx`

Página vista pelo atleta.

### Bloco de carregamento

Busca produtos da Supabase.

### Categorias disponíveis

Mostra apenas:

- equipamento;
- uniforme;
- suplemento.

### Filtros

Filtra por:

- nome;
- categoria.

### Bloco visual dos produtos

Mostra cartões com:

- imagem;
- nome;
- categoria;
- preço;
- quantidade.

Se não existir imagem, mostra ícone de saco de compras.

## `uploadImage.ts`

Função comum para upload.

### Validação de tipo

Só aceita ficheiros com:

```text
image/*
```

### Validação de tamanho

Máximo:

```text
5 MB
```

### Nome único

Cria nome com data e UUID.

Evita substituir imagens antigas.

### Upload

Envia para:

```text
magmanage-images
```

### Retorno

Retorna URL pública da imagem.

## Supabase necessária

Para imagens funcionarem, precisa existir:

- bucket `magmanage-images`;
- coluna `produtos.imagem_url`;
- políticas de storage.

Tudo isso fica em:

```text
supabase-online.sql
```

