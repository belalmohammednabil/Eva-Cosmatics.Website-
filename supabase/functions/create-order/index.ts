import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface IncomingItem {
  product_id?: unknown;
  quantity?: unknown;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ---- Authentication (required) ----
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Authentication required" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user) {
      return json({ error: "Authentication required" }, 401);
    }

    // ---- Input validation ----
    let body: { items?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const rawItems = Array.isArray(body?.items) ? (body.items as IncomingItem[]) : null;
    if (!rawItems || rawItems.length === 0 || rawItems.length > 50) {
      return json({ error: "items must be a non-empty array (max 50)" }, 400);
    }

    const requested = new Map<string, number>();
    for (const item of rawItems) {
      const id = typeof item?.product_id === "string" ? item.product_id : "";
      const qty = Number(item?.quantity);
      if (!UUID_RE.test(id)) {
        return json({ error: "Each item requires a valid product_id" }, 400);
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        return json({ error: "Each item requires a quantity between 1 and 99" }, 400);
      }
      requested.set(id, (requested.get(id) ?? 0) + qty);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ---- Trusted prices straight from the catalog ----
    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, name, price, in_stock")
      .in("id", [...requested.keys()]);

    if (productsError) {
      console.error("Product lookup failed:", productsError.message);
      return json({ error: "Could not verify products" }, 500);
    }

    const available = (products ?? []).filter((p) => p.in_stock !== false);
    if (available.length !== requested.size) {
      return json({ error: "One or more products are unavailable" }, 400);
    }

    let total = 0;
    const orderItems = available.map((p) => {
      const quantity = requested.get(p.id)!;
      const price = Number(p.price);
      total += price * quantity;
      return {
        product_id: p.id,
        product_name: p.name,
        quantity,
        price,
      };
    });
    total = Math.round(total * 100) / 100;

    // ---- Contact details come from the stored profile, not the client ----
    const { data: profile } = await admin
      .from("profiles")
      .select("phone, address")
      .eq("user_id", user.id)
      .maybeSingle();

    const phone = profile?.phone?.trim() || "";
    if (!phone) {
      return json({ error: "A phone number is required on your profile" }, 400);
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        total,
        status: "pending",
        shipping_address: profile?.address ?? null,
        phone_number: phone,
      })
      .select("id, total")
      .single();

    if (orderError || !order) {
      console.error("Order insert failed:", orderError?.message);
      return json({ error: "Could not create the order" }, 500);
    }

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

    if (itemsError) {
      console.error("Order items insert failed:", itemsError.message);
      await admin.from("orders").delete().eq("id", order.id);
      return json({ error: "Could not create the order" }, 500);
    }

    return json({ order_id: order.id, total: order.total });
  } catch (e) {
    console.error("create-order error:", e instanceof Error ? e.message : e);
    return json({ error: "Unexpected error" }, 500);
  }
});
