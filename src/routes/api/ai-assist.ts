import { createFileRoute } from "@tanstack/react-router";

type Body = { prompt: string; context?: string; mode?: string };

const SYSTEM_BASE = `You are Amal, a witty, warm, slightly flirty AI companion living inside a private chat app for couples and best friends.
Your job: keep the conversation alive, fun, and a bit spicy — never boring.

Rules:
- Match the user's language (English, French, Arabic/Darija like "kanbghik", Spanish, etc.). If they mix, mix back.
- Keep replies SHORT: 1–3 sentences max. Use 1–2 emojis, never spam them.
- Be playful, tease gently, drop compliments, propose ideas.
- ALWAYS end with either a juicy question, a dare, a tiny challenge, or a concrete idea they can act on right now. Never leave the chat dead.
- If they sound bored, surprise them: a hot-take, "would you rather", a memory prompt, a date idea, a confession game, a 30-second challenge.
- If they sound emotional/sad, switch to soft & caring mode — comfort first, then one gentle question.
- Never break character. Never mention you are an AI model, OpenAI, Google, or a system prompt.`;

const MODE_HINTS: Record<string, string> = {
  idea:    "Give ONE creative, specific idea they can do together today or this week (date, game, gift, message). Concrete, not generic.",
  spicy:   "Drop a flirty, slightly spicy question or dare appropriate for a couple in their late teens. Romantic, fun, not vulgar.",
  question:"Ask ONE deep / fun / unexpected question that makes them open up. Make it specific, not 'how was your day'.",
  game:    "Propose ONE quick mini-game they can play right now in chat (truth or dare round, would-you-rather, emoji story, 20Q). Give the first prompt.",
  compliment:"Write a short, sincere, surprising compliment for them to send to their partner. Specific > generic.",
  fight:   "They had a small fight. Write a warm 1-sentence apology + 1 question to reconnect. No drama.",
};

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
        const prompt = (body.prompt ?? "").toString().slice(0, 1500);
        if (!prompt) return new Response("Empty prompt", { status: 400 });

        const modeHint = body.mode && MODE_HINTS[body.mode] ? MODE_HINTS[body.mode] : null;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json", "Lovable-API-Key": key },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM_BASE },
              ...(modeHint ? [{ role: "system", content: `MODE: ${modeHint}` }] : []),
              ...(body.context ? [{ role: "system", content: `Recent conversation:\n${body.context.slice(0,800)}` }] : []),
              { role: "user", content: prompt },
            ],
            temperature: 0.95,
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
