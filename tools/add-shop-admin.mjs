const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.argv[2];
const email = process.argv[3];

if (!supabaseUrl || !serviceRoleKey || !userId || !email) {
  console.error("Usage: node tools/add-shop-admin.mjs USER_UID EMAIL");
  console.error("Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/shop_admins?on_conflict=user_id`, {
  method: "POST",
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify([{ user_id: userId, email }]),
});

if (!response.ok) {
  throw new Error(await response.text());
}

console.log(`Added shop admin: ${email}`);
