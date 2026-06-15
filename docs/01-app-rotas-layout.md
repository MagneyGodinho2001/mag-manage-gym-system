# 01 - App, rotas e layout

Este documento explica os blocos principais de:

```text
src/App.tsx
src/components/layout/DashboardLayout.tsx
src/main.tsx
```

## `src/main.tsx`

Este é o primeiro ficheiro React executado.

### Bloco de importações

Importa React, React DOM, router e estilos globais.

Serve para preparar a aplicação antes de aparecer no navegador.

### Bloco de renderização

Renderiza o componente `App` dentro do elemento `root` do `index.html`.

Fluxo:

1. O navegador abre `index.html`.
2. O Vite carrega `main.tsx`.
3. `main.tsx` monta `<App />`.
4. A aplicação aparece.

## `src/App.tsx`

Este ficheiro controla as rotas e a proteção das páginas.

### Bloco de importações

Importa:

- páginas;
- layout;
- Supabase;
- estado global;
- componentes de router.

Isto permite montar o sistema completo.

### Bloco `ProtectedRoute`

Este bloco protege páginas internas.

Ele verifica:

1. O utilizador está autenticado?
2. O utilizador tem permissão para esta página?

Se não estiver autenticado:

```tsx
return <Navigate to="/login" replace />
```

Se estiver autenticado, mas sem permissão:

```tsx
return <Navigate to="/dashboard" replace />
```

Se estiver tudo certo, mostra a página.

### Bloco de splash screen

Usa:

```tsx
const [showSplash, setShowSplash] = useState(true)
const [hasSeenSplash, setHasSeenSplash] = useState(false)
```

Serve para mostrar uma tela inicial apenas uma vez por sessão.

O código consulta:

```text
sessionStorage
```

Se o utilizador já viu a tela, ela não aparece novamente.

### Bloco de carregamento e realtime

Quando o utilizador está autenticado, este bloco chama:

```tsx
loadGymDataFromSupabase()
```

Depois cria um canal Supabase:

```tsx
supabase.channel('magmanage-gym-data')
```

Esse canal escuta mudanças em tabelas como:

- `membros`;
- `treinos`;
- `usuarios`;
- `academias`;
- `notifications`;
- `produtos`;
- `pagamentos`.

Quando alguma dessas tabelas muda, o sistema recarrega os dados.

Objetivo:

Manter o site atualizado sem precisar fazer refresh manual.

### Bloco de rotas públicas

Rotas públicas:

- `/login`
- `/registro`

Se o utilizador já estiver autenticado, é enviado para `/dashboard`.

### Bloco de rotas internas

Todas as páginas internas ficam dentro de:

```tsx
<DashboardLayout />
```

Isso significa que elas aparecem com menu, cabeçalho e estrutura do painel.

### Bloco de permissões por rota

Exemplos:

```tsx
allowedRoles={['gestor']}
```

Significa que só o gestor entra.

```tsx
allowedRoles={['gestor', 'treinador']}
```

Significa que gestor e treinador entram.

```tsx
allowedRoles={['atleta']}
```

Significa que só o atleta entra.

## `DashboardLayout.tsx`

Este ficheiro define o visual principal após login.

### Bloco `navItems`

Lista os itens do menu lateral.

Cada item define:

- nome;
- rota;
- ícone;
- perfis que podem ver.

Exemplo:

```tsx
roles: ['gestor']
```

O item só aparece para gestor.

### Bloco de estados

Controla:

- menu lateral aberto/fechado;
- menu mobile;
- notificações abertas;
- tema;
- idioma.

### Bloco de notificações

Filtra notificações do utilizador atual:

```tsx
notifications.filter((n) => n.userId === user?.id)
```

Depois calcula quantas ainda não foram lidas.

### Bloco de logout

Chama:

```tsx
logout()
```

Depois envia o utilizador para a página de login.

### Bloco de menu filtrado

Filtra `navItems` pelo papel do utilizador.

Assim, um atleta não vê páginas de gestor.

### Bloco visual JSX

Renderiza:

- sidebar;
- cabeçalho;
- botão de tema;
- botão de notificações;
- conteúdo da página com `<Outlet />`.

`<Outlet />` é onde a página atual aparece.

