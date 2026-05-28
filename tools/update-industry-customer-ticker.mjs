import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const root = join(toolsDir, "..");
const siteRoot = join(root, "prime-epos");
const industriesDir = join(siteRoot, "industries");
const customersDir = join(siteRoot, "assets", "images", "customers");

const heroImages = {
  "hospitality.html": "../assets/images/icrtouch/touchpoint/image-2.jpg",
  "retail.html": "../assets/images/industries/retail.jpg",
  "venues.html": "../assets/images/industries/venues.jpg",
  "services.html": "../assets/images/industries/services.jpg",
};

const logoFiles = (await readdir(customersDir))
  .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
  .sort((a, b) => a.localeCompare(b));

const tidyName = (name) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/^Customer-logos-800x400-/i, "")
    .replace(/_?800x400(px)?/gi, "")
    .replace(/_Colour|BlueRGB|Positive|footer|new/gi, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+\d+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

const logoMarkup = logoFiles
  .map((name) => {
    const src = `../assets/images/customers/${name}`;
    const alt = tidyName(name) || "Customer logo";
    return `      <div class="customer-logo-item"><img src="${src}" alt="${alt}"></div>`;
  })
  .join("\n");

const ticker = `<!-- CUSTOMER LOGOS -->
<section class="customer-ticker" aria-label="Customers using our services">
  <div class="customer-ticker-header">
    <p class="section-label">Trusted by teams across the UK</p>
  </div>
  <div class="customer-ticker-track">
${logoMarkup}
${logoMarkup}
  </div>
</section>`;

for (const [file, heroImage] of Object.entries(heroImages)) {
  const path = join(industriesDir, file);
  let html = await readFile(path, "utf8");

  html = html.replace(
    /(<div class="industry-hero-media">\s*<img src=")[^"]+(" alt="[^"]+">\s*<\/div>)/,
    `$1${heroImage}$2`
  );

  html = html.replace(/\n\s*\.venue-card-icon \{[^}]*\}/g, "");
  html = html.replace(/<div class="venue-card"><div class="venue-card-icon">[\s\S]*?<\/div><div class="venue-card-name">([^<]+)<\/div><\/div>/g, '<div class="venue-card"><div class="venue-card-name">$1</div></div>');
  html = html.replace(/<!-- CUSTOMER LOGOS -->[\s\S]*?<\/section>\s*/, "");
  html = html.replace(/<\/section>\s*<!-- VENUE TYPES -->/, `</section>\n\n${ticker}\n\n<!-- VENUE TYPES -->`);

  await writeFile(path, html, "utf8");
  console.log(`Updated ${file}`);
}
