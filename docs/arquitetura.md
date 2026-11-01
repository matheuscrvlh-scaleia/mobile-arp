# Arquitetura — App do visitante ARP

App mobile (iOS e Android) do visitante da ARP. Consome a API do ERP
(`erp-mobile-arp`, rotas `/api/v1/app/*`). O design vem do protótipo
`mockup-mobile-arp`.

| | |
|---|---|
| Base | Expo SDK 58 · React Native 0.88 (New Architecture, Hermes) · React 19.3 · React Compiler |
| Navegação | Expo Router 58 (rotas por arquivo em `src/app`, typed routes) |
| Dados do servidor | TanStack Query 5, cache persistido em SQLite (`expo-sqlite/kv-store`) |
| Estado local | Zustand (sessão, overlays). Nada de estado global para dado do servidor |
| Contrato | Schemas Zod do ERP copiados em `src/contracts` (`npm run contracts:sync`) |
| UI | Design system próprio em `src/design` com tema claro/escuro ([tema.md](tema.md)), fonte Geist, ícones lucide, Reanimated 4, Gesture Handler 3 |
| Qualidade | TypeScript estrito, Biome, Jest (`npm run check`) |

## Pastas

```
src/
├─ app/                 # SÓ rotas (Expo Router). Arquivo fino: reexporta a tela da feature.
├─ contracts/           # GERADO do ERP. Não editar.
├─ core/                # Infra do app, sem UI de feature
│  ├─ api/              # http.ts (fetch + auth + erros), app-api.ts (1 função por rota), errors.ts, media.ts
│  ├─ auth/             # sessão do visitante + token-keeper (tokens, refresh single-flight), ação pendente
│  ├─ merchant/         # sessão e API do lojista (painel do caixa), separada da do visitante
│  ├─ config/           # env (EXPO_PUBLIC_API_URL, versão, projeto EAS)
│  ├─ notifications/    # push (Expo), lembretes locais, links (deep link → rota)
│  ├─ query/            # QueryClient, chaves, paginação, persistência
│  ├─ storage/          # kv (SQLite)
│  ├─ boot.ts           # inicialização fora do React
│  └─ providers.tsx     # gestos, safe area, React Query persistido
├─ design/              # tokens, componentes base, overlays (Sheet, Toast)
├─ navigation/          # TabBar, navegação (openPath, goBackOr), avisos de sessão
├─ shared/              # sem domínio: format, text, names, time, haptics, hooks, query-view, form
└─ features/<feature>/  # auth, home, stores, map, search, agenda, coupons, challenges, profile, merchant
   ├─ api/              # hooks do React Query (consultas e mutações)
   ├─ components/       # componentes da feature
   ├─ sheets/           # painéis (sheet.open)
   ├─ hooks/            # hooks de UI
   ├─ lib/              # regras puras (.ts) com teste
   ├─ screens/          # telas (default export), usadas pelas rotas
   └─ index.ts          # API pública: o que outras features podem importar
```

Dependências: `app → features → (core, design, shared, navigation, contracts)`.
`core`, `design` e `shared` não importam `features`. Uma feature importa outra
**só pelo `index.ts`** (`@/features/stores`), nunca um arquivo interno.

## Rotas e deep links

As rotas usam os mesmos caminhos dos links do ERP (`scheme: arp`), então push,
QR Code e links compartilhados abrem a tela certa sem tradução:

| Rota | Tela | Link |
|---|---|---|
| `/` · `/cupons` · `/desafios` · `/mapa` | abas (Início, Cupons, Selos, Mapa) | `arp://desafios`, `arp://mapa?loja=<slug>&andar=<id>` |
| `/boas-vindas`, `/entrar`, `/cadastro` | primeira abertura e conta | |
| `/lojas?tipo=food\|shop` | Explorar (lojas e alimentação) | |
| `/loja/[slug]` | página da loja (sempre pelo slug) | `arp://loja/<slug>` |
| `/agenda`, `/evento/[id]` | agenda e evento | `arp://evento/<id>` |
| `/cupom/[id]` | detalhe do cupom | `arp://cupom/<id>` |
| `/carteira`, `/carteira/[id]` | carteira e "meu cupom" (QR) | |
| `/ler-qr`, `/selo/[token]`, `/selo-conquistado` | leitor, link de selo, celebração | `arp://selo/<token>` |
| `/perfil`, `/conta`, `/favoritos`, `/busca` | perfil, dados da conta, favoritas, busca geral | |
| `/senha/esqueci`, `/senha/nova` | recuperação de senha (código de 6 dígitos por e-mail) | |
| `/lojista`, `/lojista/entrar`, `/lojista/validar`, `/lojista/senha` | painel do lojista (números da loja, validar cupom no caixa) | |

- `src/app/+native-intent.tsx` normaliza todo link de fora (`core/notifications/links.ts`):
  ids de cupom/evento/carteira precisam ser UUID; desconhecido abre o Início
  (na abertura) ou é ignorado (com o app aberto).
- Push do ERP: `data.url` = deep link; link `https://` abre no navegador.
- **Abas**: a partir de tela da pilha, sheet ou notificação, navegue para uma aba
  com `openPath()` (usa `dismissTo`). `push`/`replace` para uma aba cria uma
  segunda barra de abas. Botão voltar próprio: `goBackOr(fallback)`.
- Nenhuma tela usa `presentation: "fullScreenModal"`: no iOS o modal nativo
  fica por cima do `OverlayHost` e esconde painéis e avisos.

## Comunicação com o ERP

- Toda chamada passa por `core/api/app-api.ts` → `core/api/http.ts`. Telas nunca usam `fetch`.
- `http.ts`: Bearer, renovação da sessão, timeout (inclui o corpo), headers
  `X-App-Version`/`X-Platform`, `Cache-Control: no-cache` (o cache é o React
  Query; o cache HTTP nativo poderia servir resposta anônima a um pedido logado).
  Falhas viram `ApiError` (`code` do contrato + `NETWORK_ERROR`/`TIMEOUT`);
  `errorMessage(error)` dá o texto da tela.
- Rotas públicas (home, lojas, mapa, agenda, cupons, desafios) funcionam sem
  login e **nunca falham por causa da sessão**: se a renovação falhar, seguem
  anônimas. Com login a API personaliza (`isFavorite`, `myClaim`, `earned`…).
- Sessão: access (15 min) e refresh (rotativo, 90 dias) no SecureStore. A
  renovação é single-flight (a API revoga a família ao detectar reuso), começa já
  no boot, respeita Retry-After depois de 429/503 e descarta respostas que chegam
  depois de um logout.
- Em dev, toda resposta é conferida com o schema Zod do contrato (divergências no
  console). Em produção os schemas nem entram no bundle de abertura.
- Imagens: sempre por `mediaUrl()` (a API pode mandar caminho relativo `/uploads/...`).
  `Photo`/`Avatar` com `displayWidth` baixam a miniatura WebP do ERP (160/480/960 px,
  `imageVariantUrl`) e caem na original se ela ainda não existir.

## Dados e cache

- Chaves só em `core/query/keys.ts` (inclui infinitas, contagem, busca, pego).
  Escopo `public` (navegação) e `me` (conta). Entrar invalida `public`; **sair
  remove `public` e `me`** (respostas públicas trazem dados da conta, como o
  código do cupom) e cancela os lembretes locais.
- Persistência (abre sem rede): só `home`, `map`, `store-categories`,
  `challenges` e `me.*` (carteira e "meu cupom" funcionam offline no caixa).
- `staleTime`: mapa/categorias 1 h · lojas/eventos/agenda 5 min · desafios 2 min ·
  perfil/favoritas 5 min · home/cupons/carteira 30 s · busca 2 min (gc 5 min).
- Retry: só erro transitório, com jitter; 429 tenta 1 vez; teto de 20 s.
- Mutações:
  - alternâncias usadas em vários lugares (favoritar, seguir, interesse) = hook
    `useToggleXxx` com `requireAuth` + otimista + toast + rollback;
  - ações com resultado do servidor (pegar cupom, ler QR) = a tela trata o feedback;
  - depois de mutação, dado **público** é invalidado com `refetchType: "none"`:
    o ERP guarda leituras públicas ~15 s e um refetch imediato desfaria o otimista.
- Listas longas: `FlashList` v2. Paginação `useInfiniteQuery` com `nextPageParam` e `maxPages`.

## Login

- Navegar é livre. Ações de conta passam por `requireAuth(acao)`: sem login abre
  o convite de cadastro e, depois de entrar, executa a ação pendente.
- E-mail e senha, Google (`@react-native-google-signin/google-signin`, só aparece
  com `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` configurado) e Apple (iOS). Recuperação de
  senha por código de 6 dígitos enviado por e-mail.
- Logout revoga o refresh e desvincula o push do aparelho no ERP.

## Painel do lojista

- Usuários do painel do ERP com `coupons.redeem` entram em `/lojista` (Perfil →
  "Área do lojista"). Sessão própria (`core/merchant`), independente da conta de
  visitante; o access é o mesmo token do painel web, o refresh vai no corpo.
- Validar no caixa em 2 passos (consultar → confirmar uso), por código ou lendo o
  QR do cupom do visitante. Números da loja por período (hoje, 7 e 30 dias).
- Notificações: o app nunca pede permissão sozinho; oferece com contexto (fim do
  cadastro, primeiro cupom, primeiro interesse em evento).

## UI

- Sempre componentes de `@/design`. Cores, espaços, raios e sombras só por tokens.
  Texto sempre pelo `Text` do design (fonte Geist por peso).
- Ícones chegam da API como nome lucide (`"ticket-percent"`): `<Icon name=... />`
  (registro curado em `design/components/icons.ts`; nome novo do ERP entra lá).
- Estados de tela: `queryView(query)` + `<QueryFallback>` (carregando, sem
  conexão, erro com "Tentar de novo"). Sem rede o React Query **pausa** a
  consulta (não dá erro): nunca dependa só de `isError`.
- Puxar para atualizar: sempre `useRefreshControl(...)` (nunca `isRefetching`).
- Feedback: `toast.show(mensagem, icone)` (ícone de sucesso já vibra),
  `sheet.open(...)`/`sheet.message(...)`, `haptic.*`.
- Acessibilidade: `accessibilityRole`/`accessibilityLabel` em todo tocável sem
  texto; área de toque mínima de 44 pt.
- Android é sempre edge-to-edge: respeite os insets do safe area.

## Desempenho

- React Compiler ligado: componentes puros; `sv.set()`/`sv.get()` no Reanimated;
  nada de `try/finally` com setState. Sem `useMemo`/`useCallback` manuais à toa.
- `StyleSheet.create` fora do componente; nada de objeto de estilo novo por item.
- `expo-image` com `recyclingKey`; gradientes nativos em vez de SVG em listas
  (no Android cada SVG vira um bitmap do tamanho da view).
- Animações em loop param fora de foco. Barras animam `scaleX`, não `width`.
- Um único relógio (`useNow`) agrupado por intervalo.

## Ambientes e build

- `app.config.ts`: `APP_VARIANT` = `development` | `preview` | `production`
  (nome e bundle id próprios, instaláveis lado a lado). Valida
  `EXPO_PUBLIC_API_URL` no build (https fora de dev).
- `eas.json`: perfis com a URL da API de cada ambiente.
- Push remoto exige o `projectId` do EAS (`EAS_PROJECT_ID` ou `extra.eas.projectId`)
  e um development build (Expo Go no Android não recebe push).

## Comandos

```bash
cp .env.example .env.local   # EXPO_PUBLIC_API_URL
npm start                    # Metro (development build ou Expo Go)
npm run check                # Biome + TypeScript + Jest
npm run contracts:sync       # recopia os contratos do ERP
npx expo-doctor              # dependências e config
```
