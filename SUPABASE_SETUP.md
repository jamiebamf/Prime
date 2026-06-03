# Prime-EPOS Supabase Setup

## 1. Create the database tables

Open Supabase SQL Editor and run:

```sql
-- Use the contents of supabase/shop-schema.sql
```

File:

```text
supabase/shop-schema.sql
```

## 2. Add yourself as shop admin

Create your admin user in Supabase Auth first.

Then run this in SQL Editor, replacing the email:

```sql
insert into public.shop_admins (user_id, email)
select id, email
from auth.users
where email = 'YOUR_EMAIL_HERE'
on conflict (user_id) do nothing;
```

## 3. Import products

Set these environment variables locally:

```powershell
$env:SUPABASE_URL="https://zfrpuqiveuzmkrgpvpfl.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
node tools/push-products-to-supabase.mjs
```

Never put the service-role key in website files.

## 4. Deploy the checkout function

Install Supabase CLI, log in, then deploy:

```powershell
supabase functions deploy create-checkout-session --project-ref zfrpuqiveuzmkrgpvpfl
```

Set function secrets:

```powershell
supabase secrets set STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY" --project-ref zfrpuqiveuzmkrgpvpfl
supabase secrets set SITE_URL="https://prime-epos.co.uk" --project-ref zfrpuqiveuzmkrgpvpfl
```

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions automatically.

## 5. Public site config

Already set in:

```text
prime-epos/assets/js/shop-config.js
```

The shop will use Supabase when available, otherwise it falls back to local JSON.
