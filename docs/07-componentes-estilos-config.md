# 07 - Componentes, estilos e configuração

Este documento explica ficheiros de apoio, estilos e componentes.

## `src/index.css`

CSS principal.

### Bloco de imports

Importa Tailwind e animações.

### Bloco de tema escuro

Define cores padrão do sistema.

Inclui:

- background;
- foreground;
- card;
- primary;
- secondary;
- border;
- sidebar.

### Bloco de tema claro

Classe:

```css
.light
```

Sobrescreve as cores para modo claro.

### Bloco global

Aplica cor de borda para todos os elementos.

### Bloco `body`

Define:

- cor de fundo;
- cor de texto;
- fonte;
- suavização de fonte.

### Bloco neon

Define efeitos visuais para modo escuro e claro.

### Bloco scrollbar

Personaliza a barra de rolagem no modo escuro e claro.

## `styles/globals.css`

CSS global adicional.

Pode ser usado por componentes externos ou estilos complementares.

## `components/ui`

Pasta de componentes reutilizáveis.

Estes componentes não são regras de negócio.

Eles são peças visuais para montar as páginas.

Exemplos:

- botão;
- input;
- tabela;
- modal;
- toast;
- tabs;
- sidebar.

## Como ler um componente UI

Normalmente ele tem:

1. Importações.
2. Definição de variantes de estilo.
3. Componente React.
4. Exportação.

Exemplo:

```tsx
export { Button }
```

As páginas importam e usam quando precisam.

## `components/ui/button.tsx`

Define botão reutilizável.

Pode ter variantes como:

- padrão;
- destrutivo;
- outline;
- ghost.

## `components/ui/dialog.tsx`

Define modal.

Usado quando precisa abrir uma janela sobre a página.

## `components/ui/table.tsx`

Define estrutura visual de tabelas.

## `components/ui/input.tsx`

Define input reutilizável.

## `components/ui/toast.tsx` e `toaster.tsx`

Servem para mensagens temporárias.

## `hooks/use-mobile.ts`

Detecta se o ecrã é pequeno.

Útil para adaptar layout.

## `hooks/use-toast.ts`

Permite mostrar notificações visuais temporárias.

## `src/i18n/translations.ts`

Guarda traduções.

Cada chave tem valores para vários idiomas.

Exemplo:

```ts
dashboard: ['Dashboard', 'Dashboard', 'Tableau de bord', 'Panel']
```

## `src/i18n/useTranslation.ts`

Hook que pega o idioma atual e devolve função `t`.

Uso:

```tsx
const { t } = useTranslation()
```

Depois:

```tsx
t('dashboard')
```

## `src/types/index.ts`

Define os tipos principais.

Ajuda a evitar erro de estrutura.

Exemplo:

```ts
export interface Athlete {
  id: string
  name: string
  email: string
}
```

## `package.json`

Define dependências e scripts.

Scripts importantes:

```bash
npm run dev
npm run build
```

## `vite.config.ts`

Configura Vite.

Vite é responsável por:

- servidor local;
- build;
- processamento de React.

## `vercel.json`

Configura deploy na Vercel.

Inclui:

- comando de instalação;
- comando de build;
- pasta `dist`;
- rewrite para rotas React.

## `tsconfig.json`

Configuração TypeScript.

Define regras de compilação e caminhos.

## `components.json`

Configuração dos componentes UI.

Ajuda ferramentas a saberem onde ficam componentes e estilos.

