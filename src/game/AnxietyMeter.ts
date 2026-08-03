const MAX = 100;
const PASSIVE_RISE_PER_SECOND = 1.2;

export class AnxietyMeter {
  private value = 0;

  reset(): void {
    this.value = 0;
  }

  get percent(): number {
    return Math.max(0, Math.min(100, this.value));
  }

  isOverwhelmed(): boolean {
    return this.value >= MAX;
  }

  add(amount: number): void {
    this.value = Math.min(MAX, this.value + amount);
  }

  reduce(amount: number): void {
    this.value = Math.max(0, this.value - amount);
  }

  update(dt: number, activeCombat: boolean): void {
    if (!activeCombat) return;
    this.value = Math.min(MAX, this.value + PASSIVE_RISE_PER_SECOND * dt);
  }
}
