import Phaser from "phaser";
import { Creature, motionMs } from "./Creature";

export type MonsterVariant = "skeleton" | "zombie";

type SkeletonPalette = {
  bone: number;
  boneDark: number;
  socket: number;
};

const SKELETON_GRAY: SkeletonPalette = {
  bone: 0xd8ccb0,
  boneDark: 0xc8bca0,
  socket: 0x1a1028,
};

const SKELETON_GREEN: SkeletonPalette = {
  bone: 0x6a8a4a,
  boneDark: 0x4a6a32,
  socket: 0x142010,
};

type ZombiePalette = {
  flesh: number;
  fleshDark: number;
  rot: number;
  socket: number;
};

const ZOMBIE_GREEN: ZombiePalette = {
  flesh: 0x5a9a4a,
  fleshDark: 0x3a6a32,
  rot: 0x2a4a22,
  socket: 0x142010,
};

const ZOMBIE_GRAY: ZombiePalette = {
  flesh: 0x8a9a7a,
  fleshDark: 0x6a7a62,
  rot: 0x4a5248,
  socket: 0x1a1818,
};

const RISE_MS = motionMs(150);
const BURY_MS = motionMs(130);
const GAS_DISSOLVE_MS = motionMs(500);

const GAS_COLORS = [0x5a9a3a, 0x4a8a32, 0x3a7a28, 0x6aaa4a];

function pickMonsterVariant(): MonsterVariant {
  return Phaser.Math.Between(0, 1) === 0 ? "skeleton" : "zombie";
}

function pickSkeletonPalette(): SkeletonPalette {
  return Math.random() < 0.5 ? SKELETON_GRAY : SKELETON_GREEN;
}

function pickZombiePalette(): ZombiePalette {
  return Math.random() < 0.5 ? ZOMBIE_GREEN : ZOMBIE_GRAY;
}

function drawSkeletonSprite(gfx: Phaser.GameObjects.Graphics): void {
  const palette = pickSkeletonPalette();

  gfx.fillStyle(palette.bone);
  gfx.fillCircle(0, -8, 9);

  gfx.fillStyle(palette.socket);
  gfx.fillCircle(-4, -9, 3);
  gfx.fillCircle(4, -9, 3);

  gfx.fillStyle(palette.boneDark);
  gfx.fillRect(-6, -2, 12, 5);

  gfx.lineStyle(2, palette.bone);
  gfx.lineBetween(0, 0, 0, 14);
  for (let x = -8; x <= 8; x += 4) {
    gfx.lineBetween(x, 4, x, 14);
  }

  gfx.lineBetween(-10, 2, -6, 8);
  gfx.lineBetween(10, 2, 6, 8);
}

function drawZombieSprite(gfx: Phaser.GameObjects.Graphics): void {
  const palette = pickZombiePalette();

  gfx.fillStyle(palette.flesh);
  gfx.fillEllipse(0, -7, 18, 16);

  gfx.fillStyle(palette.fleshDark);
  gfx.fillEllipse(0, 6, 16, 14);

  gfx.fillStyle(palette.rot);
  gfx.fillRect(-7, -4, 5, 4);
  gfx.fillRect(4, 2, 6, 3);
  gfx.fillRect(-5, 8, 4, 3);

  gfx.fillStyle(palette.socket);
  gfx.fillCircle(-4, -8, 3);
  gfx.fillCircle(5, -7, 2);

  gfx.fillStyle(palette.fleshDark);
  gfx.fillRect(-4, -1, 9, 4);

  gfx.fillStyle(palette.socket);
  gfx.fillRect(-2, 0, 5, 2);

  gfx.lineStyle(2, palette.fleshDark);
  gfx.lineBetween(-11, 4, -8, 12);
  gfx.lineBetween(10, 3, 7, 11);
  gfx.lineBetween(-3, 12, -3, 16);
  gfx.lineBetween(3, 12, 4, 16);
}

export class Monster extends Creature {
  readonly variant: MonsterVariant;

  constructor(
    scene: Phaser.Scene,
    x: number,
    hideY: number,
    variant: MonsterVariant = pickMonsterVariant(),
  ) {
    super(scene, x, hideY, "monster");
    this.variant = variant;
    this.mountSprite();
  }

  protected drawSprite(gfx: Phaser.GameObjects.Graphics): void {
    if (this.variant === "skeleton") {
      drawSkeletonSprite(gfx);
      return;
    }
    drawZombieSprite(gfx);
  }

  protected playHitEffect(onComplete: () => void): void {
    const wx = this.x;
    const wy = this.y;
    const gas = this.scene.add.container(wx, wy).setDepth(6);

    for (let i = 0; i < 8; i++) {
      const blob = this.scene.add.circle(
        Phaser.Math.Between(-14, 14),
        Phaser.Math.Between(-16, 12),
        Phaser.Math.Between(5, 13),
        Phaser.Utils.Array.GetRandom(GAS_COLORS),
        Phaser.Math.FloatBetween(0.45, 0.9),
      );
      gas.add(blob);

      this.scene.tweens.add({
        targets: blob,
        x: blob.x + Phaser.Math.Between(-12, 12),
        y: blob.y + Phaser.Math.Between(-16, -2),
        scaleX: Phaser.Math.FloatBetween(1.2, 2),
        scaleY: Phaser.Math.FloatBetween(1.2, 2.2),
        alpha: 0,
        duration: GAS_DISSOLVE_MS,
        ease: "Quad.Out",
      });
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.15,
      scaleY: 0.85,
      duration: motionMs(280),
      ease: "Sine.Out",
    });

    this.scene.time.delayedCall(GAS_DISSOLVE_MS, () => {
      gas.destroy();
      onComplete();
    });
  }

  popup(groundY: number, onComplete: () => void): void {
    if (this.active) return;
    this.active = true;
    const showY = this.showY(groundY);
    const buryY = this.hideY();

    this.scene.tweens.chain({
      targets: this,
      tweens: [
        { y: showY, duration: RISE_MS, ease: "Back.Out" },
        { y: showY, duration: this.holdMs(), ease: "Linear" },
        { y: buryY, duration: BURY_MS, ease: "Back.In" },
      ],
      onComplete: () => {
        this.active = false;
        onComplete();
      },
    });
  }
}