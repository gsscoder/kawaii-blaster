import Phaser from "phaser";
import { Creature, motionMs } from "./Creature";

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

const RISE_MS = motionMs(150);
const BURY_MS = motionMs(130);
const GAS_DISSOLVE_MS = motionMs(500);

const GAS_COLORS = [0x5a9a3a, 0x4a8a32, 0x3a7a28, 0x6aaa4a];

function pickSkeletonPalette(): SkeletonPalette {
  return Math.random() < 0.5 ? SKELETON_GRAY : SKELETON_GREEN;
}

export class Monster extends Creature {
  constructor(scene: Phaser.Scene, x: number, hideY: number) {
    super(scene, x, hideY, "monster");
  }

  protected drawSprite(gfx: Phaser.GameObjects.Graphics): void {
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