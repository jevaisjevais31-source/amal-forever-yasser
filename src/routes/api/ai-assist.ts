import { createFileRoute } from "@tanstack/react-router";

type Body = { prompt: string; context?: string };

export const Route = createFileRoute("/api/ai-assist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "AI not configured" }), {
            status: 500, headers: { "content-type": "application/json" },
          });
        }
        let body: Body;
        try { body = await request.json() as Body; }
        catch { return new Response("Bad JSON", { status: 400 }); }
        const prompt = (body.prompt ?? "").toString().slice(0, 1000);
        if (!prompt) return new Response("Empty prompt", { status: 400 });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json", "Lovable-API-Key": key },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are Amal, a sweet, witty, playful AI assistant inside a private chat app for couples and best friends. Be warm, concise (max 2 sentences), use 1-2 emojis. Match the language the user writes in." },
              ...(body.context ? [{ role: "system", content: `Conversation context: ${body.context.slice(0,500)}` }] : []),
              { role: "user", content: prompt },
            ],
          }),
        });
        if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limit, try again in a moment 💖" }), { status: 429, headers: { "content-type": "application/json" } });
        if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted — add credits in Lovable Cloud." }), { status: 402, headers: { "content-type": "application/json" } });
        if (!res.ok) return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { "content-type": "application/json" } });
        const data = await res.json() as { choices?: { message?: { content?: string } }[] };
        const text = data.choices?.[0]?.message?.content ?? "…";
        return new Response(JSON.stringify({ text }), { headers: { "content-type": "application/json" } });
      },
    },
  },
});
