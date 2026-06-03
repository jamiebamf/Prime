import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const root = join(toolsDir, "..");
const cataloguePath = join(root, "prime-epos", "assets", "data", "shop-products.json");
const outputPath = join(root, "supabase", "shop-products-import.json");

const catalogue = JSON.parse(await readFile(cataloguePath, "utf8"));

const rows = catalogue.products.map((product, index) => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  brand: product.brand || null,
  category: product.category,
  tags: product.tags || [],
  price: product.price,
  display_price: product.displayPrice,
  purchasable: Boolean(product.purchasable),
  available: product.available || 0,
  in_stock: Boolean(product.inStock),
  description: product.description || "",
  details: product.details || "",
  image_url: product.imageUrl || null,
  images: product.images || [],
  has_image: Boolean(product.hasImage),
  active: true,
  sort_order: index,
}));

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(rows, null, 2), "utf8");
console.log(`Wrote ${rows.length} products to ${outputPath}`);
