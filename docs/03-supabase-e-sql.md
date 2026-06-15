# 03 - Supabase e SQL

Este documento explica os blocos relacionados com Supabase.

Ficheiros:

```text
src/lib/supabase.js
src/lib/uploadImage.ts
supabase-online.sql
supabase-treinos.sql
```

## `src/lib/supabase.js`

Este ficheiro cria a ligação entre o React e a Supabase.

### Bloco de importação

```js
import { createClient } from '@supabase/supabase-js'
```

Importa a função que cria o cliente Supabase.

### Bloco de fallback

Define URL e chave padrão caso as variáveis da Vercel estejam ausentes ou erradas.

Objetivo:

Evitar tela preta quando a Vercel não tiver variáveis configuradas corretamente.

### Função `isValidUrl`

Verifica se o valor recebido é uma URL HTTP ou HTTPS válida.

Se a URL for inválida, o sistema usa o fallback.

### Bloco das variáveis de ambiente

Lê:

```text
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_ANON_KEY
```

Estas variáveis vêm do Vite.

### Bloco `createClient`

Cria e exporta:

```js
export const supabase = createClient(...)
```

Todas as páginas importam esse cliente para consultar ou gravar dados.

## `src/lib/uploadImage.ts`

Este ficheiro trata upload de imagens.

### Constante `IMAGE_BUCKET`

Define o bucket usado:

```text
magmanage-images
```

### Constante `MAX_IMAGE_SIZE`

Limita a imagem a 5 MB.

### Função `uploadImageFile`

Recebe:

- ficheiro;
- pasta destino.

Fluxo:

1. Verifica se o ficheiro é imagem.
2. Verifica tamanho.
3. Cria nome único.
4. Envia para Supabase Storage.
5. Retorna URL pública.

Usada por:

- produtos;
- atletas;
- treinadores.

## `supabase-online.sql`

Este é o SQL principal do sistema online.

### Bloco de tabelas

Cria tabelas como:

- `pending_registrations`;
- `password_reset_requests`;
- `notifications`;
- `academias`;
- `pagamentos`;
- `recibos_pagamentos`;
- `produtos`;
- `movimentos_estoque`.

### Bloco de alterações em tabelas existentes

Adiciona colunas em:

```text
usuarios
membros
treinos
pagamentos
produtos
```

Exemplos:

- `senha`;
- `approval_status`;
- `academia_id`;
- `foto_url`;
- `avatar_url`;
- `imagem_url`.

### Bloco da academia principal

Cria:

```text
Academia Principal
```

com `id = 1`.

Serve como academia padrão para dados antigos.

### Bloco de atualização de dados antigos

Define `academia_id = 1` onde estiver vazio.

Assim, dados antigos não ficam sem academia.

### Bloco do gestor inicial

Cria ou atualiza:

```text
gestor@magmanage.com
```

com papel:

```text
gestor
```

### Bloco de RLS

Ativa Row Level Security nas tabelas.

Depois cria políticas permissivas para `anon`.

Isto permite que o frontend consiga ler e gravar dados usando a chave pública.

Observação:

Para produção real mais segura, estas políticas devem ser endurecidas futuramente.

### Bloco de Storage

Cria bucket:

```text
magmanage-images
```

E cria políticas para:

- ler imagens;
- inserir imagens;
- atualizar imagens;
- apagar imagens.

Sem este bloco, upload de fotos não funciona.

## `supabase-treinos.sql`

Ficheiro específico para treinos.

### Bloco `create table treinos`

Cria a tabela de treinos com campos como:

- `title`;
- `modality`;
- `date`;
- `start_time`;
- `end_time`;
- `instructor`;
- `max_capacity`;
- `enrolled_athletes`;
- `attendance`;
- `description`.

### Bloco `total_pontos`

Adiciona:

```text
total_pontos
```

na tabela `membros`.

### Bloco de políticas

Permite:

- ler treinos;
- inserir treinos;
- atualizar treinos;
- apagar treinos.

