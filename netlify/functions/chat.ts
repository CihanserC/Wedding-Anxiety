/**
 * Netlify serverless proxy for Gemini Flash free-tier chat.
 * Set GEMINI_API_KEY in Netlify environment variables.
 */

type AiCharacterId = 'darth-vader' | 'master-yoda';

const SYSTEM_PROMPTS: Record<AiCharacterId, string> = {
  'darth-vader': `Sen Darth Vader'sın — Galaktik İmparatorluğun Kara Lordu.
Kurallar:
- Her zaman Türkçe konuş.
- Kısa, otoriter, tehditkâr cümleler kur (en fazla 2-3 cümle).
- Asla rolünden çıkma. Modern veya gerçek dünya konularını Star Wars evrenine çek.
- Oyuncunun adı Hilal olabilir; ona saygıyla ama tehditkâr hitap et.
- "Ben bir yapay zekâyım" deme. Sen Darth Vader'sın.
- Güç, İmparator, isyan, korku, kader temalarını kullan.`,

  'master-yoda': `Sen Usta Yoda'sın — Jedi Ustası, bilge ve şefkatli.
Kurallar:
- Her zaman Türkçe konuş.
- ZORUNLU: Devrik cümleler kur. Özne sonda veya fiil önde olsun.
  Örnekler: "Güç sende var.", "Korku yolunu karanlık yapar.", "Sabırlı olmalısın, genç Padawan."
- En fazla 2 kısa cümle.
- Asla rolünden çıkma. "Ben AI'yım" deme.
- Oyuncunun adı Hilal olabilir; ona "genç Padawan" veya "Hilal" de.`,
};

interface ChatBody {
  characterId?: string;
  message?: string;
  history?: Array<{ role: string; content: string }>;
}

const RATE: Map<string, { count: number; reset: number }> = new Map();
const MAX_PER_WINDOW = 30;
const WINDOW_MS = 60 * 60 * 1000;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  let entry = RATE.get(ip);
  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + WINDOW_MS };
    RATE.set(ip, entry);
  }
  entry.count += 1;
  return entry.count <= MAX_PER_WINDOW;
}

export const handler = async (event: {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
}) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const ip =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown';

  if (!rateLimit(ip)) {
    return { statusCode: 429, headers: cors, body: JSON.stringify({ error: 'Rate limit' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'API not configured' }) };
  }

  let body: ChatBody;
  try {
    body = JSON.parse(event.body || '{}') as ChatBody;
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Bad JSON' }) };
  }

  const characterId = body.characterId as AiCharacterId;
  if (characterId !== 'darth-vader' && characterId !== 'master-yoda') {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Bad character' }) };
  }

  const message = (body.message || '').trim().slice(0, 400);
  if (!message) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Empty message' }) };
  }

  const system = SYSTEM_PROMPTS[characterId];
  const history = (body.history || []).slice(-6);
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const h of history) {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(h.content).slice(0, 500) }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
    encodeURIComponent(apiKey);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          maxOutputTokens: 256,
          temperature: 0.85,
        },
      }),
    });

    if (!res.ok) {
      return {
        statusCode: 502,
        headers: cors,
        body: JSON.stringify({ error: 'Upstream error', status: res.status }),
      };
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      }>;
    };
    // Gemini 3+ may include internal "thought" parts — keep only spoken text.
    const reply =
      data.candidates?.[0]?.content?.parts
        ?.filter((p) => !p.thought && p.text)
        .map((p) => p.text || '')
        .join('')
        .trim() || '';

    if (!reply) {
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'Empty reply' }) };
    }

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: reply.slice(0, 600) }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'Fetch failed', detail: String(err) }),
    };
  }
};
