# 02 - Estado global: `useStore.ts`

Ficheiro:

```text
src/store/useStore.ts
```

Este é o centro do sistema.

Ele guarda dados e funções usados por várias páginas.

## Bloco de imports

Importa:

- `zustand`;
- `persist`;
- tipos do sistema;
- cliente Supabase.

Isto permite criar um estado global persistente.

## Interface `AppState`

Este bloco define tudo que o store guarda.

Divide o sistema em áreas:

- tema e idioma;
- autenticação;
- redefinição de senha;
- notificações;
- pagamentos;
- atletas;
- treinos;
- stock.

Exemplo:

```ts
user: User | null
isAuthenticated: boolean
```

Significa que o sistema sabe quem está logado e se a sessão está ativa.

## Bloco de utilizadores iniciais

Contém utilizadores de demonstração/fallback.

Hoje o sistema usa Supabase, mas estes dados ainda servem como segurança para alguns fluxos locais.

## Bloco de senhas

Guarda senhas em memória local do store.

Importante:

No sistema online, a senha também é guardada nas tabelas da Supabase:

- `usuarios.senha`;
- `membros.senha`.

## Bloco de faixas por pontos

Define a ordem de pontuação:

```ts
const beltThresholds = [...]
```

Função:

```ts
getBeltForPoints(points)
```

Recebe pontos e devolve a faixa correta.

Exemplo:

- 180 pontos: Amarela;
- 420 pontos: Laranja;
- 4560 pontos: Preta (2º Dan).

## Blocos de mapeamento

Estas funções convertem dados da Supabase para o formato usado no React.

### `mapMemberToAthlete`

Converte uma linha da tabela `membros` para o tipo `Athlete`.

Exemplo:

Supabase usa:

```text
nome
telefone
modalidade
foto_url
```

React usa:

```text
name
phone
modality
photo
```

### `mapTrainingFromSupabase`

Converte dados de `treinos` para o formato usado pela aplicação.

Transforma:

- `start_time` em `startTime`;
- `end_time` em `endTime`;
- `max_capacity` em `maxCapacity`;
- `academia_id` em `academyId`.

### `mapTrainingToSupabase`

Faz o contrário.

Converte um treino do React para o formato que a Supabase espera.

É usado antes de gravar treino.

### `mapUsuarioToUser`

Converte uma linha da tabela `usuarios` para `User`.

Usado para gestor e treinador.

### `mapMembroToUser`

Converte um atleta da tabela `membros` para `User`.

Assim o atleta também consegue fazer login.

### `mapRegistrationFromSupabase`

Converte pedidos de inscrição da tabela `pending_registrations`.

### `mapPasswordResetFromSupabase`

Converte pedidos de redefinição de senha.

### `mapNotificationFromSupabase`

Converte notificações.

## `upsertTrainingInSupabase`

Esta função grava ou atualiza treino na Supabase.

Usa:

```ts
supabase.from('treinos').upsert(...)
```

Se o treino já existir, atualiza.

Se não existir, cria.

## Bloco `create<AppState>()`

Aqui o Zustand cria o store.

Dentro dele ficam todas as funções principais.

## Função `login`

Fluxo:

1. Recebe email e senha.
2. Normaliza email para minúsculas.
3. Procura em `usuarios`.
4. Procura em `membros`.
5. Verifica se existe utilizador.
6. Verifica senha.
7. Verifica se está aprovado.
8. Guarda `user` e `isAuthenticated`.

Se o login for gestor e não existir online, há um fallback para criar/usar gestor.

## Função `logout`

Limpa:

- utilizador atual;
- estado de autenticação.

Depois o layout envia para login.

## Função `register`

Usada na página de cadastro público.

Fluxo:

1. Verifica se email já existe em `usuarios`.
2. Verifica se email já existe em `membros`.
3. Verifica se já existe pedido pendente.
4. Cria pedido em `pending_registrations`.

O gestor precisa aprovar depois.

## Função `approveRegistration`

Usada pelo gestor.

Fluxo:

1. Busca o pedido pendente.
2. Se for atleta, cria em `membros`.
3. Se for treinador, cria em `usuarios`.
4. Remove ou atualiza o pedido pendente.
5. Cria utilizador aprovado no estado.

## Função `rejectRegistration`

Marca ou remove pedido recusado.

Usada quando o gestor não aceita uma inscrição.

## Função `createApprovedUser`

Cria utilizador já aprovado.

É usada quando o gestor cria treinador/atleta diretamente.

## Função `changeUserPassword`

Permite alterar senha.

Fluxo:

1. Confere senha atual.
2. Atualiza senha em `usuarios` ou `membros`.
3. Atualiza cache local.

## Função `requestPasswordReset`

Cria pedido de redefinição de senha.

Fluxo:

1. Utilizador informa email.
2. Sistema procura em `usuarios` e `membros`.
3. Se encontrar, cria pedido em `password_reset_requests`.
4. O gestor resolve depois.

## Função `resolvePasswordReset`

Gestor define uma nova senha para o pedido.

Atualiza:

- tabela do utilizador;
- status do pedido.

## Funções de notificação

### `addNotification`

Cria notificação no estado e na Supabase.

### `markNotificationRead`

Marca uma notificação como lida.

### `markAllNotificationsRead`

Marca todas as notificações do utilizador como lidas.

### `clearNotifications`

Limpa notificações do estado.

## Funções de pagamento

### `addPayment`

Cria pagamento no estado.

### `updatePayment`

Atualiza pagamento.

### `markPaymentPaid`

Marca pagamento como pago.

## Funções de atletas

### `addAthlete`

Adiciona atleta no estado.

### `updateAthlete`

Atualiza dados de atleta.

### `deleteAthlete`

Remove atleta.

Algumas páginas usam Supabase diretamente, mas o store mantém estes métodos para estado global.

## `loadGymDataFromSupabase`

Uma das funções mais importantes.

Carrega:

- utilizadores;
- membros;
- inscrições pendentes;
- pedidos de senha;
- notificações;
- produtos;
- movimentos de stock;
- atletas;
- treinos.

Depois atualiza o estado global.

É chamada:

- quando o utilizador entra;
- quando há mudanças em tempo real na Supabase.

## Funções de treinos

### `addTraining`

Cria treino novo.

Gera `id`, adiciona no estado e grava na Supabase.

### `updateTraining`

Atualiza treino no estado e na Supabase.

### `deleteTraining`

Remove treino do estado e da Supabase.

### `enrollAthlete`

Inscreve atleta num treino.

Adiciona o ID do atleta em:

```text
enrolledAthletes
```

### `unenrollAthlete`

Remove atleta do treino.

Também remove a chamada desse atleta.

## Função `markAttendance`

Esta é a função central da chamada.

Fluxo:

1. Recebe treino, atleta, presença e pontos.
2. Procura treino no estado.
3. Verifica pontos antigos.
4. Calcula diferença entre pontos novos e antigos.
5. Atualiza chamada do treino.
6. Atualiza total de pontos do atleta.
7. Calcula nova faixa.
8. Grava treino na Supabase.
9. Atualiza pontos em `membros`.
10. Cria notificação se o atleta mudou de faixa.

Esta função evita duplicar pontos quando o treinador altera uma chamada já marcada.

## Funções de stock

### `addStockItem`

Adiciona produto no estado.

### `updateStockItem`

Atualiza produto.

### `deleteStockItem`

Remove produto.

### `addStockMovement`

Registra entrada ou saída de produto.

Também recalcula a quantidade disponível.

## Persistência

O store usa `persist`.

Isso mantém alguns dados no navegador, como:

- tema;
- idioma;
- utilizador autenticado.

Dados principais continuam vindo da Supabase.

