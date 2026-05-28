import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const root = join(toolsDir, "..");
const solutionsDir = join(root, "prime-epos", "solutions");

const replacements = [
  ["\u00e2\u20ac\u2122", "'"],
  ["\u00e2\u20ac\u02dc", "'"],
  ["\u00e2\u20ac\u0153", '"'],
  ["\u00e2\u20ac\ufffd", '"'],
  ["\u00e2\u20ac\u201c", "&ndash;"],
  ["\u00e2\u20ac\u009d", "&mdash;"],
  ["\u00e2\u20ac\u0094", "&mdash;"],
  ["\u00c2\u00a3", "&pound;"],
  ["\u00c2\u00a9", "&copy;"],
  ["\u00c2\u00ae", "&reg;"],
  ["\u00c2\u00a0", " "],
];

for (const name of await readdir(solutionsDir)) {
  if (!name.endsWith(".html")) continue;

  const path = join(solutionsDir, name);
  const original = await readFile(path, "utf8");
  let updated = original;

  for (const [bad, good] of replacements) {
    updated = updated.split(bad).join(good);
  }

  if (updated !== original) {
    await writeFile(path, updated, "utf8");
    console.log(`Cleaned ${name}`);
  }
}
