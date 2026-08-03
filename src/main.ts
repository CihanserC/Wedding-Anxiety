import { Game } from './game/Game';

function boot(): void {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('#app container not found');
  }
  const game = new Game(container);
  game.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
