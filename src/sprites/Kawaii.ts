import Phaser from "phaser";
import { Creature, motionMs } from "./Creature";

const JUMP_H = 10;
const JUMP_MS = motionMs(200);
const SETTLE_MS = motionMs(180);
const RISE_MS = motionMs(150);
const BURY_MS = motionMs(130);
const HIT_FADE_MS = motionMs(120);
const HEART_BREAK_MS = motionMs(450);

type BunnyPalette = {
  ear: number;
  earInner: number;
  body: number;
  nose: number;
};

const BUNNY_PINK: BunnyPalette = {
  ear: 0xff5ca8,
  earInner: 0xff8cc0,
  body: 0xffa8c8,
  nose: 0xff3388,
};

const BUNNY_WHITE: BunnyPalette = {
  ear: 0xdddddd,
  earInner: 0xbbbbbb,
  body: 0xffffff,
  nose: 0x999999,
};

function pickBunnyPalette(): BunnyPalette {
  return Phaser.Math.Between(0, 1) === 0 ? BUNNY_PINK : BUNNY_WHITE;
}

function drawHeartHalf(gfx: Phaser.GameObjects.Graphics, side: number): void {
  const crack = side < 0 ? 1 : -1;
  gfx.fillStyle(0xff3a6a);
  if (side < 0) {
    gfx.fillCircle(-5, -5, 7);
    gfx.fillTriangle(-12, 0, crack, 12, crack, 0);
  } else {
    gfx.fillCircle(5, -5, 7);
    gfx.fillTriangle(crack, 0, 12, 0, crack, 12);
  }
  gfx.fillStyle(0xff8aaa);
  if (side < 0) {
    gfx.fillCircle(-6, -6, 3);
  } else {
    gfx.fillCircle(6, -6, 3);
  }
  gfx.lineStyle(2, 0x1a0818);
  if (side < 0) {
    gfx.lineBetween(1, -9, -1, 14);
    gfx.lineBetween(-1, -4, 2, 2);
  } else {
    gfx.lineBetween(-1, -9, 1, 14);
    gfx.lineBetween(1, -4, -2, 2);
  }
}

export class Kawaii extends Creature {
  constructor(scene: Phaser.Scene, x: number, hideY: number) {
    super(scene, x, hideY, "kawaii");
  }

  protected drawSprite(gfx: Phaser.GameObjects.Graphics): void {
    const palette = pickBunnyPalette();

    gfx.fillStyle(palette.ear);
    gfx.fillRect(-5, -18, 5, 13);
    gfx.fillRect(1, -18, 5, 13);

    gfx.fillStyle(palette.earInner);
    gfx.fillRect(-4, -16, 3, 9);
    gfx.fillRect(2, -16, 3, 9);

    gfx.fillStyle(palette.body);
    gfx.fillCircle(0, -4, 10);
    gfx.fillEllipse(0, 8, 14, 11);

    gfx.fillStyle(0x2a1830);
    gfx.fillCircle(-4, -5, 2);
    gfx.fillCircle(4, -5, 2);

    gfx.fillStyle(palette.nose);
    gfx.fillCircle(0, -2, 2);
  }

  protected playHitEffect(onComplete: () => void): void {
    const wx = this.x;
    const wy = this.y;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: HIT_FADE_MS,
      onComplete: () => {
        this.setVisible(false);
        this.spawnBrokenHeart(wx, wy, onComplete);
      },
    });
  }

  private spawnBrokenHeart(wx: number, wy: number, onComplete: () => void): void {
    const left = this.scene.add.container(wx, wy).setDepth(6);
    const right = this.scene.add.container(wx, wy).setDepth(6);
    const leftGfx = this.scene.add.graphics();
    const rightGfx = this.scene.add.graphics();
    left.add(leftGfx);
    right.add(rightGfx);
    drawHeartHalf(leftGfx, -1);
    drawHeartHalf(rightGfx, 1);

    this.scene.tweens.add({
      targets: left,
      x: wx - 16,
      y: wy - 10,
      angle: -28,
      alpha: 0,
      duration: HEART_BREAK_MS,
      ease: "Quad.Out",
    });

    this.scene.tweens.add({
      targets: right,
      x: wx + 16,
      y: wy - 8,
      angle: 24,
      alpha: 0,
      duration: HEART_BREAK_MS,
      ease: "Quad.Out",
      onComplete: () => {
        left.destroy();
        right.destroy();
        onComplete();
      },
    });
  }

  popup(groundY: number, onComplete: () => void): void {
    if (this.active) return;
    this.active = true;
    const showY = this.showY(groundY);
    const buryY = this.hideY();

    this.scene.tweens.add({
      targets: this,
      y: showY,
      duration: RISE_MS,
      ease: "Back.Out",
      onComplete: () => {
        const holdMs = this.holdMs();
        const hopMs = holdMs - SETTLE_MS;
        const hops = Math.max(2, Math.floor(hopMs / (JUMP_MS * 2)));

        this.scene.tweens.add({
          targets: this,
          y: showY,
          duration: SETTLE_MS,
          ease: "Linear",
          onComplete: () => {
            this.scene.tweens.add({
              targets: this,
              y: showY - JUMP_H,
              duration: JUMP_MS,
              yoyo: true,
              repeat: hops - 1,
              ease: "Quad.InOut",
              onComplete: () => {
                this.y = showY;
                this.scene.tweens.add({
                  targets: this,
                  y: buryY,
                  duration: BURY_MS,
                  ease: "Back.In",
                  onComplete: () => {
                    this.active = false;
                    onComplete();
                  },
                });
              },
            });
          },
        });
      },
    });
  }
}