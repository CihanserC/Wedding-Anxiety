const MAX = 100;
const PASSIVE_RISE_PER_SECOND = 1.2;

export class AnxietyMeter {
  private value = 0;
  private locked = false;
  private riseFrozenRemaining = 0;

  reset(): void {
    this.value = 0;
  }

  /** Lock anxiety at 0% — no passive rise or adds until reset/unlock. */
  lockAtZero(): void {
    this.value = 0;
    this.locked = true;
  }

  unlock(): void {
    this.locked = false;
  }

  get percent(): number {
    return Math.max(0, Math.min(100, this.value));
  }

  isOverwhelmed(): boolean {
    if (this.locked) return false;
    return this.value >= MAX;
  }

  freezeRise(seconds: number): void {
    this.riseFrozenRemaining = Math.max(this.riseFrozenRemaining, seconds);
  }

  get isRiseFrozen(): boolean {
    return this.riseFrozenRemaining > 0;
  }

  add(amount: number): void {
    if (this.locked || this.riseFrozenRemaining > 0) return;
    this.value = Math.min(MAX, this.value + amount);
  }

  reduce(amount: number): void {
    if (this.locked) {
      this.value = 0;
      return;
    }
    this.value = Math.max(0, this.value - amount);
  }

  update(dt: number, activeCombat: boolean): void {
    if (this.riseFrozenRemaining > 0) {
      this.riseFrozenRemaining = Math.max(0, this.riseFrozenRemaining - dt);
    }
    if (this.locked || !activeCombat || this.riseFrozenRemaining > 0) return;
    this.value = Math.min(MAX, this.value + PASSIVE_RISE_PER_SECOND * dt);
  }
}
