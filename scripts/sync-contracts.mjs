/**
 * Copia os contratos HTTP (schemas Zod) do ERP para src/contracts.
 *
 * O ERP é a fonte da verdade: nunca edite src/contracts à mão. Depois de
 * mudar o contrato no ERP, rode `npm run contracts:sync` e o `npm run typecheck`
 * aponta tudo o que o app precisa ajustar.
 *
 * Origem: ERP_CONTRACTS_DIR ou ../erp-mobile-arp/packages/contracts/src.
 */
import { cpSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(
  process.env.ERP_CONTRACTS_DIR ?? resolve(root, "../erp-mobile-arp/packages/contracts/src"),
);
const target = resolve(root, "src/contracts");

if (!existsSync(source)) {
  console.error(`Contratos não encontrados em ${source}. Defina ERP_CONTRACTS_DIR.`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true, filter: (path) => !/\.test\.ts$/.test(path) });
writeFileSync(
  resolve(target, "README.md"),
  "# Contratos (gerado)\n\nCópia de `erp-mobile-arp/packages/contracts/src`. Não edite: rode `npm run contracts:sync`.\n",
);
console.log(`Contratos sincronizados de ${source}`);
