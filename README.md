# App do visitante ARP

App mobile (iOS e Android) do visitante da ARP: guia de lojas e alimentação,
mapa por andar, agenda de eventos, cupons com estoque e prazo (carteira com QR
que funciona offline no caixa), desafios mensais com selos por QR Code e
notificações. Tudo é gerenciado pelo ERP (`../erp-mobile-arp`), que expõe a
API `/api/v1/app/*` consumida aqui.

| | |
|---|---|
| Base | Expo SDK 58 · React Native 0.88 · React 19.3 (React Compiler) · TypeScript |
| Navegação | Expo Router 58 |
| Dados | TanStack Query 5 com cache persistido (SQLite) · Zustand |
| Contrato | Schemas Zod do ERP em `src/contracts` |

Arquitetura, pastas e padrões: [docs/arquitetura.md](docs/arquitetura.md).

## Rodar em desenvolvimento

Pré-requisitos: Node 22.13+ e a API do ERP rodando (veja o README do ERP:
`npm run db:dev -w @arp/api`, `npm run db:migrate`, `npm run db:seed`, `npm run dev:api`).

```bash
npm install
cp .env.example .env.local     # ajuste EXPO_PUBLIC_API_URL
npm start
```

- **Emulador Android:** `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`
- **Simulador iOS:** `http://localhost:3000`
- **Aparelho físico:** `http://<IP-da-sua-máquina>:3000` (mesma rede)

Visitante de demonstração (seed do ERP): `ana.clara@example.com` / `Visitante123`.

Câmera, calendário e push precisam de um **development build**
(`npx expo run:android` / `npx expo run:ios`, ou `eas build --profile development`).
No Expo Go o app abre, mas o Android não recebe push remoto.

## Qualidade

```bash
npm run check            # Biome + TypeScript + Jest
npx expo-doctor          # dependências e config do Expo
npm run contracts:sync   # depois de mudar o contrato no ERP; o typecheck aponta o que ajustar
```

## Build e publicação (EAS)

```bash
npx eas-cli@latest build --profile preview      # APK/IPA interno (staging)
npx eas-cli@latest build --profile production
```

Antes do primeiro build: `npx eas-cli@latest init` (preenche o `projectId`, necessário
para push), e defina as URLs reais da API em `eas.json` (`preview` e `production`).
