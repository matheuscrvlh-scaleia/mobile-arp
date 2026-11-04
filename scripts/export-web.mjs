/**
 * Build web (react-native-web) para embutir num host que serve o app em
 * `/real` e faz proxy de `/arp-api/*` para a API em produção.
 *
 * Saída: dist-web/ (SPA: o host reescreve /real/* desconhecido para /real/index.html).
 * Sobrescreva com WEB_BASE e WEB_API_URL se precisar. Script em node para não
 * depender de `VAR=x` na linha de comando (quebra no cmd do Windows).
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(root, "node_modules/expo/bin/cli");

const result = spawnSync(
  process.execPath,
  [cli, "export", "--platform", "web", "--output-dir", "dist-web", "--clear"],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      EXPO_WEB_BASE: process.env.WEB_BASE ?? "/real",
      // Valor do processo vence o .env.local (o Expo não sobrescreve variável já definida).
      EXPO_PUBLIC_API_URL: process.env.WEB_API_URL ?? "/arp-api",
    },
  },
);

process.exit(result.status ?? 1);
