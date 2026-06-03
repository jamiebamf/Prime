import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const root = join(toolsDir, "..");
const rowsPath = join(root, "supabase", "shop-products-import.json");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this import.");
  process.exit(1);
}

const rows = JSON.parse(await readFile(rowsPath, "utf8"));
const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/shop_products?on_conflict=id`;

for (let index = 0; index < rows.length; index += 100) {
  const batch = rows.slice(index, index + 100);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(batch),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Import failed at row ${index + 1}: ${body}`);
  }

  console.log(`Imported ${Math.min(index + 100, rows.length)} / ${rows.length}`);
}

console.log("Product import complete.");
