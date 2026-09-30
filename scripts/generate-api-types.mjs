import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const files = {
  ...readEnvFile(".env"),
  ...readEnvFile(".env.development"),
  ...readEnvFile(".env.local"),
};
const apiUrl = (process.env.API_URL || files.API_URL || "").replace(/\/$/, "");
if (!apiUrl) {
  console.error("API_URL is not set.");
  process.exit(1);
}

const schemaUrl = `${apiUrl}/api/schema/?format=json`;
const response = await fetch(schemaUrl);
if (!response.ok) {
  console.error(`Schema download failed: ${response.status} ${schemaUrl}`);
  process.exit(1);
}

const schemaPath = "schema.json";
writeFileSync(schemaPath, await response.text());
try {
  const cli = join(
    dirname(fileURLToPath(import.meta.url)),
    "../node_modules/openapi-typescript/bin/cli.js",
  );
  execFileSync(process.execPath, [cli, schemaPath, "-o", "src/api/schema.d.ts"], {
    stdio: "inherit",
  });
} finally {
  unlinkSync(schemaPath);
}

console.log(`Wrote src/api/schema.d.ts from ${schemaUrl}`);
