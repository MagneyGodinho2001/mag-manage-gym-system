# 04 - Páginas de gestão

Este documento explica os blocos principais das páginas de gestão.

## Padrão das páginas

Quase todas seguem esta ordem:

1. Imports.
2. Constantes.
3. Estados.
4. `useEffect` para carregar dados.
5. Funções de busca.
6. Funções de criar/editar/apagar.
7. Filtros.
8. JSX da página.
9. Modais.

## `AcademiesPage.tsx`

Página de academias.

### Bloco de estados

Guarda:

- lista de academias;
- formulário;
- academia selecionada;
- estado de carregamento;
- modal aberto/fechado.

### Bloco de carregamento

Busca dados em:

```text
academias
```

### Bloco de criação

Insere nova academia na Supabase.

Campos principais:

- nome;
- localização;
- telefone;
- status.

### Bloco de edição

Atualiza academia existente.

### Bloco visual

Mostra cartões ou tabela com as academias.

## `AthletesPage.tsx`

Página de atletas.

### Bloco de imports

Importa:

- ícones;
- Supabase;
- utilitários;
- tradução;
- upload de imagem.

### Bloco de constantes

Define modalidades e faixas.

### Estados principais

Guarda:

- atletas da Supabase;
- academias;
- filtros;
- atleta selecionado;
- modais;
- estado de gravação;
- modalidade do treinador.

### `useEffect`

Quando a página abre:

1. Busca membros.
2. Busca academias.
3. Se o utilizador for treinador, busca a modalidade dele.

### Função de busca de membros

Consulta:

```text
membros
```

Depois guarda na lista.

### Filtros

Filtra atletas por:

- nome;
- email;
- modalidade;
- status;
- modalidade do treinador.

### `handleSaveAthlete`

Controla criar e editar atleta.

Se existe `selectedAthlete`, faz update.

Se não existe, faz insert.

Também trata:

- email;
- senha inicial;
- academia;
- modalidade;
- faixa;
- foto.

### Modal `AthleteModal`

Contém o formulário de atleta.

Blocos internos:

- estado do formulário;
- upload de foto;
- pré-visualização da foto;
- validação de senha;
- envio para `onSave`.

### Modal de detalhes

Mostra dados do atleta em modo leitura.

## `TrainersPage.tsx`

Página de treinadores.

### Estados principais

Guarda:

- lista de treinadores;
- academias;
- contagem de atletas por academia;
- pesquisa;
- treinador selecionado;
- modais;
- formulário;
- dados de senha.

### `carregarTreinadores`

Busca em:

```text
usuarios
```

com:

```text
role = treinador
```

### `carregarAcademias`

Busca academias ativas.

### `carregarContagemAtletasPorAcademia`

Conta quantos atletas existem por academia.

### `handleSubmit`

Cria treinador.

Fluxo:

1. Valida campos obrigatórios.
2. Verifica se email já existe.
3. Insere em `usuarios`.
4. Cria login/senha.
5. Atualiza lista.

### `handleEditTrainer`

Atualiza dados do treinador.

Campos:

- nome;
- telefone;
- especialidade;
- academia;
- foto;
- status.

### `handleResetPassword`

Redefine senha do treinador.

### `TrainerFormModal`

Formulário usado para criar e editar treinador.

Blocos internos:

- upload de foto;
- nome;
- email;
- telefone;
- modalidade;
- academia;
- senha inicial;
- status.

## `ApprovalsPage.tsx`

Página de aprovações.

### Dados principais

Usa o store para acessar:

- inscrições pendentes;
- utilizadores aprovados;
- funções de aprovar/rejeitar.

### Bloco de pendentes

Mostra pedidos de cadastro.

### Bloco de aprovação

Quando o gestor aprova:

- atleta vai para `membros`;
- treinador vai para `usuarios`.

### Bloco de rejeição

Remove ou marca pedido como rejeitado.

## `PaymentsPage.tsx`

Página de pagamentos.

### Blocos principais

Controla:

- lista de pagamentos;
- comprovativos;
- aprovação;
- rejeição;
- totais recebidos.

### Aprovar comprovativo

Quando o gestor aprova:

1. recibo passa para aprovado;
2. pagamento relacionado passa para pago;
3. totais são recalculados.

### Rejeitar comprovativo

Marca comprovativo como rejeitado.

O pagamento continua pendente.

## `ReportsPage.tsx`

Página de relatórios.

### Bloco de dados

Usa dados do store e Supabase para montar métricas.

### Bloco de gráficos/tabelas

Mostra análise de:

- atletas;
- modalidades;
- faixas;
- pagamentos;
- planos/academias.

## `ProfilePage.tsx`

Página de perfil.

Mostra dados do utilizador atual.

Pode usar:

- nome;
- email;
- telefone;
- papel;
- status.

