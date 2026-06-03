import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const siteUrl = Deno.env.get("SITE_URL") ?? "https://prime-epos.co.uk";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!stripeSecretKey || !supabaseUrl || !serviceRoleKey) {
    return json({ error: "Checkout is not configured yet." }, 500);
  }

  try {
    const payload = await request.json();
    const items = Array.isArray(payload.items) ? payload.items : [];

    if (!items.length) {
      return json({ error: "Basket is empty." }, 400);
    }

    const basket = items
      .map((item) => ({
        id: String(item.id || "").trim(),
        qty: Math.max(1, Math.min(50, Number(item.qty) || 1)),
      }))
      .filter((item) => item.id);

    const ids = [...new Set(basket.map((item) => item.id))];
    const productUrl = `${supabaseUrl}/rest/v1/shop_products?select=id,sku,name,price,image_url,purchasable,active&id=in.(${ids.map(encodeURIComponent).join(",")})`;
    const productResponse = await fetch(productUrl, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!productResponse.ok) {
      throw new Error(await productResponse.text());
    }

    const products = await productResponse.json();

    const productById = new Map((products ?? []).map((product) => [product.id, product]));
    const lineItems = basket.map((item) => {
      const product = productById.get(item.id);
      if (!product || !product.active || !product.purchasable || !product.price) {
        throw new Error(`Product is not available for checkout: ${item.id}`);
      }

      return {
        quantity: item.qty,
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(Number(product.price) * 100),
          product_data: {
            name: product.name,
            metadata: { sku: product.sku },
            images: product.image_url ? [product.image_url] : [],
          },
        },
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: payload.successUrl || `${siteUrl}/products.html?checkout=success`,
      cancel_url: payload.cancelUrl || `${siteUrl}/products.html?checkout=cancelled`,
      shipping_address_collection: { allowed_countries: ["GB"] },
      phone_number_collection: { enabled: true },
      billing_address_collection: "required",
      metadata: {
        source: "prime-epos-shop",
      },
    });

    return json({ url: session.url });
  } catch (error) {
    return json({ error: error.message || "Checkout failed." }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
