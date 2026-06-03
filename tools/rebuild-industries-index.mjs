import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const root = join(toolsDir, "..");
const pagePath = join(root, "prime-epos", "industries.html");

let html = await readFile(pagePath, "utf8");

const css = `<style>
  .industry-index {
    padding: 58px 5vw 92px;
    background:
      linear-gradient(180deg, #f4f2ee 0%, #efede8 100%);
  }

  .industry-index-inner {
    max-width: 1440px;
    margin: 0 auto;
  }

  .industry-index-head {
    display: grid;
    grid-template-columns: minmax(0, 0.82fr) minmax(320px, 1fr);
    gap: clamp(2rem, 5vw, 5rem);
    align-items: end;
    margin-bottom: 2rem;
  }

  .industry-index-head p {
    color: var(--mid);
    line-height: 1.7;
    max-width: 680px;
  }

  .industry-columns {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  .industry-card {
    display: block;
    position: relative;
    width: 100%;
    min-height: 270px;
    overflow: hidden;
    border: 1px solid rgba(15, 15, 15, 0.12);
    border-radius: 8px;
    background: #101010;
    color: var(--white);
    text-decoration: none;
    box-shadow: 0 16px 36px rgba(15, 15, 15, 0.1);
    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
  }

  .industry-card:hover,
  .industry-card:focus-visible {
    transform: translateY(-3px);
    border-color: rgba(255, 106, 0, 0.75);
    box-shadow: 0 20px 44px rgba(255, 106, 0, 0.18), 0 18px 42px rgba(15, 15, 15, 0.14);
  }

  .industry-card img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.74;
    transition: transform 0.42s ease, opacity 0.22s ease;
  }

  .industry-card:hover img,
  .industry-card:focus-visible img {
    transform: scale(1.035);
    opacity: 0.84;
  }

  .industry-card::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.84)),
      radial-gradient(circle at 18% 16%, rgba(255, 106, 0, 0.38), transparent 34%);
  }

  .industry-card-copy {
    position: absolute;
    inset: auto 0 0;
    z-index: 1;
    padding: 1.35rem;
  }

  .industry-card-copy h2 {
    color: var(--white);
    font-family: var(--font-display);
    font-size: clamp(1.75rem, 2.4vw, 2.55rem);
    line-height: 1;
    letter-spacing: 0;
    margin-bottom: 0.55rem;
  }

  .industry-card-copy p {
    color: rgba(255, 255, 255, 0.72);
    line-height: 1.5;
    margin-bottom: 0.85rem;
  }

  .sector-card-cta {
    color: var(--accent);
    font-family: var(--font-display);
    font-size: 0.82rem;
    font-weight: 800;
  }

  .industry-type-box {
    margin-top: 0.8rem;
    padding: 0.85rem;
    border: 1px solid rgba(15, 15, 15, 0.1);
    border-radius: 8px;
    background: #fffdf8;
    box-shadow: 0 14px 32px rgba(15, 15, 15, 0.055);
  }

  .industry-type-box-head {
    margin-bottom: 0.75rem;
  }

  .industry-type-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }

  .industry-type-card {
    display: block;
    min-height: 0;
    padding: 0.75rem;
    border: 1px solid rgba(15, 15, 15, 0.1);
    border-radius: 8px;
    background: #f7f3eb;
    color: inherit;
    text-decoration: none;
    box-shadow: 0 12px 28px rgba(15, 15, 15, 0.045);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .industry-type-card:hover,
  .industry-type-card:focus-visible {
    transform: translateY(-3px);
    border-color: rgba(255, 106, 0, 0.55);
    background: #fff8ef;
    box-shadow: 0 18px 38px rgba(255, 106, 0, 0.14), 0 14px 30px rgba(15, 15, 15, 0.08);
  }

  .industry-type-name {
    color: var(--black);
    font-family: var(--font-display);
    font-size: 0.94rem;
    font-weight: 800;
    line-height: 1.18;
  }

  .industry-type-fit {
    display: block;
    margin-top: 0.35rem;
    color: var(--mid);
    font-size: 0.8rem;
    line-height: 1.4;
  }

  @media (max-width: 1180px) {
    .industry-columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 820px) {
    .industry-index-head,
    .industry-columns {
      grid-template-columns: 1fr;
    }

    .industry-index {
      padding-top: 42px;
    }

    .industry-card {
      min-height: 230px;
    }
  }
</style>`;

const groups = [
  {
    id: "hospitality",
    href: "industries/hospitality.html",
    label: "Hospitality",
    title: "Hospitality",
    image: "assets/images/icrtouch/touchpoint/image-2.jpg",
    body: "For fast-paced food and drink service where table management, kitchen communication, loyalty and payment speed matter.",
    cta: "Explore hospitality",
    types: [
      ["Pubs & bars", "TouchPoint, PocketTouch, loyalty and promotions"],
      ["Restaurants", "Table plans, split bills, kitchen screens and reservations"],
      ["Cafes & coffee shops", "Fast service, simple menus and loyalty"],
      ["Takeaways", "Online ordering, kitchen screens and collection points"],
      ["Hotels", "Multi-area sales, reporting and staff control"],
      ["Nightclubs", "Fast tills, promotions and secure staff audit trails"],
      ["Food trucks", "Portable EPoS and reliable offline trading"],
      ["Bakeries", "Quick sales, stock visibility and simple reporting"],
      ["Members' clubs", "Tabs, loyalty, members pricing and audit control"],
    ],
  },
  {
    id: "retail",
    href: "industries/retail.html",
    label: "Retail",
    title: "Retail",
    image: "assets/images/industries/retail.jpg",
    body: "For shops that need fast barcode sales, stock control, reporting, loyalty, age prompts and multi-site management.",
    cta: "Explore retail",
    types: [
      ["Convenience stores", "Barcode sales, age checks, stock and promotions"],
      ["Supermarkets", "Multi-lane sales, stock, reporting and staff controls"],
      ["Florists", "Simple sales, customer records and seasonal promotions"],
      ["Butchers", "Scales, pricing, stock and fast counter service"],
      ["Cash & carry", "Bulk sales, customer pricing and detailed reporting"],
      ["Farm shops", "Stock control, weighable items and local loyalty"],
      ["Off-licences", "Age prompts, promotions and quick checkout"],
      ["Newsagents", "Fast sales, barcode scanning and reporting"],
      ["Pop-up shops", "Portable tills and easy temporary setup"],
    ],
  },
  {
    id: "venues",
    href: "industries/venues.html",
    label: "Venues & Events",
    title: "Venues & Events",
    image: "assets/images/industries/venues.jpg",
    body: "For high-footfall venues where queues, speed, access control, admissions and multi-outlet reporting matter.",
    cta: "Explore venues",
    types: [
      ["Stadiums", "High-volume tills, stock, reporting and cashless options"],
      ["Theatres", "Ticketing, bars, intervals and stock reporting"],
      ["Cinemas", "Fast concessions, ticketing and promotions"],
      ["Museums", "Retail, cafes, admissions and reporting"],
      ["Arenas", "Multi-outlet control and fast peak trading"],
      ["Festivals", "Portable sales, offline trading and cashless setup"],
      ["Leisure centres", "Memberships, payments and reporting"],
      ["Theme parks", "Ticketing, food outlets and retail stock"],
      ["Heritage sites", "Admissions, gift shops and cafe service"],
    ],
  },
  {
    id: "services",
    href: "industries/services.html",
    label: "Services",
    title: "Services",
    image: "assets/images/industries/services.jpg",
    body: "For businesses selling services, memberships, products, appointments, deposits and customer loyalty.",
    cta: "Explore services",
    types: [
      ["Hairdressers", "Payments, deposits, retail products and loyalty"],
      ["Barbers", "Fast checkout, staff tracking and repeat-customer rewards"],
      ["Spas", "Packages, gift vouchers and appointment deposits"],
      ["Gyms", "Memberships, product sales and reporting"],
      ["Dog groomers", "Bookings, payments and customer records"],
      ["Vets", "Retail products, payments and reporting"],
      ["Dentists", "Payments, deposits and customer account records"],
      ["Repair shops", "Jobs, parts, payments and customer history"],
      ["Tattoo studios", "Deposits, bookings and product sales"],
    ],
  },
];

const htmlText = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

const htmlAttr = (value) => htmlText(value).replace(/"/g, "&quot;");

const columnMarkup = groups.map((group) => `      <div class="industry-column">
        <a class="industry-card" href="${htmlAttr(group.href)}">
        <img src="${group.image}" alt="">
        <span class="industry-card-copy">
          <span class="section-label">${htmlText(group.label)}</span>
          <h2>${htmlText(group.title)}</h2>
          <p>${htmlText(group.body)}</p>
          <span class="sector-card-cta">${htmlText(group.cta)} &rarr;</span>
        </span>
        </a>
        <section class="industry-type-box" id="${htmlAttr(group.id)}-types">
        <div class="industry-type-box-head">
          <p class="section-label">${htmlText(group.label)} types</p>
        </div>
        <div class="industry-type-grid">
${group.types.map(([name, fit]) => `          <a class="industry-type-card" href="${htmlAttr(group.href)}">
            <span>
              <span class="industry-type-name">${htmlText(name)}</span>
              <span class="industry-type-fit">${htmlText(fit)}</span>
            </span>
          </a>`).join("\n")}
        </div>
        </section>
      </div>`).join("\n");

const main = `<section class="page-hero">
  <p class="hero-eyebrow">Industries we serve</p>
  <h1>Find the EPoS setup for<br><em>your</em> kind of business.</h1>
  <p>A simple overview of the sectors we work with and the business types we support inside each one.</p>
</section>

<section class="industry-index">
  <div class="industry-index-inner">
    <div class="industry-index-head reveal">
      <div>
        <p class="section-label">Industries</p>
        <h2 class="section-heading">Where Prime-EPOS fits.</h2>
      </div>
    </div>

    <div class="industry-columns reveal" aria-label="Industries and business types">
${columnMarkup}
    </div>
  </div>
</section>

<div class="cta-band reveal">
  <h2>Not sure which sector<br><em>fits you best?</em></h2>
  <p>Tell us how you trade and we'll point you in the right direction.</p>
  <a href="contact.html" class="btn-primary">Talk to us &rarr;</a>
</div>`;

html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>Industries We Serve - Prime-EPOS</title>");
html = html.replace(/<style>[\s\S]*?<\/style>/, css);
html = html.replace(/<section class="page-hero">[\s\S]*?<footer class="site-footer">/, `${main}\n\n<footer class="site-footer">`);

await writeFile(pagePath, html, "utf8");
console.log("Rebuilt industries.html");
