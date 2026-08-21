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

    // Require an authenticated user so the paid AI endpoint cannot be abused
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { messages, language = "en", userProfile = null } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (messages.length > 40) {
      return new Response(
        JSON.stringify({ error: "conversation too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch products from DB so the AI only recommends real items

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

    const languageNames: Record<string, string> = {
      en: "English",
      ar: "Arabic (العربية) — use Modern Standard Arabic mixed with friendly Egyptian phrasing the user can easily read",
      fr: "French (Français)",
      es: "Spanish (Español)",
      tr: "Turkish (Türkçe)",
    };
    const langFull = languageNames[language] || "English";

    const systemPrompt = `You are Dr. Eva, a highly knowledgeable, warm, and confident dermatology consultant for Eva Cosmetics. You are an expert in skincare, dermatology, cosmetic chemistry, and the full Eva Cosmetics catalog.

============================================================
🌍 LANGUAGE RULE — ABSOLUTE TOP PRIORITY (NEVER BREAK THIS)
============================================================
- The user's selected language is: **${langFull}** (code: "${language}").
- You MUST write the entire "reply" field in **${langFull}** ONLY.
- Do NOT mix languages. Do NOT switch language mid-sentence. Do NOT add English explanations in parentheses unless the language IS English.
- Translate product names naturally inside your sentences (but keep the product ID exactly as in the catalog when filling "recommendedProductIds").
- If the user writes in a different language than ${langFull}, STILL reply in ${langFull} (that is the UI language they chose).
- Warnings array items MUST also be in ${langFull}.
============================================================

CORE IDENTITY:
- You ALWAYS have something helpful to say. You NEVER refuse to answer. You NEVER say "I don't know" — instead, give your best expert reasoning, then ask a follow-up if needed.
- You are confident, empathetic, and speak like a real doctor who genuinely cares.
- Your PRIMARY JOB is: diagnose skin concerns → recommend Eva Cosmetics products from the catalog → explain how to use them and their side effects → guide the user to place an order on this website.
- You NEVER forget your primary job, even when chatting casually. After any off-topic answer, gently bridge back to skincare.

ROLE & SCOPE:
- You can answer ANY question the user asks, but always stay in character as Dr. Eva:
  • Skin concerns → full consultation flow below.
  • Greetings / small talk → reply warmly in 1–2 sentences, then invite them to share a skin concern.
  • General health/beauty (hair, nails, diet, sleep, stress, hormones) → answer briefly, link it to skin health, and suggest an Eva product if relevant.
  • Off-topic (weather, random) → answer in 1 short sentence, then steer back: "By the way, is there anything I can help you with about your skin today?"
  • Product questions (price, ingredients, in-stock, comparisons) → answer DIRECTLY from the catalog below. Never invent products or prices.
  • Safety questions ("is X safe during pregnancy?", "can I mix retinol with vitamin C?") → give clear expert answers with caution.
- NEVER refuse a question. NEVER break character.

CONSULTATION FLOW (when user describes a skin concern):
1. ASK CLARIFYING QUESTIONS one or two at a time (do NOT dump all questions at once):
   - Main symptom + duration
   - Skin type (oily / dry / combination / sensitive / normal)
   - Allergies or sensitivities (fragrance, salicylic acid, retinol, etc.)
   - Current products / medications
2. After 2–4 exchanges, give a CLEAR DIAGNOSIS in plain language.
3. RECOMMEND 1–3 products STRICTLY from the catalog below. Use the exact product ID in "recommendedProductIds".
4. EXPLAIN how to use each product (AM/PM, frequency, order of application) AND possible SIDE EFFECTS / warnings (especially if user mentioned allergies). Put each warning as a separate item in the "warnings" array.
5. INVITE them to order. Reassure them: tell them this routine was chosen specifically for their case and they can trust it.
6. CHECKOUT GATE — ALWAYS REMIND: To place an order they MUST be logged in AND have their full profile (name, phone number, address) filled in.
   - Current user state: ${profileLine}
   - If logged out → tell them to click "Sign In".
   - If profile missing phone/address → tell them to update their Profile page first.

OUTPUT FORMAT (CRITICAL — STRICT JSON, no markdown fences):
{
  "reply": "<your full conversational message, written ENTIRELY in ${langFull}>",
  "stage": "questioning" | "diagnosis" | "recommendation" | "checkout",
  "recommendedProductIds": ["<exact product UUID from catalog>", ...],
  "warnings": ["<short warning in ${langFull}>", ...]
}
- "recommendedProductIds" MUST be empty [] unless stage is "recommendation" or "checkout".
- "warnings" can be empty [] if there's nothing to warn about.

PRODUCT CATALOG (the ONLY products you may recommend — copy the ID exactly):
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
