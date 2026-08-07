import { AI_CHARACTER_META, type AiCharacterId } from '../data/aiPrompts';
import { AiChatService, type ChatMessage } from '../game/AiChatService';

export interface AiChatBoxCallbacks {
  onClose: () => void;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

/**
 * Free-text AI chat overlay for Darth Vader / Master Yoda.
 * Includes optional Web Speech API mic input.
 */
export class AiChatBox {
  private readonly root: HTMLDivElement;
  private readonly logEl: HTMLDivElement;
  private readonly inputEl: HTMLInputElement;
  private readonly micBtn: HTMLButtonElement;
  private readonly service = new AiChatService();
  private characterId: AiCharacterId = 'darth-vader';
  private history: ChatMessage[] = [];
  private busy = false;
  private visible = false;
  private recognition: SpeechRecognitionLike | null = null;
  private listening = false;

  constructor(
    container: HTMLElement,
    private readonly callbacks: AiChatBoxCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'wa-ai-chat';
    this.root.innerHTML = `
      <div class="wa-ai-panel">
        <div class="wa-ai-header">
          <span class="wa-ai-name"></span>
          <button type="button" class="wa-ai-close" aria-label="Kapat">×</button>
        </div>
        <div class="wa-ai-log"></div>
        <form class="wa-ai-form">
          <button type="button" class="wa-ai-mic" title="Mikrofon" aria-label="Mikrofon">🎤</button>
          <input class="wa-ai-input" type="text" maxlength="400" placeholder="Yaz veya konuş…" autocomplete="off" />
          <button type="submit" class="wa-ai-send">Gönder</button>
        </form>
        <p class="wa-ai-hint">Esc ile kapat · Mikrofon Chrome/Edge'te çalışır</p>
      </div>
    `;
    container.appendChild(this.root);
    this.logEl = this.root.querySelector('.wa-ai-log') as HTMLDivElement;
    this.inputEl = this.root.querySelector('.wa-ai-input') as HTMLInputElement;
    this.micBtn = this.root.querySelector('.wa-ai-mic') as HTMLButtonElement;
    AiChatBox.ensureStyles();

    this.root.querySelector('.wa-ai-close')!.addEventListener('click', () => this.close());
    this.root.querySelector('.wa-ai-form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      void this.send();
    });
    this.micBtn.addEventListener('click', () => this.toggleMic());
    this.inputEl.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
    window.addEventListener('keydown', (e) => {
      if (!this.visible) return;
      if (e.code === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
    this.hide();
  }

  open(characterId: AiCharacterId): void {
    this.characterId = characterId;
    this.history = [];
    this.logEl.innerHTML = '';
    const meta = AI_CHARACTER_META[characterId];
    const nameEl = this.root.querySelector('.wa-ai-name') as HTMLSpanElement;
    nameEl.textContent = meta.displayName;
    this.root.dataset.theme = meta.theme;
    this.visible = true;
    this.root.style.display = 'flex';
    this.inputEl.value = '';
    this.appendSystem(
      characterId === 'darth-vader'
        ? 'Kara Lord seni dinliyor…'
        : 'Usta Yoda hazır. Konuş, genç Padawan.',
    );
    window.setTimeout(() => this.inputEl.focus(), 50);
  }

  close(): void {
    this.stopMic();
    this.hide();
    this.callbacks.onClose();
  }

  isVisible(): boolean {
    return this.visible;
  }

  private hide(): void {
    this.visible = false;
    this.root.style.display = 'none';
  }

  private appendSystem(text: string): void {
    const div = document.createElement('div');
    div.className = 'wa-ai-msg wa-ai-system';
    div.textContent = text;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  private appendMsg(role: 'user' | 'assistant', text: string): void {
    const div = document.createElement('div');
    div.className = `wa-ai-msg wa-ai-${role}`;
    div.textContent = text;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  private async send(override?: string): Promise<void> {
    if (this.busy) return;
    const text = (override ?? this.inputEl.value).trim();
    if (!text) return;
    this.inputEl.value = '';
    this.appendMsg('user', text);
    this.history.push({ role: 'user', content: text });
    this.busy = true;
    this.inputEl.disabled = true;

    const thinking = document.createElement('div');
    thinking.className = 'wa-ai-msg wa-ai-assistant wa-ai-thinking';
    thinking.textContent = '…';
    this.logEl.appendChild(thinking);

    const thinkMs = 1000 + Math.floor(Math.random() * 1000); // 1–2s pause
    const delay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, thinkMs);
    });

    try {
      const [{ reply }] = await Promise.all([
        this.service.chat(this.characterId, text, this.history),
        delay,
      ]);
      thinking.remove();
      this.appendMsg('assistant', reply);
      this.history.push({ role: 'assistant', content: reply });
    } catch {
      await delay;
      thinking.remove();
      this.appendMsg('assistant', '…bağlantı koptu. Yine de buradayım.');
    } finally {
      this.busy = false;
      this.inputEl.disabled = false;
      this.inputEl.focus();
    }
  }

  private toggleMic(): void {
    if (this.listening) {
      this.stopMic();
      return;
    }
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    if (!SR) {
      this.appendSystem('Mikrofon bu tarayıcıda desteklenmiyor. Yazarak devam et.');
      return;
    }
    this.recognition = new SR();
    this.recognition.lang = 'tr-TR';
    this.recognition.interimResults = false;
    this.recognition.continuous = false;
    this.recognition.onresult = (ev) => {
      const transcript = ev.results[0]?.[0]?.transcript?.trim();
      if (transcript) void this.send(transcript);
    };
    this.recognition.onerror = () => this.stopMic();
    this.recognition.onend = () => this.stopMic();
    try {
      this.recognition.start();
      this.listening = true;
      this.micBtn.classList.add('listening');
      this.appendSystem('Dinliyorum…');
    } catch {
      this.appendSystem('Mikrofon başlatılamadı.');
      this.stopMic();
    }
  }

  private stopMic(): void {
    this.listening = false;
    this.micBtn.classList.remove('listening');
    try {
      this.recognition?.stop();
    } catch {
      // ignore
    }
    this.recognition = null;
  }

  private static stylesAdded = false;
  private static ensureStyles(): void {
    if (AiChatBox.stylesAdded) return;
    AiChatBox.stylesAdded = true;
    const style = document.createElement('style');
    style.textContent = `
      .wa-ai-chat {
        position: absolute; inset: 0; z-index: 45;
        display: none; align-items: flex-end; justify-content: center;
        padding: 0 12px 18px;
        background: rgba(0,0,0,0.35);
        font-family: "Segoe UI", system-ui, sans-serif;
      }
      .wa-ai-panel {
        width: min(520px, 96vw);
        max-height: min(70vh, 520px);
        display: flex; flex-direction: column;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      }
      .wa-ai-chat[data-theme="vader"] .wa-ai-panel {
        background: linear-gradient(160deg, #1a0808 0%, #0c0408 100%);
        border: 1px solid rgba(200,40,40,0.45);
      }
      .wa-ai-chat[data-theme="yoda"] .wa-ai-panel {
        background: linear-gradient(160deg, #0c1a0c 0%, #081208 100%);
        border: 1px solid rgba(80,160,60,0.45);
      }
      .wa-ai-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      .wa-ai-name { color: #f0e8e0; font-weight: 600; letter-spacing: 0.03em; }
      .wa-ai-chat[data-theme="vader"] .wa-ai-name { color: #ff6060; }
      .wa-ai-chat[data-theme="yoda"] .wa-ai-name { color: #90e070; }
      .wa-ai-close {
        background: transparent; border: none; color: #aaa; font-size: 1.4rem; cursor: pointer;
      }
      .wa-ai-log {
        flex: 1; overflow-y: auto; padding: 12px 14px;
        display: flex; flex-direction: column; gap: 8px; min-height: 180px;
      }
      .wa-ai-msg {
        max-width: 90%; padding: 8px 12px; border-radius: 10px;
        font-size: 0.92rem; line-height: 1.4;
      }
      .wa-ai-user {
        align-self: flex-end; background: rgba(255,255,255,0.12); color: #eee;
      }
      .wa-ai-assistant {
        align-self: flex-start; background: rgba(0,0,0,0.35); color: #f0e8e0;
      }
      .wa-ai-chat[data-theme="vader"] .wa-ai-assistant { border-left: 3px solid #c02020; }
      .wa-ai-chat[data-theme="yoda"] .wa-ai-assistant { border-left: 3px solid #50a040; }
      .wa-ai-system { align-self: center; color: #889; font-size: 0.8rem; background: transparent; }
      .wa-ai-thinking { opacity: 0.6; font-style: italic; }
      .wa-ai-form {
        display: flex; gap: 6px; padding: 10px 12px;
        border-top: 1px solid rgba(255,255,255,0.08);
      }
      .wa-ai-input {
        flex: 1; padding: 8px 10px; border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.35);
        color: #fff; font-size: 0.95rem;
      }
      .wa-ai-send, .wa-ai-mic {
        padding: 8px 12px; border-radius: 6px; cursor: pointer;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.08); color: #eee;
      }
      .wa-ai-mic.listening { background: rgba(220,60,60,0.45); }
      .wa-ai-hint {
        margin: 0; padding: 0 12px 8px; color: #667; font-size: 0.72rem;
      }
    `;
    document.head.appendChild(style);
  }
}
