import { getScriptedFallback } from '../data/aiFallbacks';
import type { AiCharacterId } from '../data/aiPrompts';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const HISTORY_LIMIT = 6;
const FETCH_TIMEOUT_MS = 8000;

/**
 * Hybrid AI chat: tries Netlify Function → Gemini, falls back to scripted lines.
 */
export class AiChatService {
  async chat(
    characterId: AiCharacterId,
    userMessage: string,
    history: ChatMessage[],
  ): Promise<{ reply: string; source: 'api' | 'fallback' }> {
    const trimmed = userMessage.trim().slice(0, 400);
    if (!trimmed) {
      return { reply: getScriptedFallback(characterId, ''), source: 'fallback' };
    }

    try {
      const reply = await this.callApi(characterId, trimmed, history.slice(-HISTORY_LIMIT));
      if (reply) return { reply, source: 'api' };
    } catch {
      // fall through
    }

    return {
      reply: getScriptedFallback(characterId, trimmed),
      source: 'fallback',
    };
  }

  private async callApi(
    characterId: AiCharacterId,
    userMessage: string,
    history: ChatMessage[],
  ): Promise<string | null> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, message: userMessage, history }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { reply?: string };
      const reply = data.reply?.trim();
      return reply || null;
    } finally {
      window.clearTimeout(timer);
    }
  }
}
