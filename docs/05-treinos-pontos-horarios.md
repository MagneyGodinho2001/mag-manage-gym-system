# 05 - Treinos, chamada, pontos e horários

Ficheiros principais:

```text
src/pages/TrainingsPage.tsx
src/pages/SchedulesPage.tsx
src/store/useStore.ts
supabase-treinos.sql
```

## `TrainingsPage.tsx`

Página usada por gestor e treinador.

### Bloco de modalidades

Lista modalidades disponíveis, como:

- Jiu-Jitsu;
- Muay Thai;
- Boxe;
- MMA;
- Wrestling;
- Judo;
- Funcional.

### Bloco de estados

Guarda:

- treino selecionado;
- modal aberto;
- chamada aberta;
- treinador selecionado;
- filtros;
- dados do formulário.

### Bloco de treinador

Quando o utilizador é treinador, o sistema identifica a modalidade dele.

Assim, o treinador vê principalmente treinos e atletas da sua modalidade.

### Bloco de atletas disponíveis

Ao abrir chamada, o sistema procura atletas:

- ativos;
- da mesma modalidade do treino;
- ligados à academia/modalidade correta.

### Bloco de criação de treino

O formulário recolhe:

- título;
- modalidade;
- data;
- hora início;
- hora fim;
- treinador;
- capacidade máxima;
- descrição.

Depois chama:

```ts
addTraining()
```

ou:

```ts
updateTraining()
```

### Bloco de seleção do treinador

Ao criar treino, o gestor escolhe um treinador real vindo da Supabase.

Isto evita nomes falsos ou de demonstração.

### Bloco de chamada

Mostra atletas do treino/modalidade.

Permite marcar:

- presente;
- falta;
- pontos.

Quando grava, chama:

```ts
markAttendance()
```

## `markAttendance` no `useStore.ts`

Esta função é o coração da pontuação.

### Entrada

Recebe:

- `trainingId`;
- `athleteId`;
- `present`;
- `points`.

### Procura treino

Localiza o treino pelo ID.

Se não encontrar, retorna `false`.

### Calcula diferença de pontos

Se o atleta já tinha pontos naquele treino, o sistema calcula:

```text
pontos novos - pontos antigos
```

Isto evita duplicar pontos.

### Atualiza chamada

Guarda no treino:

```text
attendance[athleteId]
```

com:

- presença;
- pontos;
- data/hora de marcação.

### Atualiza atleta

Soma a diferença ao total de pontos do atleta.

Depois calcula a faixa nova.

### Grava treino

Chama:

```ts
upsertTrainingInSupabase()
```

para salvar a chamada.

### Atualiza membro

Atualiza na tabela `membros`:

- `total_pontos`;
- `plano` ou faixa atual.

### Cria notificação

Se a faixa mudou e não é Branca, cria notificação para o atleta.

## Pontos e faixas

Ordem:

1. Branca
2. Amarela
3. Laranja
4. Verde
5. Azul
6. Castanha
7. Preta (1º Dan)
8. Preta (2º Dan)

Pontuação:

- 180: Amarela
- 420: Laranja
- 780: Verde
- 1964: Azul
- 2040: Castanha
- 3120: Preta (1º Dan)
- 4560: Preta (2º Dan)

## `SchedulesPage.tsx`

Página de horários para atleta.

### Bloco de semana

Calcula a semana atual com:

- início da semana;
- dias da semana;
- navegação para semana anterior/próxima.

### Bloco de filtro

Permite filtrar por modalidade.

### Bloco de agrupamento por dia

Agrupa treinos por data.

Cada dia mostra os treinos daquele dia.

### Bloco `isEnrolled`

Verifica se o atleta atual está inscrito no treino.

Se estiver, destaca visualmente.

### Bloco de indicadores

Calcula:

- treinos na semana;
- inscrições do atleta;
- próximo treino.

### Bloco visual desktop

Mostra grade com 7 colunas, uma para cada dia.

### Bloco visual mobile

Mostra lista por dia, melhor para telemóvel.

### Bloco "Preparação do treino"

Mostra orientações simples:

- chegar com antecedência;
- levar material;
- confirmar inscrição.

### Bloco "Informações do horário"

Mostra resumo:

- treinos na semana;
- inscrições;
- próximo treino;
- aviso de alteração;
- lotação.

## `supabase-treinos.sql`

Cria a tabela `treinos`.

Campos importantes:

- `enrolled_athletes`: atletas inscritos;
- `attendance`: chamada;
- `max_capacity`: lotação;
- `instructor`: treinador.

