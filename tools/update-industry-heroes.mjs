import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const root = join(toolsDir, "..");
const industriesDir = join(root, "prime-epos", "industries");

const pages = {
  "hospitality.html": {
    eyebrow: "Hospitality EPoS",
    title: "EPoS that keeps up<br>when it's <em>manic.</em>",
    text: "From the first pint pulled to last orders, our hospitality EPoS is built for speed, reliability, and the kind of pressure only a Saturday night service can deliver.",
    image: "../assets/images/icrtouch/touchpoint/image-2.jpg",
    alt: "Hospitality EPoS in a busy bar",
    external: "https://icrtouch.com/wp-content/uploads/TouchPoint_Bar_1024x576px.jpg",
  },
  "retail.html": {
    eyebrow: "Retail EPoS",
    title: "Smarter retail starts<br><em>at the till.</em>",
    text: "Connect your stock, loyalty, and sales data into one reliable system, whether you're running one shop or fifty.",
    image: "../assets/images/icrtouch/touchoffice/image-2.jpg",
    alt: "Retail EPoS reporting and stock management",
    external: "https://icrtouch.com/wp-content/uploads/VenuesEvents-retail-1024.jpg",
  },
  "venues.html": {
    eyebrow: "Venues &amp; Events EPoS",
    title: "Big crowds.<br><em>No compromises.</em>",
    text: "When thousands of people need serving at once, your EPoS needs to be bulletproof. We build systems that scale to the moment and keep trading no matter what.",
    image: "../assets/images/icrtouch/ticketing/image-3.jpg",
    alt: "Venue and event ticketing EPoS",
    external: "https://icrtouch.com/wp-content/uploads/VenuesEvents_1024x576px.jpg",
  },
  "services.html": {
    eyebrow: "Services EPoS",
    title: "EPoS built for<br><em>service businesses.</em>",
    text: "Appointment-based, walk-in, or both, our EPoS solutions handle payments, bookings, loyalty, and reporting for every kind of service business.",
    image: "../assets/images/icrtouch/touchreservation/image-2.jpg",
    alt: "Service business booking and EPoS tools",
    external: "https://icrtouch.com/wp-content/uploads/TouchPOint-ProductPage-Cafe-1024.jpg",
  },
};

const cleanups = [
  ["\u00e2\u20ac\u2122", "'"],
  ["\u00e2\u20ac\u02dc", "'"],
  ["\u00e2\u20ac\u0153", '"'],
  ["\u00e2\u20ac\ufffd", '"'],
  ["\u00e2\u20ac\u201c", "&ndash;"],
  ["\u00e2\u20ac\u009d", "&mdash;"],
  ["\u00e2\u20ac\u0094", "&mdash;"],
  ["\u00c2\u00b7", "&middot;"],
  ["\u00c2\u00a3", "&pound;"],
  ["\u00c2\u00a9", "&copy;"],
  ["\u00c2\u00ae", "&reg;"],
  ["Caf\u00c3\u00a9s", "Cafes"],
];

for (const [file, data] of Object.entries(pages)) {
  const path = join(industriesDir, file);
  let html = await readFile(path, "utf8");

  for (const [bad, good] of cleanups) {
    html = html.split(bad).join(good);
  }

  html = html.replace(/\s*\/\* Scrolling sub-industry text \*\/[\s\S]*?@keyframes scrollText \{[\s\S]*?\}\s*\n/, "\n");

  const hero = `<!-- HERO -->
<section class="page-hero industry-hero">
  <div class="industry-hero-inner">
    <div class="industry-hero-copy">
      <p class="hero-eyebrow">${data.eyebrow}</p>
      <h1>${data.title}</h1>
      <p>${data.text}</p>
    </div>
    <div class="industry-hero-media">
      <img src="${data.image}" alt="${data.alt}">
    </div>
  </div>
</section>`;

  html = html.replace(/<!-- HERO -->[\s\S]*?<\/section>/, hero);
  html = html.replace(data.external, data.image);

  await writeFile(path, html, "utf8");
  console.log(`Updated ${file}`);
}
