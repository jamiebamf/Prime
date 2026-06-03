import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const root = join(toolsDir, "..");
const siteDir = join(root, "prime-epos");
const productCsvPath = "C:/Users/Jamie/Desktop/scraper/Products_6_1_2026 (3).csv";
const imageCsvPath = "C:/Users/Jamie/Desktop/scraper/product_urls_with_images.csv";
const portalJsonPath = join(siteDir, "assets", "data", "ycr-products.json");
const publicCataloguePath = join(siteDir, "assets", "data", "shop-products.json");
const pagePath = join(siteDir, "products.html");

const MARKUP = 1.35;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = rows.shift();
  return rows
    .filter((entry) => entry.some((value) => value !== ""))
    .map((entry) => Object.fromEntries(headers.map((header, index) => [header, entry[index] ?? ""])));
}

function stripHtml(html) {
  return String(html ?? "")
    .replace(/\[embed\][\s\S]*?\[\/embed\]/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&times;/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function sentence(text, fallback) {
  const clean = stripHtml(text);
  if (!clean) return fallback;
  const first = clean.match(/^.{80,240}?(?:\.|\?|!)(?:\s|$)/);
  return (first ? first[0] : clean.slice(0, 220)).trim();
}

function productIdFromUrl(url) {
  return String(url ?? "").match(/\/Product\/([^/?#]+)/i)?.[1] ?? "";
}

function money(value) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
}

function roundPrice(raw) {
  return Math.round((Number(raw) || 0) * MARKUP * 100) / 100;
}

function sortName(name) {
  return String(name ?? "").replace(/\s+/g, " ").trim();
}

function publicCategory(category) {
  const value = String(category ?? "").toLowerCase();
  if (value.includes("kiosk")) return "Kiosks";
  if (value.includes("terminal") || value.includes("mobile pos") || value.includes("tablet pos") || value.includes("ecr")) return "POS Terminals";
  if (value.includes("peripheral")) return "Accessories";
  if (value.includes("printer")) return "Printers";
  if (value.includes("drawer")) return "Cash Drawers";
  if (value.includes("scanner")) return "Barcode Scanners";
  if (value.includes("display")) return "Displays";
  if (value.includes("scale")) return "Scales";
  if (value.includes("stand") || value.includes("mount")) return "Stands & Mounts";
  if (value.includes("software") || value.includes("operating system")) return "Software";
  if (value.includes("component") || value.includes("cover") || value.includes("cable") || value.includes("connector") || value.includes("memory") || value.includes("battery") || value.includes("lock") || value.includes("keyboard") || value.includes("pcb")) return "Parts & Components";
  if (value.includes("safe") || value.includes("counter")) return "Accessories";
  if (value.includes("graded")) return "Graded Hardware";
  return "Accessories";
}

function productTags(product) {
  const tags = new Set();
  const text = `${product.Name} ${product.Category} ${product.Tags}`.toLowerCase();
  if (/bundle|sapphire/.test(text)) tags.add("Bundle");
  if (/kiosk|self.?service/.test(text)) tags.add("Kiosk");
  if (/printer|receipt|thermal|label/.test(text)) tags.add("Printer");
  if (/drawer|cash/.test(text)) tags.add("Cash drawer");
  if (/scanner|barcode/.test(text)) tags.add("Scanner");
  if (/display|screen|monitor/.test(text)) tags.add("Display");
  if (/scale|weigh/.test(text)) tags.add("Scale");
  if (/android/.test(text)) tags.add("Android");
  if (/windows/.test(text)) tags.add("Windows");
  return [...tags].slice(0, 3);
}

async function buildCatalogue() {
  const [productCsv, imageCsv, portalText] = await Promise.all([
    readFile(productCsvPath, "utf8"),
    readFile(imageCsvPath, "utf8"),
    readFile(portalJsonPath, "utf8"),
  ]);

  const pricedProducts = parseCsv(productCsv.replace(/^\uFEFF/, ""));
  const imageRows = parseCsv(imageCsv.replace(/^\uFEFF/, ""));
  const portal = JSON.parse(portalText.replace(/^\uFEFF/, ""));
  const portalBySku = new Map(portal.products.map((product) => [String(product.sku).trim().toUpperCase(), product]));
  const imageByProductId = new Map(imageRows.map((row) => [productIdFromUrl(row.product_url), row]));

  let matchedPortal = 0;
  let matchedImageRows = 0;

  const products = pricedProducts
    .filter((product) => sortName(product.Name))
    .map((product) => {
      const sku = String(product.ProductCode).trim();
      const portalProduct = portalBySku.get(sku.toUpperCase());
      if (portalProduct) matchedPortal += 1;

      const imageRow = imageByProductId.get(productIdFromUrl(portalProduct?.productUrl));
      if (imageRow) matchedImageRows += 1;

      const imageUrls = [
        imageRow?.image_1,
        imageRow?.image_2,
        imageRow?.image_3,
        imageRow?.image_4,
        imageRow?.image_5,
        portalProduct?.imageUrl,
      ].filter((url, index, all) => url && !url.includes("GetEmptyImage") && all.indexOf(url) === index);

      const basePrice = Number(product.Price) || 0;
      const hasPrice = basePrice > 0;
      const price = hasPrice ? roundPrice(basePrice) : null;
      const category = publicCategory(product.Category);
      const description =
        sentence(product.ShortDescription, "") ||
        sentence(product.Description, "") ||
        `${category} product from Prime-EPOS. Full details coming soon.`;

      return {
        id: sku,
        sku,
        name: sortName(product.Name),
        brand: sortName(product.Brand),
        category,
        tags: productTags(product),
        price,
        displayPrice: hasPrice ? money(price) : "Price coming soon",
        purchasable: hasPrice,
        available: Number(product.Available) || 0,
        inStock: Number(product.Available) > 0 || Boolean(portalProduct?.inStock),
        description,
        details: stripHtml(product.Description),
        imageUrl: imageUrls[0] ?? "",
        images: imageUrls,
        hasImage: imageUrls.length > 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const categories = [...new Set(products.map((product) => product.category))]
    .sort((a, b) => a.localeCompare(b))
    .map((category) => ({
      name: category,
      count: products.filter((product) => product.category === category).length,
    }));

  const catalogue = {
    generatedAt: new Date().toISOString(),
    stats: {
      productCount: products.length,
      categories: categories.length,
      missingImages: products.filter((product) => !product.hasImage).length,
      missingPrices: products.filter((product) => !product.purchasable).length,
    },
    categories,
    products,
  };

  await mkdir(dirname(publicCataloguePath), { recursive: true });
  await writeFile(publicCataloguePath, JSON.stringify(catalogue, null, 2), "utf8");
  return catalogue;
}

const nav = `<nav class="site-nav">
  <a href="index.html" class="nav-logo pe-logo"><span class="pe-logo-icon" aria-hidden="true"></span><span class="pe-logo-word"><span class="pe-logo-prime">Prime</span><span class="pe-logo-dash">-</span><span class="pe-logo-epos">EPOS</span></span></a>
  <ul class="nav-links">
    <li class="has-dropdown">
      <a href="industries.html">Industries</a>
      <div class="nav-dropdown">
        <div class="nav-dropdown-inner">
          <a href="industries/hospitality.html">Hospitality</a>
          <a href="industries/retail.html">Retail</a>
          <a href="industries/venues.html">Venues &amp; Events</a>
          <a href="industries/services.html">Services</a>
        </div>
      </div>
    </li>
    <li class="has-dropdown">
      <a href="solutions.html">Solutions</a>
      <div class="nav-dropdown wide">
        <div class="nav-dropdown-inner">
          <a href="solutions/touchpoint.html">TouchPoint</a>
          <a href="solutions/touchpoint-lite.html">TouchPoint Lite</a>
          <a href="solutions/touchoffice.html">TouchOffice Web</a>
          <a href="solutions/pockettouch.html">PocketTouch</a>
          <a href="solutions/bytable.html">ByTable</a>
          <a href="solutions/touchkitchen.html">TouchKitchen</a>
          <a href="solutions/selfservice.html">SelfService</a>
          <a href="solutions/touchstock.html">TouchStock</a>
          <a href="solutions/touchreservation.html">TouchReservation</a>
          <a href="solutions/collectionpoint.html">CollectionPoint</a>
          <div class="dd-divider"></div>
          <div class="dd-view-all"><a href="solutions.html">View all solutions &rarr;</a></div>
        </div>
      </div>
    </li>
    <li><a href="products.html" class="active">Shop</a></li>
    <li><a href="pricing.html">Pricing</a></li>
    <li><a href="about.html">About</a></li>
    <li><a href="contact.html" class="nav-cta">Get a Quote</a></li>
  </ul>
  <button class="nav-mobile-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
</nav>`;

const footer = `<footer class="site-footer">
  <div class="footer-top">
    <div>
      <div class="footer-brand pe-logo"><span class="pe-logo-icon" aria-hidden="true"></span><span class="pe-logo-word"><span class="pe-logo-prime">Prime</span><span class="pe-logo-dash">-</span><span class="pe-logo-epos">EPOS</span></span></div>
      <p class="footer-tagline">Professional EPoS solutions for UK businesses. Hardware that lasts. Software that works. Support that's actually here.</p>
      <div class="footer-contact">
        <div>Phone: <a href="tel:07947246247">07947 246247</a></div>
        <div>Email: <a href="mailto:info@prime-epos.co.uk">info@prime-epos.co.uk</a></div>
        <div>Support: 24/7 support available</div>
      </div>
    </div>
    <div>
      <div class="footer-col-title">Industries</div>
      <ul class="footer-links">
        <li><a href="industries/hospitality.html">Hospitality</a></li>
        <li><a href="industries/retail.html">Retail</a></li>
        <li><a href="industries/venues.html">Venues &amp; Events</a></li>
        <li><a href="industries/services.html">Services</a></li>
      </ul>
    </div>
    <div>
      <div class="footer-col-title">Solutions</div>
      <ul class="footer-links">
        <li><a href="solutions/touchpoint.html">TouchPoint</a></li>
        <li><a href="solutions/touchoffice.html">TouchOffice Web</a></li>
        <li><a href="solutions/pockettouch.html">PocketTouch</a></li>
        <li><a href="solutions.html">View all</a></li>
      </ul>
    </div>
    <div>
      <div class="footer-col-title">Company</div>
      <ul class="footer-links">
        <li><a href="about.html">About Us</a></li>
        <li><a href="pricing.html">Pricing</a></li>
        <li><a href="products.html">Shop</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="status.html">System Status</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p class="footer-copy">&copy; 2026 Prime-EPOS. All rights reserved. Registered in England &amp; Wales.</p>
    <div class="footer-legal">
      <a href="privacy.html">Privacy Policy</a>
      <a href="cookies.html">Cookies</a>
      <a href="terms.html">Terms</a>
    </div>
  </div>
</footer>`;

function buildPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Shop - Prime-EPOS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/site-shell-v2.css">
<style>
  .shop-page { background: #f5f2ec; padding: 118px 5vw 92px; }
  .shop-inner { max-width: 1480px; margin: 0 auto; }
  .shop-intro { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(320px, 1fr); gap: 2.5rem; align-items: end; margin-bottom: 1.5rem; }
  .shop-intro h1 { max-width: 680px; }
  .shop-intro p { color: var(--mid); line-height: 1.7; max-width: 660px; }
  .shop-toolbar { position: sticky; top: 68px; z-index: 15; display: grid; grid-template-columns: minmax(260px, 1fr) 210px; gap: 0.75rem; align-items: center; margin: 1.25rem 0 1rem; padding: 0.85rem; border: 1px solid rgba(15, 15, 15, 0.1); border-radius: 8px; background: rgba(255, 253, 248, 0.9); box-shadow: 0 16px 42px rgba(15, 15, 15, 0.08); backdrop-filter: blur(14px); }
  .shop-search, .shop-sort { width: 100%; height: 46px; border: 1px solid rgba(15, 15, 15, 0.12); border-radius: 8px; background: #fffdf8; color: var(--black); font: inherit; }
  .shop-search { padding: 0 1rem; }
  .shop-sort { padding: 0 0.85rem; }
  .shop-layout { display: grid; grid-template-columns: 250px minmax(0, 1fr) 360px; gap: 1.1rem; align-items: start; }
  .shop-sidebar, .basket-panel { position: sticky; top: 152px; }
  .shop-sidebar { border: 1px solid rgba(15, 15, 15, 0.1); border-radius: 8px; background: #fffdf8; box-shadow: 0 12px 30px rgba(15, 15, 15, 0.05); overflow: hidden; }
  .shop-sidebar-head { padding: 1rem; border-bottom: 1px solid rgba(15, 15, 15, 0.08); }
  .shop-sidebar-head h2 { color: var(--black); font-family: var(--font-display); font-size: 1.1rem; }
  .category-list { max-height: calc(100vh - 245px); overflow: auto; padding: 0.55rem; }
  .category-button { display: flex; justify-content: space-between; gap: 0.5rem; width: 100%; border: 0; border-radius: 7px; background: transparent; color: var(--mid); cursor: pointer; font-family: var(--font-display); font-size: 0.9rem; font-weight: 800; padding: 0.72rem 0.75rem; text-align: left; }
  .category-button span:last-child { color: rgba(15, 15, 15, 0.42); font-weight: 700; }
  .category-button.is-active, .category-button:hover { background: #fff1e4; color: var(--accent); }
  .category-button.is-active span:last-child, .category-button:hover span:last-child { color: var(--accent); }
  .shop-meta { display: flex; justify-content: space-between; gap: 1rem; color: var(--mid); font-size: 0.95rem; margin: 0 0 1rem; }
  .product-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
  .product-card { display: flex; flex-direction: column; min-height: 100%; border: 1px solid rgba(15, 15, 15, 0.1); border-radius: 8px; overflow: hidden; background: #fffaf2; box-shadow: 0 12px 28px rgba(15, 15, 15, 0.05); transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
  .product-card:hover { transform: translateY(-3px); border-color: rgba(255, 106, 0, 0.58); box-shadow: 0 18px 38px rgba(255, 106, 0, 0.14), 0 14px 30px rgba(15, 15, 15, 0.08); }
  .product-image { height: 210px; padding: 1.05rem; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #fcf8ef, #e9e3d7); border-bottom: 1px solid rgba(15, 15, 15, 0.08); }
  .product-image img { max-width: 100%; max-height: 178px; object-fit: contain; mix-blend-mode: multiply; }
  .image-placeholder { width: 100%; height: 100%; display: grid; place-items: center; border: 1px dashed rgba(15, 15, 15, 0.2); border-radius: 8px; color: rgba(15, 15, 15, 0.44); font-family: var(--font-display); font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.78rem; }
  .product-body { display: flex; flex: 1; flex-direction: column; padding: 1rem; }
  .product-kicker { color: var(--accent); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.1em; margin-bottom: 0.45rem; text-transform: uppercase; }
  .product-card h3 { color: var(--black); font-family: var(--font-display); font-size: 1.05rem; line-height: 1.18; letter-spacing: 0; margin-bottom: 0.55rem; }
  .product-desc { color: var(--mid); font-size: 0.91rem; line-height: 1.52; margin-bottom: 0.85rem; }
  .product-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: auto 0 0.9rem; }
  .product-tag { border-radius: 999px; background: #fff0e0; color: #c75100; font-size: 0.68rem; font-weight: 800; padding: 0.32rem 0.5rem; }
  .product-foot { display: flex; justify-content: space-between; gap: 0.8rem; align-items: center; }
  .product-price { color: var(--black); font-family: var(--font-display); font-size: 1.18rem; font-weight: 900; }
  .add-button { border: 0; border-radius: 7px; background: var(--accent); color: var(--white); cursor: pointer; font-family: var(--font-display); font-weight: 800; padding: 0.72rem 0.88rem; }
  .add-button:disabled { background: rgba(15, 15, 15, 0.18); color: rgba(15, 15, 15, 0.48); cursor: not-allowed; }
  .basket-panel { border: 1px solid rgba(15, 15, 15, 0.1); border-radius: 8px; background: #151312; color: var(--white); box-shadow: 0 18px 42px rgba(15, 15, 15, 0.16); overflow: hidden; }
  .basket-head, .basket-actions { padding: 1rem; }
  .basket-head { border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
  .basket-head h2 { color: var(--white); font-family: var(--font-display); font-size: 1.25rem; }
  .basket-items { max-height: 360px; overflow-y: auto; padding: 0.75rem; }
  .basket-empty { color: rgba(255, 255, 255, 0.58); font-size: 0.92rem; line-height: 1.5; padding: 0.4rem; }
  .basket-item { display: grid; grid-template-columns: 1fr auto; gap: 0.75rem; align-items: center; padding: 0.75rem; border-radius: 8px; background: rgba(255, 255, 255, 0.06); }
  .basket-item + .basket-item { margin-top: 0.55rem; }
  .basket-item-name { color: var(--white); font-weight: 700; line-height: 1.25; }
  .basket-item-meta { color: rgba(255, 255, 255, 0.58); font-size: 0.82rem; margin-top: 0.25rem; }
  .basket-qty { display: flex; align-items: center; gap: 0.4rem; }
  .basket-qty button { width: 28px; height: 28px; border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 6px; background: rgba(255, 255, 255, 0.08); color: var(--white); cursor: pointer; }
  .basket-actions { border-top: 1px solid rgba(255, 255, 255, 0.1); }
  .basket-total { display: flex; justify-content: space-between; color: rgba(255, 255, 255, 0.72); margin-bottom: 0.8rem; }
  .basket-total strong { color: var(--white); }
  .buy-now { display: flex; justify-content: center; width: 100%; border-radius: 7px; background: var(--accent); color: var(--white); font-family: var(--font-display); font-weight: 800; padding: 0.85rem 1rem; text-decoration: none; }
  .clear-basket { width: 100%; margin-top: 0.55rem; border: 0; background: transparent; color: rgba(255, 255, 255, 0.55); cursor: pointer; font: inherit; }
  .shop-status { color: var(--mid); grid-column: 1 / -1; padding: 2rem 0; }
  @media (max-width: 1280px) { .shop-layout { grid-template-columns: 220px minmax(0, 1fr); } .basket-panel { position: static; grid-column: 1 / -1; } }
  @media (max-width: 980px) { .shop-page { padding-top: 98px; } .shop-intro, .shop-toolbar, .shop-layout, .product-grid { grid-template-columns: 1fr; } .shop-toolbar, .shop-sidebar { position: static; } .category-list { display: flex; max-height: none; overflow-x: auto; } .category-button { flex: 0 0 auto; width: auto; } }
</style>
</head>
<body>
${nav}
<main class="shop-page">
  <div class="shop-inner">
    <section class="shop-intro reveal">
      <div>
        <p class="section-label">Shop</p>
        <h1 class="section-heading">EPoS hardware, ready to buy.</h1>
      </div>
    </section>
    <section class="shop-toolbar reveal" aria-label="Shop controls">
      <input class="shop-search" type="search" placeholder="Search products, SKUs, brands or categories..." aria-label="Search products">
      <select class="shop-sort" aria-label="Sort products">
        <option value="featured">Featured</option>
        <option value="price-low">Price: low to high</option>
        <option value="price-high">Price: high to low</option>
        <option value="az">A-Z</option>
      </select>
    </section>
    <section class="shop-layout">
      <aside class="shop-sidebar reveal" aria-label="Categories">
        <div class="shop-sidebar-head"><h2>Categories</h2></div>
        <div class="category-list" data-category-list></div>
      </aside>
      <div>
        <div class="shop-meta reveal">
          <span data-result-count>Loading products...</span>
          <span data-active-label>All products</span>
        </div>
        <div class="product-grid reveal" data-product-grid><p class="shop-status">Loading shop products...</p></div>
      </div>
      <aside class="basket-panel reveal" aria-label="Basket">
        <div class="basket-head"><h2>Basket</h2></div>
        <div class="basket-items" data-basket-items><p class="basket-empty">No items added yet.</p></div>
        <div class="basket-actions">
          <div class="basket-total"><span>Total</span><strong data-basket-total>&pound;0.00</strong></div>
          <a class="buy-now" data-buy-now href="mailto:info@prime-epos.co.uk?subject=Shop%20order">BUY NOW</a>
          <button class="clear-basket" type="button" data-clear-basket>Clear basket</button>
        </div>
      </aside>
    </section>
  </div>
</main>
<div class="cta-band reveal">
  <h2>Need help choosing<br><em>the right kit?</em></h2>
  <p>Tell us what you run and we will spec a setup that fits your counter, workflow and budget.</p>
  <a href="contact.html" class="btn-primary">Talk to us &rarr;</a>
</div>
${footer}
<script src="assets/js/shop-config.js"></script>
<script>
  let catalogue = null;
  let products = [];
  let activeCategory = "";
  let searchTerm = "";
  let sortMode = "featured";
  let basket = JSON.parse(localStorage.getItem("primeShopBasket") || "[]");

  const grid = document.querySelector("[data-product-grid]");
  const categoryList = document.querySelector("[data-category-list]");
  const resultCount = document.querySelector("[data-result-count]");
  const activeLabel = document.querySelector("[data-active-label]");
  const searchInput = document.querySelector(".shop-search");
  const sortSelect = document.querySelector(".shop-sort");
  const basketItems = document.querySelector("[data-basket-items]");
  const basketTotal = document.querySelector("[data-basket-total]");
  const buyNow = document.querySelector("[data-buy-now]");
  const shopConfig = window.PRIME_SHOP_CONFIG || {};

  const money = (value) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const featuredCategories = new Set(["POS Terminals", "Kiosks", "Printers", "Cash Drawers", "Barcode Scanners", "Displays"]);

  const isFeatured = (product) => product.hasImage && product.purchasable && product.price > 40 && featuredCategories.has(product.category) && !/component|cover|cable|battery|spare|adapter|pcb|case/i.test(product.name);

  const computeCategories = () => [...new Set(products.map((product) => product.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((category) => ({ name: category, count: products.filter((product) => product.category === category).length }));

  const buildCategories = () => {
    const categories = catalogue?.categories?.length ? catalogue.categories : computeCategories();
    if (!activeCategory && categories[0]) activeCategory = categories[0].name;
    const items = categories;
    categoryList.innerHTML = items.map((item) => \`
      <button class="category-button\${item.name === activeCategory ? " is-active" : ""}" type="button" data-category="\${safe(item.name)}">
        <span>\${safe(item.name)}</span>
        <span>\${item.count}</span>
      </button>
    \`).join("");
  };

  const filteredProducts = () => {
    let output = products.filter((product) => {
      if (searchTerm) return true;
      return product.category === activeCategory;
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      output = output.filter((product) => [
        product.name,
        product.sku,
        product.brand,
        product.category,
        product.description,
        ...(product.tags || []),
      ].join(" ").toLowerCase().includes(term));
    }

    if (sortMode === "price-low") output.sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999));
    if (sortMode === "price-high") output.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sortMode === "az") output.sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === "featured") output.sort((a, b) => Number(b.inStock) - Number(a.inStock) || Number(b.hasImage) - Number(a.hasImage) || a.name.localeCompare(b.name));
    return output;
  };

  const renderProducts = () => {
    const visible = filteredProducts();
    resultCount.textContent = \`\${visible.length} product\${visible.length === 1 ? "" : "s"}\`;
    activeLabel.textContent = activeCategory;

    if (!visible.length) {
      grid.innerHTML = '<p class="shop-status">No matching products found.</p>';
      return;
    }

    grid.innerHTML = visible.map((product, index) => \`
      <article class="product-card" style="transition-delay:\${Math.min(index * 0.01, 0.18)}s">
        <div class="product-image">
          \${product.hasImage ? \`<img \${"src"}="\${safe(product.imageUrl)}" alt="\${safe(product.name)}" loading="lazy">\` : '<div class="image-placeholder">Image coming soon</div>'}
        </div>
        <div class="product-body">
          <div class="product-kicker">\${safe(product.brand || product.category)}</div>
          <h3>\${safe(product.name)}</h3>
          <p class="product-desc">\${safe(product.description)}</p>
          <div class="product-tags">\${(product.tags || []).map((tag) => \`<span class="product-tag">\${safe(tag)}</span>\`).join("")}</div>
          <div class="product-foot">
            <span class="product-price">\${safe(product.displayPrice)}</span>
            <button class="add-button" type="button" data-add="\${safe(product.id)}" \${product.purchasable ? "" : "disabled"}>\${product.purchasable ? "Add" : "Soon"}</button>
          </div>
        </div>
      </article>
    \`).join("");
  };

  const saveBasket = () => localStorage.setItem("primeShopBasket", JSON.stringify(basket));

  const renderBasket = () => {
    const totalItems = basket.reduce((sum, item) => sum + item.qty, 0);
    const total = basket.reduce((sum, item) => sum + (item.price * item.qty), 0);
    basketTotal.textContent = money(total);

    if (!basket.length) {
      basketItems.innerHTML = '<p class="basket-empty">No items added yet.</p>';
      buyNow.href = "mailto:info@prime-epos.co.uk?subject=Shop%20order";
      buyNow.textContent = "BUY NOW";
      return;
    }

    basketItems.innerHTML = basket.map((item) => \`
      <div class="basket-item">
        <div>
          <div class="basket-item-name">\${safe(item.name)}</div>
          <div class="basket-item-meta">\${safe(item.displayPrice)} &middot; Qty \${item.qty}</div>
        </div>
        <div class="basket-qty">
          <button type="button" data-dec="\${safe(item.id)}" aria-label="Remove one">-</button>
          <span>\${item.qty}</span>
          <button type="button" data-inc="\${safe(item.id)}" aria-label="Add one">+</button>
        </div>
      </div>
    \`).join("");

    const body = [
      "Hi Prime-EPOS,",
      "",
      "I would like to buy:",
      ...basket.map((item) => \`- \${item.qty} x \${item.name} [\${item.id}] (\${item.displayPrice})\`),
      "",
      \`Total: \${money(total)}\`,
      "",
      "Please confirm payment and delivery details.",
    ].join("\\n");
    buyNow.href = shopConfig.checkoutEndpoint ? "#checkout" : "mailto:info@prime-epos.co.uk?subject=Shop%20order&body=" + encodeURIComponent(body);
    buyNow.textContent = "BUY NOW";
  };

  const normaliseSupabaseProduct = (product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    tags: product.tags || [],
    price: product.price,
    displayPrice: product.display_price || (product.price ? money(product.price) : "Price coming soon"),
    purchasable: Boolean(product.purchasable),
    available: product.available || 0,
    inStock: Boolean(product.in_stock),
    description: product.description || "",
    details: product.details || "",
    imageUrl: product.image_url || "",
    images: product.images || [],
    hasImage: Boolean(product.has_image || product.image_url),
  });

  const loadFromSupabase = async () => {
    if (!shopConfig.supabaseUrl || !shopConfig.supabaseAnonKey) return null;
    const endpoint = shopConfig.supabaseUrl.replace(/\\/$/, "") + "/rest/v1/shop_products?select=*&active=eq.true&order=sort_order.asc,name.asc";
    const response = await fetch(endpoint, {
      headers: {
        apikey: shopConfig.supabaseAnonKey,
        Authorization: "Bearer " + shopConfig.supabaseAnonKey,
      },
    });
    if (!response.ok) throw new Error("Supabase products could not be loaded.");
    const data = await response.json();
    return { products: data.map(normaliseSupabaseProduct), categories: [] };
  };

  const loadFromJson = async () => {
    const response = await fetch("assets/data/shop-products.json");
    if (!response.ok) throw new Error("Local shop products could not be loaded.");
    return response.json();
  };

  document.addEventListener("click", (event) => {
    const categoryButton = event.target.closest("[data-category]");
    const addButton = event.target.closest("[data-add]");
    const incButton = event.target.closest("[data-inc]");
    const decButton = event.target.closest("[data-dec]");

    if (categoryButton) {
      activeCategory = categoryButton.dataset.category;
      searchTerm = "";
      searchInput.value = "";
      buildCategories();
      renderProducts();
    }

    if (addButton) {
      const product = products.find((item) => item.id === addButton.dataset.add);
      if (!product || !product.purchasable) return;
      const existing = basket.find((item) => item.id === product.id);
      if (existing) existing.qty += 1;
      else basket.push({ id: product.id, name: product.name, price: product.price, displayPrice: product.displayPrice, qty: 1 });
      saveBasket();
      renderBasket();
    }

    if (incButton) {
      const item = basket.find((entry) => entry.id === incButton.dataset.inc);
      if (item) item.qty += 1;
      saveBasket();
      renderBasket();
    }

    if (decButton) {
      const item = basket.find((entry) => entry.id === decButton.dataset.dec);
      if (item) item.qty -= 1;
      basket = basket.filter((entry) => entry.qty > 0);
      saveBasket();
      renderBasket();
    }
  });

  document.querySelector("[data-clear-basket]").addEventListener("click", () => {
    basket = [];
    saveBasket();
    renderBasket();
  });

  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value.trim();
    renderProducts();
  });

  sortSelect.addEventListener("change", () => {
    sortMode = sortSelect.value;
    renderProducts();
  });

  buyNow.addEventListener("click", async (event) => {
    if (!basket.length) return;
    if (!shopConfig.checkoutEndpoint || buyNow.href.startsWith("mailto:")) return;
    event.preventDefault();
    buyNow.textContent = "Opening checkout...";
    try {
      const response = await fetch(shopConfig.checkoutEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(shopConfig.supabaseAnonKey ? {
            apikey: shopConfig.supabaseAnonKey,
            Authorization: "Bearer " + shopConfig.supabaseAnonKey,
          } : {}),
        },
        body: JSON.stringify({
          items: basket.map((item) => ({ id: item.id, qty: item.qty })),
          successUrl: new URL(shopConfig.successUrl || "/products.html?checkout=success", location.origin).href,
          cancelUrl: new URL(shopConfig.cancelUrl || "/products.html?checkout=cancelled", location.origin).href,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout could not be opened.");
      location.href = data.url;
    } catch (error) {
      alert(error.message || "Checkout is not ready yet.");
      buyNow.textContent = "BUY NOW";
    }
  });

  Promise.resolve()
    .then(() => loadFromSupabase().catch(() => null))
    .then((data) => data || loadFromJson())
    .then((data) => {
      catalogue = data;
      products = data.products;
      buildCategories();
      renderProducts();
      renderBasket();
    })
    .catch(() => {
      grid.innerHTML = '<p class="shop-status">Shop products could not be loaded. Please run the local server and refresh this page.</p>';
      renderBasket();
    });
</script>
<script src="assets/js/main.js"></script>
</body>
</html>`;
}

const catalogue = await buildCatalogue();
await writeFile(pagePath, buildPage(), "utf8");
console.log(`Rebuilt shop with ${catalogue.stats.productCount} products.`);
console.log(`${catalogue.stats.missingImages} products need an image-coming-soon placeholder.`);
console.log(`${catalogue.stats.missingPrices} products have no usable price.`);
