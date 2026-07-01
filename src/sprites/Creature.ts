import Phaser from "phaser";

export type CreatureKind = "kawaii" | "monster";

const HIT_W = 36;
const HIT_H = 40;

export const HOLD_MIN_MS = 1000;
export const HOLD_MAX_MS = 1600;
const MOTION_SCALE = 1 / 0.85;

export function motionMs(ms: number): number {
  return Math.round(ms * MOTION_SCALE);
}

export abstract class Creature extends Phaser.GameObjects.Container {
  readonly kind: CreatureKind;
  protected active = false;
  private retired = false;

  constructor(scene: Phaser.Scene, x: number, hideY: number, kind: CreatureKind) {
    super(scene, x, hideY);
    this.kind = kind;
    scene.add.existing(this);
    this.setDepth(5);
  }

  protected mountSprite(): void {
    const gfx = this.scene.add.graphics();
    this.drawSprite(gfx);
    this.add(gfx);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-HIT_W / 2, -HIT_H / 2, HIT_W, HIT_H),
      Phaser.Geom.Rectangle.Contains,
    );
  }

  protected abstract drawSprite(gfx: Phaser.GameObjects.Graphics): void;

  abstract popup(groundY: number, onComplete: () => void): void;

  protected showY(groundY: number): number {
    return groundY - 24;
  }

  protected hideY(): number {
    return this.y + 80;
  }

  protected holdMs(): number {
    return Phaser.Math.Between(HOLD_MIN_MS, HOLD_MAX_MS);
  }

  isRetired(): boolean {
    return this.retired;
  }

  hit(): void {
    if (this.retired) return;
    this.retired = true;
    this.active = false;
    this.disableInteractive();
    this.scene.tweens.killTweensOf(this);
    this.playHitEffect(() => this.destroy());
  }

  retire(): void {
    if (this.retired) return;
    this.retired = true;
    this.active = false;
    this.scene.tweens.killTweensOf(this);
    this.destroy();
  }

  protected abstract playHitEffect(onComplete: () => void): void;
}