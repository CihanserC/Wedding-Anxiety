export type CommandSubmitResult =
  | string
  | null
  | { help: string };

export interface CommandConsoleCallbacks {
  onSubmit: (command: string) => CommandSubmitResult;
  onClose: () => void;
}

export class CommandConsole {
  private readonly root: HTMLDivElement;
  private readonly input: HTMLInputElement;
  private readonly errorEl: HTMLParagraphElement;
  private readonly helpWrap: HTMLDivElement;
  private readonly helpEditor: HTMLTextAreaElement;
  private readonly callbacks: CommandConsoleCallbacks;
  private open = false;
  private helpOpen = false;

  constructor(container: HTMLElement, callbacks: CommandConsoleCallbacks) {
    this.callbacks = callbacks;
    this.root = document.createElement('div');
    this.root.className = 'wa-console-overlay';
    this.root.innerHTML = `
      <div class="wa-console-panel">
        <label class="wa-console-label" for="wa-console-input">Komut</label>
        <input id="wa-console-input" class="wa-console-input" type="text" autocomplete="off" spellcheck="false" />
        <p class="wa-console-error" hidden></p>
        <div class="wa-console-help" hidden>
          <div class="wa-console-help-bar">
            <span class="wa-console-help-title">cheat_codes.txt</span>
            <span class="wa-console-help-meta">salt okunur</span>
          </div>
          <textarea class="wa-console-help-editor" readonly spellcheck="false"></textarea>
        </div>
        <p class="wa-console-hint">Enter - Çalıştır · Esc - Kapat · help - Kod listesi</p>
      </div>
    `;
    container.appendChild(this.root);
    this.input = this.root.querySelector('#wa-console-input') as HTMLInputElement;
    this.errorEl = this.root.querySelector('.wa-console-error') as HTMLParagraphElement;
    this.helpWrap = this.root.querySelector('.wa-console-help') as HTMLDivElement;
    this.helpEditor = this.root.querySelector('.wa-console-help-editor') as HTMLTextAreaElement;
    CommandConsole.ensureStyles();
    this.hide();

    this.input.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        event.preventDefault();
        this.submit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      }
    });

    this.helpEditor.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      }
    });
  }

  isOpen(): boolean {
    return this.open;
  }

  openConsole(): void {
    this.open = true;
    this.input.value = '';
    this.setError(null);
    this.hideHelpEditor(false);
    this.root.style.display = 'flex';
    window.setTimeout(() => this.input.focus(), 0);
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.hideHelpEditor(false);
    this.hide();
    this.setError(null);
    this.callbacks.onClose();
  }

  private hide(): void {
    this.root.style.display = 'none';
  }

  private submit(): void {
    const result = this.callbacks.onSubmit(this.input.value);
    if (result && typeof result === 'object' && 'help' in result) {
      this.setError(null);
      if (this.helpOpen) {
        this.hideHelpEditor(true);
      } else {
        this.showHelpEditor(result.help);
      }
      this.input.select();
      return;
    }
    if (typeof result === 'string') {
      this.setError(result);
      this.input.select();
      return;
    }
    this.close();
  }

  private showHelpEditor(text: string): void {
    this.helpEditor.value = text;
    this.helpWrap.hidden = false;
    // Force reflow so the slide transition runs.
    void this.helpWrap.offsetHeight;
    this.helpWrap.classList.add('wa-console-help--open');
    this.helpOpen = true;
    window.setTimeout(() => {
      this.helpEditor.scrollTop = 0;
      this.helpEditor.focus();
    }, 180);
  }

  private hideHelpEditor(animate: boolean): void {
    this.helpOpen = false;
    this.helpWrap.classList.remove('wa-console-help--open');
    if (!animate) {
      this.helpWrap.hidden = true;
      this.helpEditor.value = '';
      return;
    }
    window.setTimeout(() => {
      if (!this.helpOpen) {
        this.helpWrap.hidden = true;
        this.helpEditor.value = '';
      }
    }, 220);
  }

  private setError(message: string | null): void {
    if (!message) {
      this.errorEl.hidden = true;
      this.errorEl.textContent = '';
      return;
    }
    this.errorEl.hidden = false;
    this.errorEl.textContent = message;
  }

  private static stylesInjected = false;
  static ensureStyles(): void {
    if (CommandConsole.stylesInjected) return;
    CommandConsole.stylesInjected = true;
    const css = `
      .wa-console-overlay {
        position: absolute;
        inset: 0;
        display: none;
        align-items: flex-start;
        justify-content: center;
        padding-top: 14vh;
        background: rgba(8, 4, 18, 0.55);
        backdrop-filter: blur(2px);
        z-index: 30;
        pointer-events: auto;
      }
      .wa-console-panel {
        width: min(520px, calc(100% - 32px));
        background: linear-gradient(160deg, rgba(36, 18, 72, 0.98), rgba(18, 8, 36, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 12px;
        padding: 16px 18px 14px;
        color: #f4ecff;
        font-family: 'Consolas', 'Courier New', monospace;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
      }
      .wa-console-label {
        display: block;
        margin-bottom: 8px;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(244, 236, 255, 0.65);
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      }
      .wa-console-input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid rgba(200, 121, 255, 0.45);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.35);
        color: #fff8ff;
        font: inherit;
        font-size: 15px;
        padding: 10px 12px;
        outline: none;
      }
      .wa-console-input:focus {
        border-color: #c879ff;
        box-shadow: 0 0 0 2px rgba(200, 121, 255, 0.2);
      }
      .wa-console-error {
        margin: 10px 0 0;
        font-size: 13px;
        color: #ff8f9d;
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      }
      .wa-console-help {
        margin-top: 12px;
        overflow: hidden;
        max-height: 0;
        opacity: 0;
        transform: translateY(-8px);
        transition: max-height 0.22s ease, opacity 0.2s ease, transform 0.22s ease;
        border: 1px solid rgba(200, 121, 255, 0.28);
        border-radius: 8px;
        background: rgba(6, 2, 14, 0.92);
      }
      .wa-console-help--open {
        max-height: 280px;
        opacity: 1;
        transform: translateY(0);
      }
      .wa-console-help-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 7px 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(48, 24, 88, 0.65);
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      }
      .wa-console-help-title {
        font-size: 12px;
        color: #e8d8ff;
      }
      .wa-console-help-meta {
        font-size: 10px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgba(244, 236, 255, 0.45);
      }
      .wa-console-help-editor {
        display: block;
        width: 100%;
        height: 220px;
        box-sizing: border-box;
        margin: 0;
        border: 0;
        resize: none;
        outline: none;
        padding: 10px 12px 12px;
        background: transparent;
        color: #d8ffe8;
        font: inherit;
        font-size: 12px;
        line-height: 1.45;
        white-space: pre;
        overflow: auto;
        caret-color: #c879ff;
      }
      .wa-console-help-editor:focus {
        background: rgba(255, 255, 255, 0.02);
      }
      .wa-console-hint {
        margin: 10px 0 0;
        font-size: 11px;
        color: rgba(244, 236, 255, 0.5);
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-style: italic;
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}
