// Blym photo analysis function (runs on Supabase Edge Functions).
// It receives a water photo, asks Google Gemini to look for signs of a harmful algal bloom,
// and returns a small JSON result. The Gemini key is read from a secret, never from the app.

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-flash-latest";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROMPT = `You help neighbors in Gwinnett County, Georgia screen photos of small lakes and ponds for possible harmful algal blooms (cyanobacteria / blue-green algae).
Classify the photo:
- "harmful": signs of a possible cyanobacteria bloom (bright green, blue-green, or paint-like water; spilled-paint or pea-soup look; surface scum; streaks; turquoise shoreline crust).
- "harmless": likely pollen (yellow film), duckweed (tiny separate floating leaves), filamentous green algae mats, mud, leaves, or clear water.
- "unclear": too dark, blurry, far away, not water, or genuinely ambiguous.
Also report what you can see: water color, whether scum or film is present, and which look-alike it most resembles if any.
Reply ONLY with JSON: {"verdict":"harmful"|"harmless"|"unclear","confidence":"low"|"medium"|"high","waterColor":"short phrase","greenOrPaintLike":true|false,"scumVisible":true|false,"lookalike":"pollen"|"duckweed"|"filamentous algae"|"mud"|"none","explanation":"1-2 plain sentences"}
Never claim the water is safe or toxic for certain.`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!GEMINI_KEY) return json({ error: "AI is not configured" }, 500);
  try {
    const { image, mime } = await req.json();
    if (typeof image !== "string" || image.length < 100 || image.length > 4_000_000) {
      return json({ error: "Please send one photo under 3 MB" }, 400);
    }
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime || "image/jpeg", data: image } }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    });
    if (!r.ok) return json({ error: "AI request failed", status: r.status }, 502);
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: "AI gave no result" }, 502);
    return json(JSON.parse(match[0]));
  } catch (_e) {
    return json({ error: "Something went wrong" }, 500);
  }
});
