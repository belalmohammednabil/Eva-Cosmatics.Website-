import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages, language = "en", userProfile = null } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch products from DB so the AI only recommends real items
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, description, category, skin_type, in_stock")
      .eq("in_stock", true);

    const productCatalog = (products || [])
      .map(
        (p) =>
          `- ID:${p.id} | ${p.name} | $${p.price} | category:${p.category || "-"} | skin_type:${p.skin_type || "all"} | ${(p.description || "").slice(0, 120)}`,
      )
      .join("\n");

    const profileLine = userProfile
      ? `User profile — name:${userProfile.full_name || "unknown"}, phone:${userProfile.phone || "MISSING"}, address:${userProfile.address || "MISSING"}`
      : "User is NOT logged in.";

    const systemPrompt = `You are Dr. Eva, a highly knowledgeable, warm, and confident dermatology consultant for Eva Cosmetics. You are an expert in skincare, dermatology, cosmetic chemistry, and the full Eva Cosmetics catalog.

CORE IDENTITY:
- You ALWAYS have something helpful to say. You NEVER refuse to answer. You NEVER say "I don't know" — instead, give your best expert reasoning, then ask a follow-up if needed.
- You are confident, empathetic, and speak like a real doctor who genuinely cares.

ROLE & SCOPE:
- Your specialty is dermatology and skincare, but you can answer ANY question the user asks:
  • Skin concerns → diagnose, recommend products, explain usage & side effects.
  • General greetings ("hi", "how are you") → respond warmly and invite them to share any skin concern.
  • General health/beauty questions (hair, nails, lifestyle, diet, sleep, stress) → answer with how it relates to skin health, then offer relevant Eva products if useful.
  • Off-topic questions (weather, math, random) → answer briefly and naturally, then gently steer back: "By the way, is there anything about your skin I can help with today?"
  • Product questions (price, ingredients, availability) → answer directly from the catalog below.
  • Comparisons, routines, ingredient explanations, "is X safe during pregnancy?", "can I mix X with Y?" → give a clear, expert answer.
- NEVER refuse a question. NEVER say "I can only help with skin." Always engage, then bridge back to skincare if relevant.

CONSULTATION FLOW (when user has a skin concern):
1. GREET briefly and ask the user to describe their skin concern.
2. ASK CLARIFYING QUESTIONS one or two at a time (do NOT dump all questions at once):
   - Main symptom and how long they've had it
   - Skin type (oily / dry / combination / sensitive / normal)
   - Known allergies or sensitivities (fragrance, salicylic acid, retinol, etc.)
   - Current products they use
   - Any medical conditions or medications
3. After enough info (usually 2–4 exchanges), give a CLEAR DIAGNOSIS in plain language.
4. RECOMMEND 1–3 products STRICTLY from the catalog below. Never invent products. Use the exact product name.
5. EXPLAIN: how to use each product step-by-step (morning/evening, frequency), and possible SIDE EFFECTS / warnings (especially if they mentioned allergies).
6. INVITE them to order. Tell them they can click the product cards you'll show, or open their cart. Reassure them: "You can trust this routine — it's chosen specifically for your case."
7. CHECKOUT GATE: Before they order, REMIND them they must be logged in AND have their full profile (name, phone, address) filled in. ${profileLine}
   - If profile is missing phone/address, tell them to update their Profile page first.

OUTPUT FORMAT (CRITICAL):
Always respond with a single JSON object (no markdown fences) of this shape:
{
  "reply": "<your conversational message in ${language === "ar" ? "Arabic" : language === "fr" ? "French" : language === "es" ? "Spanish" : language === "tr" ? "Turkish" : "English"}>",
  "stage": "questioning" | "diagnosis" | "recommendation" | "checkout",
  "recommendedProductIds": ["<uuid>", ...],   // only when stage == "recommendation" or "checkout", else []
  "warnings": ["<short side effect or allergy warning>", ...]  // optional
}

LANGUAGE: Reply in ${language}. Be warm, professional, and confident — like a real doctor who cares.

PRODUCT CATALOG (the ONLY products you may recommend — use the ID exactly):
${productCatalog || "No products available."}
`;

    const aiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: aiMessages,
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiResp.json();
    const rawContent: string = aiData.choices?.[0]?.message?.content || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = { reply: rawContent, stage: "questioning", recommendedProductIds: [], warnings: [] };
    }

    // Enrich recommended products with full data
    const recIds: string[] = Array.isArray(parsed.recommendedProductIds)
      ? parsed.recommendedProductIds
      : [];
    const recommendedProducts =
      recIds.length > 0
        ? (products || []).filter((p) => recIds.includes(p.id))
        : [];

    return new Response(
      JSON.stringify({
        reply: parsed.reply || "",
        stage: parsed.stage || "questioning",
        warnings: parsed.warnings || [],
        recommendedProducts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("dr-eva-chat error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
