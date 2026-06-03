window.PRIME_SHOP_CONFIG = {
  // Fill these in from your Supabase project settings when the database is created.
  supabaseUrl: "https://zfrpuqiveuzmkrgpvpfl.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcnB1cWl2ZXV6bWtyZ3B2cGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NjQ5NDUsImV4cCI6MjA5MDU0MDk0NX0.RTIZFfOmDCngtY-zJ2DLZVPtORJnG5HYIuJx0oc4Vls",

  // Example: https://YOUR-PROJECT.supabase.co/functions/v1/create-checkout-session
  checkoutEndpoint: "https://zfrpuqiveuzmkrgpvpfl.supabase.co/functions/v1/create-checkout-session",
  successUrl: "/products.html?checkout=success",
  cancelUrl: "/products.html?checkout=cancelled",
};
