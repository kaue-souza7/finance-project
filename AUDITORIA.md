# Auditoria Técnica — Finance Project (Frontend)

**Data:** Julho 2026
**Versão:** 0.1.0
**Propósito:** Auditoria completa do frontend React + Vite + TypeScript
**Stack:** React 18, Vite 6, TypeScript 5.6, TailwindCSS 3.4, Framer Motion 12, Lucide React, React Router 6, Recharts, Leaflet, vite-plugin-pwa 1.3

---

## Resumo Executivo

**Situação geral:** O projeto encontra-se em estágio intermediário de maturidade. A arquitetura é sólida e bem organizada, com separação clara entre camadas (páginas, componentes, hooks, serviços, tipos). A implementação de PWA está acima da média para projetos deste porte, cobrindo manifest, service worker com cache inteligente, atualização, splash screen, instalação, safe areas e detecção online/offline. O código é consistente no uso de Tailwind, Framer Motion e Lucide.

**Nível de maturidade:** 6.5/10 — Operacional e estável, com boas práticas estabelecidas, porém com oportunidades claras em performance (bundle, lazy loading), acessibilidade, testes e tratamento de formulários.

**Principais pontos fortes:**
- Arquitetura limpa e consistente (services layer, tipagem forte)
- Cobertura completa de PWA (instalação, atualização, splash, safe areas, offline detection)
- Estilização consistente com Tailwind + dark mode
- Código TS sem `any`, com `strict: true`
- Uso adequado de Framer Motion para animações

**Principais riscos:**
- Bundle único muito grande (~1.16 MB JS + 73 KB CSS) sem code splitting
- Nenhum teste automatizado (unit, integration, e2e)
- Acessibilidade abaixo do ideal para produção
- Sem React Query/Zustand — estado manual com prop drilling crescente
- Polling de 3s em ChatDetail sem fallback/cleanup adequado
- Duas implementações de Toast (Toast.tsx e ToastContext.tsx) duplicadas
- 2 páginas do simulador placeholders (AcumularPatrimonio, RendaPassiva)

---

## Problemas Encontrados

### CRÍTICOS

#### C1. Duplicação de Toast
- **Descrição:** Existem duas implementações quase idênticas de toast: `components/Toast.tsx` (usado diretamente como estado local em páginas) e `contexts/ToastContext.tsx` (provider global). O ToastContext renderiza seu próprio markup de toast, enquanto várias páginas (Dashboard, Transactions, Plannings, ShoppingLists, etc.) gerenciam seu próprio toast com estado local usando o componente Toast.tsx.
- **Impacto:** Alto — código duplicado, inconsistência visual potencial, manutenção duplicada.
- **Causa:** Evolução sem refatoração — o ToastContext foi criado posteriormente para centralizar, mas as páginas existentes não foram migradas.
- **Recomendação:** Migrar todas as páginas para usar `useToast()` do ToastContext e remover o componente `Toast.tsx` ou convertê-lo em um wrapper interno do contexto. **Prioridade: Crítica.**
- **Dificuldade:** Baixa (refatoração mecânica).

#### C2. Nenhum teste automatizado
- **Descrição:** Zero testes — unitários, integração ou e2e. Projeto sem Jest, Vitest, Testing Library ou Playwright.
- **Impacto:** Alto — cada alteração manual requer validação visual completa. Risco de regressão alto.
- **Causa:** Projeto early-stage sem prioridade para testes.
- **Recomendação:** Adicionar Vitest + Testing Library como dependências de dev. Criar testes para: AuthContext (login/logout/token), api.ts (error handling), hooks (useCompoundInterest), páginas críticas (Dashboard, Transactions).
- **Dificuldade:** Média (requer setup de infraestrutura).
- **Prioridade: Crítica.**

#### C3. Bundle monolithic sem code splitting
- **Descrição:** Todo o JS da aplicação é empacotado em um único chunk (`index-*.js` de ~1.16 MB / 327 KB gzipped). Recharts (~150 KB), Leaflet (~100 KB), Framer Motion e toda a aplicação estão no mesmo bundle.
- **Impacto:** Alto — tempo de carregamento inicial elevado, especialmente em conexões móveis. Totalmente carregado mesmo em páginas que não usam Leaflet ou Recharts.
- **Causa:** Sem lazy loading dinâmico (`React.lazy`) e sem `manualChunks` no Vite.
- **Recomendação:** (1) Adicionar `manualChunks` no `vite.config.ts` separando vendor chunks (react, recharts, leaflet, framer-motion). (2) Usar `React.lazy()` + `Suspense` para páginas de simulador, leisure detail, shopping detail. (3) Separar Leaflet em chunk próprio (só é usado em LeisureDetail e LocationPicker).
- **Dificuldade:** Baixa (configuração de build).
- **Prioridade: Crítica.**

---

### ALTOS

#### A1. Sem tratamento de formulários (React Hook Form / Zod)
- **Descrição:** Todos os formulários (Login, Register, Profile, PlanningForm, ExpenseForm, etc.) usam `useState` manual para cada campo, com validação inline no submit. Não há validação em tempo real, mensagens de erro por campo, ou tipagem schema-based.
- **Impacto:** UX de formulários pobre — erros só aparecem após submit, sem validação visual por campo. Código repetitivo (12+ estados de formulário manuais no Profile).
- **Causa:** Escolha arquitetural inicial (sem biblioteca de formulários).
- **Recomendação:** Adicionar React Hook Form + Zod. Migrar formulários gradualmente, começando por Register e Login (críticos para conversão).
- **Dificuldade:** Média (requer refatoração).
- **Prioridade: Alta.**

#### A2. Acessibilidade insuficiente
- **Descrição:** (a) Muitos botões sem `aria-label` (Drawer links, ExpenseCard edit/delete, PlanningForm actions). (b) Modais sem focus trap (ConfirmDialog, InviteModal, ShareManagementModal) — ao abrir, o foco não é preso dentro do modal. (c) Navegação por teclado pode ser melhorada — Drawer não tem `Escape` handler. (d) Mensagens de erro de formulário não têm `aria-live` ou `aria-describedby`. (e) Sem skip-to-content link. (f) Sem `prefers-reduced-motion` check em várias animações.
- **Impacto:** Alto — usuários de leitores de tela e navegação por teclado têm experiência degradada. Risco de não conformidade com requisitos legais (LGPD, WCAG 2.1 AA).
- **Causa:** Ausência de auditoria de acessibilidade durante o desenvolvimento.
- **Recomendação:** (1) Adicionar `aria-label` em todos os botões de ícone. (2) Implementar focus trap nos modais. (3) Adicionar `aria-describedby` para erros de formulário. (4) Adicionar skip-to-content link no AppLayout. (5) Verificar `useReducedMotion()` nas animações principais (já existe em ExpenseCard).
- **Dificuldade:** Média (distribuída em vários componentes).
- **Prioridade: Alta.**

#### A3. Polling sem supervisão em ChatDetail
- **Descrição:** `useMessages` usa `setInterval(poll, 3000)` para polling de novas mensagens. O intervalo roda mesmo quando o chat está em background ou a aba está oculta. Não há cleanup adequado da página anterior ao navegar entre chats (o `loadInitial` no useEffect reseta mensagens, mas o poll pode disparar com dados do chat anterior).
- **Impacto:** Alto — requisições desnecessárias consomem bateria e dados móveis. Potencial race condition ao trocar de chat.
- **Causa:** `poll` depende de `chatId` e `messagesRef.current`, mas `messagesRef` é atualizado de forma não reativa.
- **Recomendação:** Usar `useIsFocused` ou `document.visibilitychange` para pausar polling quando a página não está visível. Considerar WebSocket como alternativa ao polling. Melhorar o efeito para limpar o intervalo ao desmontar.
- **Dificuldade:** Baixa.
- **Prioridade: Alta.**

#### A4. Tratamento de erro de API pode expor detalhes do servidor
- **Descrição:** Em `api.ts`, o erro `res.status === 401` faz `clearToken()` + redirect para `/login`, mas o `throw new Error("Sessão expirada")` continua sendo lançado. Em AuthContext, mensagens de erro da API são repassadas ao usuário (ex.: `data.detail` que pode conter detalhes internos). O `console.error` nos hooks loga erros que podem conter dados sensíveis.
- **Impacto:** Médio-Alto — potencial vazamento de informações internas do backend em mensagens de erro.
- **Causa:** Ausência de sanitização de mensagens de erro.
- **Recomendação:** Em produção, mensagens de erro devem ser genéricas. Mapear erros 400/422 para mensagens amigáveis, logando o erro original apenas no console.
- **Dificuldade:** Baixa.
- **Prioridade: Alta.**

---

### MÉDIOS

#### M1. Componente CategoryPicker grande e complexo
- **Descrição:** `CategoryPicker.tsx` é complexo (lida com fetch de API, busca custom, texto customizável). Poderia ser quebrado em subcomponentes.
- **Impacto:** Médio — manutenção mais difícil.
- **Recomendação:** Extrair `CategoryList`, `CategorySearch`, `CustomCategoryInput` como subcomponentes.
- **Dificuldade:** Baixa.
- **Prioridade: Média.**

#### M2. Tipagem de erros genérica
- **Descrição:** Em vários hooks e páginas, o erro é tratado como `err instanceof Error ? err.message : "Mensagem genérica"`. Isso é repetido dezenas de vezes. `api.ts` usa `as Array<Record<string, unknown>>` sem validação.
- **Impacto:** Médio — código repetitivo, tipagem frágil para erros.
- **Recomendação:** Criar função utilitária `getErrorMessage(err: unknown): string`. Melhorar `api.ts` com validação Zod para o corpo da resposta de erro.
- **Dificuldade:** Baixa.
- **Prioridade: Média.**

#### M3. Duplicação de tipos entre PlanningForm e Profile
- **Descrição:** `PlanningForm.tsx` e `Profile.tsx` definem componentes `Card` e `FieldGroup` locais que duplicam os do `Card.tsx` e padrões de layout. `Settings.tsx` define `CardSection` e `OptionCard` locais.
- **Impacto:** Baixo-Médio — duplicação de markup e estilo.
- **Recomendação:** Extrair `CardSection`, `FieldGroup`, `OptionCard` para `components/ui/` como componentes reutilizáveis.
- **Dificuldade:** Baixa.
- **Prioridade: Média.**

#### M4. Componentes sem displayName
- **Descrição:** Nenhum componente exportado tem `displayName` definido. Em React DevTools, todos aparecem como `Anonymous` ou pelo nome da função, mas sem `displayName` explícito.
- **Impacto:** Baixo — dificulta debugging em React DevTools.
- **Recomendação:** Adicionar `Component.displayName = "ComponentName"` em componentes importantes.
- **Dificuldade:** Mínima.
- **Prioridade: Média.**

#### M5. Drawer: botões de ação com 36px de altura (abaixo do recomendado 44px)
- **Descrição:** Em `Plannings.tsx` e `ShoppingListDetail.tsx`, botões de ação (edit, delete, copy) têm `min-h-[36px]` e `min-w-[36px]`. Abaixo do mínimo de 44px recomendado para touch targets móveis.
- **Impacto:** Médio — experiência de toque prejudicada em dispositivos móveis.
- **Recomendação:** Aumentar para `min-h-[44px]` e `min-w-[44px]`.
- **Dificuldade:** Mínima.
- **Prioridade: Média.**

#### M6. Imagens sem dimensões explícitas
- **Descrição:** O logo `finance-logo.png` (2048x1152) é usado em Login, Register e SplashScreen sem `width`/`height` explícitos. Pode causar layout shift (CLS) durante o carregamento.
- **Impacto:** Médio — Cumulative Layout Shift (CLS) no carregamento das páginas de autenticação.
- **Recomendação:** Adicionar `width` e `height` explícitos nas tags `<img>` do logo.
- **Dificuldade:** Mínima.
- **Prioridade: Média.**

#### M7. Ícones PWA em SVG sem fallback PNG
- **Descrição:** Todos os ícones do manifest são SVG. Embora Chrome e Safari modernos suportem SVG em manifest, dispositivos mais antigos (Samsung Internet < 13, alguns WebViews) podem não exibir o ícone corretamente.
- **Impacto:** Baixo-Médio — ícone do PWA pode não aparecer em navegadores mais antigos.
- **Recomendação:** Adicionar ícones PNG (192x192, 512x512) além dos SVG, com `purpose: "any"`.
- **Dificuldade:** Mínima (requer geração de PNGs).
- **Prioridade: Média.**

---

### BAIXOS

#### B1. Cursor-based pagination não utilizado em messages
- **Descrição:** `messageApi.list(chatId, cursor?)` aceita cursor para paginação, mas `useMessages` nunca o utiliza (sempre carrega o histórico completo).
- **Impacto:** Baixo — com o tempo, chats com muitas mensagens podem ter carregamento lento.
- **Recomendação:** Implementar scroll-to-top para carregar mensagens mais antigas com cursor.
- **Dificuldade:** Média.
- **Prioridade: Baixa.**

#### B2. `console.warn` no Service Worker sem telemetria
- **Descrição:** `usePWAUpdate.ts` tem um `console.warn("SW registration failed", error)` que não está conectado a nenhum sistema de telemetria ou monitoramento.
- **Impacto:** Baixo — erro silencioso em produção.
- **Recomendação:** Conectar a um serviço de monitoramento (Sentry, LogRocket) ou ao menos exibir feedback visual.
- **Dificuldade:** Baixa.
- **Prioridade: Baixa.**

#### B3. Módulo `quote.ts` não utilizado
- **Descrição:** `services/quote.ts` exporta `quoteApi.daily()` mas não é importado em nenhum componente ou página.
- **Impacto:** Baixo — código morto.
- **Recomendação:** Remover ou integrar em local apropriado (Dashboard, talvez).
- **Dificuldade:** Mínima.
- **Prioridade: Baixa.**

#### B4. type export de iconMap inválido
- **Descrição:** `categoryIcons.tsx` exporta `export type { iconMap }` mas `iconMap` é um valor (`const`), não um tipo. Isso gera um warning do TypeScript moderno.
- **Impacto:** Baixo — não quebra build, mas é semanticamente incorreto.
- **Recomendação:** Trocar para `export type { }` ou `export { iconMap }`.
- **Dificuldade:** Mínima.
- **Prioridade: Baixa.**

#### B5. useRef sem tipo em useMessages
- **Descrição:** `messagesRef` é tipado como `useRef<MessageResponse[]>([])` mas é usado como `messagesRef.current = messages` em todo render. Isso é um anti-pattern — o ref é usado para escapar do closure do effect, o que é correto, mas poderia usar um `useRef` com callback pattern.
- **Impacto:** Baixo — funcional, mas idiomático questionável.
- **Recomendação:** Manter como está ou usar `useRef` com getter pattern.
- **Dificuldade:** Mínima.
- **Prioridade: Baixa.**

---

## Oportunidades

| Oportunidade | Descrição | Esforço | Ganho |
|---|---|---|---|
| React Query / TanStack Query | Substituir hooks manuais com staleTime, gcTime, retry, refetch, optimistic updates | Médio | Alto |
| React Router lazy loading | Usar `React.lazy` para todas as páginas, reduzindo bundle inicial em ~40% | Baixo | Alto |
| Preconnect para API | Adicionar `<link rel="preconnect" href="https://finance-api.onrender.com">` no HTML | Mínimo | Médio |
| WebSocket para chat | Substituir polling de 3s por WebSocket para mensagens em tempo real | Alto | Alto |
| PWA PNG icons + maskable | Gerar PNG icons para compatibilidade máxima | Mínimo | Médio |
| Vitest + MSW para mocks | Setup de testes com mock de API | Médio | Alto |
| ESLint plugin a11y | Adicionar `eslint-plugin-jsx-a11y` para detecção automática de problemas de acessibilidade | Mínimo | Alto |
| Husky + lint-staged | Adicionar pre-commit hooks para lint + formatação | Mínimo | Médio |
| Sentry / Error tracking | Capturar erros de frontend em produção | Baixo | Alto |
| PWA manifest com PNG | Adicionar PNG icons para compatibilidade com Samsung Internet | Mínimo | Médio |

---

## Plano de Ação Sugerido

### Fase 1 — Correções Críticas (1-2 dias)
- [ ] C1: Unificar as duas implementações de Toast (migrar páginas para ToastContext, remover Toast.tsx)
- [ ] C3: Adicionar `manualChunks` no vite.config.ts para separar vendor chunks
- [ ] C3: Adicionar `React.lazy()` para páginas não críticas

### Fase 2 — Alta Prioridade (3-5 dias)
- [ ] A1: Adicionar React Hook Form + Zod nos formulários de autenticação
- [ ] A2: Auditoria de acessibilidade + correções (aria-labels, focus trap, skip-to-content)
- [ ] A4: Sanitizar mensagens de erro de API
- [ ] A3: Melhorar polling do ChatDetail com `visibilitychange`

### Fase 3 — Qualidade (2-3 dias)
- [ ] C2: Setup de Vitest + Testing Library + primeiros testes
- [ ] M2: Função `getErrorMessage` utilitária
- [ ] M3: Extrair componentes compartilhados (CardSection, FieldGroup, OptionCard)
- [ ] M6: Adicionar dimensões nas imagens

### Fase 4 — Refinamentos (contínuo)
- [ ] M5: Touch targets de 44px em botões de ação
- [ ] M7: PNG icons para PWA
- [ ] B3: Remover módulo não utilizado (quote.ts)
- [ ] B4: Corrigir type export

---

## Notas por Categoria

### Arquitetura — 7.5/10
Organização limpa em 8 diretórios (components, pages, hooks, contexts, services, types, utils, pwa). Separação clara de responsabilidades com camada de serviços isolada. Ausência de React Query ou estado global centralizado faz com que hooks cresçam em complexidade (useMessages com 3 responsabilidades). Duplicação de Toast indica falta de padronização em estágio inicial.

### Código — 8/10
TypeScript strict, sem `any`. Padrão consistente de componentes (export function + interface Props). Hooks seguem mesmo pattern. Código limpo e legível. Principais problemas: código duplicado (Toast), tipos exportados incorretamente (categoryIcons), error handling repetitivo.

### Performance — 4/10
Bundle monolithic (~1.16 MB JS) sem code splitting. Sem lazy loading. Polling desnecessário. Imagens sem dimensões. Sem preconnect para API. Chunk warning de >500 KB no build. A boa notícia é que as correções são pura configuração (manualChunks, React.lazy).

### UX — 7.5/10
Interface consistente, dark mode, animações suaves, feedback visual adequado. Skeletons implementados na maioria das telas. Pontos fracos: validação de formulários apenas no submit, sem validação inline. Empty states e error states bem tratados.

### Mobile — 7/10
Safe areas implementadas. Touch targets majoritariamente 44px. Scroll suave. Formulários com font-size 16px (previne zoom iOS). Overflow horizontal controlado. Drawer responsivo. Pontos fracos: alguns botões de 36px em listas, sem bottom navigation (aplicativo usa drawer lateral apenas).

### PWA — 8.5/10
Implementação completa e acima da média: manifest, service worker com cache inteligente, exclusão de API, detecção de atualização com banner, splash screen com estado real, instalação para Android/iOS, safe areas, detecção online/offline, tratamento de iOS Safari. Plugin vite-plugin-pwa bem configurado. Único ponto: ícones SVG sem fallback PNG.

### Acessibilidade — 3.5/10
Ponto mais fraco do projeto. Ausência de aria-labels em muitos botões, sem focus trap em modais, sem skip-to-content, sem aria-describedby para erros, sem prefers-reduced-motion consistente. A base está boa (contraste, dark mode, font-size), mas faltam práticas essenciais de WCAG 2.1 AA.

### Segurança — 7/10
JWT armazenado em localStorage (prática comum, mas inferior a httpOnly cookies). Tratamento de 401 com redirect para login. Sem dangerouslySetInnerHTML. Mensagens de erro podem vazar detalhes do backend. Upload de avatar com validação apenas no frontend (tipo de arquivo, tamanho).

### Organização — 8.5/10
Diretórios bem estruturados, nomenclatura consistente (PascalCase para componentes, camelCase para hooks/utils), imports organizados por prioridade (react → bibliotecas → internos). Aliases `@/` configurados. ESLint + Prettier configurados.

---

## Nota Geral

### **6.8 / 10**

**Justificativa:** O projeto tem uma base técnica sólida com arquitetura limpa, código TypeScript de qualidade e uma implementação de PWA exemplar. Os pontos fortes em organização, código e PWA elevam a nota. No entanto, a ausência de testes automatizados, a falta de code splitting (resultando em bundle de ~1.16 MB), e a acessibilidade precária são gaps significativos que impedem uma nota mais alta. A boa notícia é que nenhum dos problemas é estrutural — são todos corrigíveis com esforço moderado.

**Para atingir 9.0+:**
1. Testes automatizados (Vitest + Testing Library)
2. Code splitting + lazy loading
3. Auditoria WCAG 2.1 AA completa
4. React Hook Form + Zod para formulários
5. React Query para gerenciamento de estado de API
6. Substituir polling do chat por WebSocket
