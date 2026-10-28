import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HEADER = "\n";

const clientRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceDir = path.resolve(clientRoot, "../server/src/contracts");
const targetDir = path.join(clientRoot, "src/contracts");
const checkOnly = process.argv.includes("--check");

if (!existsSync(sourceDir)) {
  console.log(`No contracts found at ${sourceDir} yet, nothing to sync.`);
  process.exit(0);
}

const sourceFiles = readdirSync(sourceDir).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));

let outOfDate = false;

for (const file of sourceFiles) {
  const generated = HEADER + readFileSync(path.join(sourceDir, file), "utf8");
  const targetPath = path.join(targetDir, file);

  if (checkOnly) {
    const current = existsSync(targetPath) ? readFileSync(targetPath, "utf8") : null;
    if (current !== generated) {
      console.error(`${file} is out of date`);
      outOfDate = true;
    }
    continue;
  }

  mkdirSync(targetDir, { recursive: true });
  writeFileSync(targetPath, generated);
  console.log(`synced ${file}`);
}

// A contract deleted on the server must disappear here too, or old shapes linger.
const staleFiles = existsSync(targetDir)
  ? readdirSync(targetDir).filter((file) => file.endsWith(".ts") && !sourceFiles.includes(file))
  : [];

for (const file of staleFiles) {
  if (checkOnly) {
    console.error(`${file} no longer exists on the server`);
    outOfDate = true;
  } else {
    rmSync(path.join(targetDir, file));
    console.log(`removed ${file}`);
  }
}

if (checkOnly && outOfDate) {
  process.exit(1);
}
