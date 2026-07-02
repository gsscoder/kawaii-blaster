import Phaser from "phaser";
import { Creature, motionMs } from "./Creature";

export type MonsterVariant = "skeleton" | "zombie";

type SkeletonPalette = {
  bone: number;
  boneDark: number;
  socket: number;
};

const SKELETON_WHITE: SkeletonPalette = {
  bone: 0xe8dcc8,
  boneDark: 0xc8b8a0,
  socket: 0x1a1028,
};

const SKELETON_GRAY: SkeletonPalette = {
  bone: 0xa8a090,
  boneDark: 0x888070,
  socket: 0x1a1028,
};

const ZOMBIE = {
  skin: 0x7aaa5a,
  skinDark: 0x5a8a42,
  shirt: 0x5a6a3a,
  shirtDark: 0x3a4a28,
  pants: 0x3a4a32,
  pantsDark: 0x2a3a22,
  belt: 0x2a2818,
  eye: 0xe8c820,
  socket: 0x1a1810,
  teeth: 0xd8d8c0,
  outline: 0x1a1810,
} as const;

const RISE_MS = motionMs(150);
const BURY_MS = motionMs(130);
const GAS_DISSOLVE_MS = motionMs(500);

const GAS_COLORS = [0x5a9a3a, 0x4a8a32, 0x3a7a28, 0x6aaa4a];

function pickMonsterVariant(): MonsterVariant {
  return Phaser.Math.Between(0, 1) === 0 ? "skeleton" : "zombie";
}

function pickSkeletonPalette(): SkeletonPalette {
  return Math.random() < 0.5 ? SKELETON_WHITE : SKELETON_GRAY;
}

function drawSkeletonBones(gfx: Phaser.GameObjects.Graphics, palette: SkeletonPalette): void {
  const outline = 0x0a0808;

  // Blocky skull (inspired by classic pixel art skeleton)
  gfx.fillStyle(outline);
  gfx.fillRect(-8, -17, 16, 13);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-7, -16, 14, 11);

  // Rectangular eye sockets
  gfx.fillStyle(palette.socket);
  gfx.fillRect(-6, -13, 4, 4);
  gfx.fillRect(2, -13, 4, 4);

  // Nose cavity
  gfx.fillStyle(palette.socket);
  gfx.fillRect(-1, -8, 2, 2);

  // Jaw / teeth line
  gfx.fillStyle(palette.boneDark);
  gfx.fillRect(-5, -5, 10, 2);
  gfx.fillStyle(outline);
  gfx.fillRect(-4, -4, 1, 1);
  gfx.fillRect(-1, -4, 1, 1);
  gfx.fillRect(2, -4, 1, 1);

  // Neck
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-2, -4, 4, 3);

  // Shoulders
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-9, -1, 18, 3);

  // Torso base (shadow)
  gfx.fillStyle(palette.boneDark);
  gfx.fillRect(-8, 2, 16, 14);

  // Distinct horizontal ribs (more detail)
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-8, 2, 16, 2);
  gfx.fillRect(-8, 5, 16, 2);
  gfx.fillRect(-8, 8, 16, 2);
  gfx.fillRect(-8, 11, 16, 2);
  gfx.fillRect(-8, 14, 16, 2);

  // Spine column
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-1, 2, 2, 14);

  // Side rib segments for extra retro detail
  gfx.fillStyle(palette.boneDark);
  gfx.fillRect(-9, 3, 2, 1);
  gfx.fillRect(-9, 6, 2, 1);
  gfx.fillRect(-9, 9, 2, 1);
  gfx.fillRect(-9, 12, 2, 1);
  gfx.fillRect(7, 3, 2, 1);
  gfx.fillRect(7, 6, 2, 1);
  gfx.fillRect(7, 9, 2, 1);
  gfx.fillRect(7, 12, 2, 1);

  // Pelvis
  gfx.fillStyle(palette.boneDark);
  gfx.fillRect(-7, 15, 14, 3);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-5, 16, 10, 2);

  // Left leg — femur, knee, tibia, foot
  gfx.fillStyle(outline);
  gfx.fillRect(-8, 17, 4, 9);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-7, 18, 2, 7);
  gfx.fillStyle(palette.boneDark);
  gfx.fillRect(-7, 25, 2, 2);
  gfx.fillStyle(outline);
  gfx.fillRect(-8, 27, 4, 8);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-7, 28, 2, 6);
  gfx.fillStyle(outline);
  gfx.fillRect(-10, 34, 7, 3);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-9, 35, 5, 2);

  // Right leg — femur, knee, tibia, foot
  gfx.fillStyle(outline);
  gfx.fillRect(4, 17, 4, 9);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(5, 18, 2, 7);
  gfx.fillStyle(palette.boneDark);
  gfx.fillRect(5, 25, 2, 2);
  gfx.fillStyle(outline);
  gfx.fillRect(4, 27, 4, 8);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(5, 28, 2, 6);
  gfx.fillStyle(outline);
  gfx.fillRect(3, 34, 7, 3);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(4, 35, 5, 2);

  // Left arm — upper arm, elbow, forearm, fingers
  gfx.fillStyle(outline);
  gfx.fillRect(-15, 0, 4, 10);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-14, 1, 2, 8);
  gfx.fillStyle(palette.boneDark);
  gfx.fillRect(-14, 9, 2, 2);
  gfx.fillStyle(outline);
  gfx.fillRect(-17, 10, 4, 9);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(-16, 11, 2, 7);
  gfx.fillRect(-18, 18, 2, 3);
  gfx.fillRect(-16, 19, 2, 3);
  gfx.fillRect(-14, 18, 2, 3);

  // Right arm — upper arm, elbow, forearm, fingers
  gfx.fillStyle(outline);
  gfx.fillRect(11, 0, 4, 10);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(12, 1, 2, 8);
  gfx.fillStyle(palette.boneDark);
  gfx.fillRect(12, 9, 2, 2);
  gfx.fillStyle(outline);
  gfx.fillRect(13, 10, 4, 9);
  gfx.fillStyle(palette.bone);
  gfx.fillRect(14, 11, 2, 7);
  gfx.fillRect(16, 18, 2, 3);
  gfx.fillRect(14, 19, 2, 3);
  gfx.fillRect(12, 18, 2, 3);
}

function drawSkeletonSprite(gfx: Phaser.GameObjects.Graphics): void {
  drawSkeletonBones(gfx, pickSkeletonPalette());
}

function drawZombieSprite(gfx: Phaser.GameObjects.Graphics): void {
  // Head — large blocky skull-face (reference template)
  gfx.fillStyle(ZOMBIE.outline);
  gfx.fillRect(-9, -18, 18, 14);
  gfx.fillStyle(ZOMBIE.skin);
  gfx.fillRect(-8, -17, 16, 12);
  gfx.fillStyle(ZOMBIE.skinDark);
  gfx.fillRect(-8, -17, 16, 3);

  // Hollow sockets with glowing yellow eyes
  gfx.fillStyle(ZOMBIE.socket);
  gfx.fillRect(-6, -13, 4, 4);
  gfx.fillRect(2, -13, 4, 4);
  gfx.fillStyle(ZOMBIE.eye);
  gfx.fillRect(-5, -12, 2, 2);
  gfx.fillRect(3, -12, 2, 2);

  // Sunken nose and open jaw
  gfx.fillStyle(ZOMBIE.socket);
  gfx.fillRect(-1, -8, 2, 2);
  gfx.fillRect(-5, -4, 10, 4);
  gfx.fillStyle(ZOMBIE.teeth);
  gfx.fillRect(-4, -4, 2, 2);
  gfx.fillRect(-1, -4, 2, 2);
  gfx.fillRect(2, -4, 2, 2);

  // Neck
  gfx.fillStyle(ZOMBIE.skin);
  gfx.fillRect(-2, -4, 4, 3);

  // Tattered short-sleeve shirt
  gfx.fillStyle(ZOMBIE.outline);
  gfx.fillRect(-8, -1, 16, 16);
  gfx.fillStyle(ZOMBIE.shirt);
  gfx.fillRect(-7, 0, 14, 14);
  gfx.fillStyle(ZOMBIE.shirtDark);
  gfx.fillRect(-6, 2, 5, 4);
  gfx.fillRect(2, 5, 4, 3);
  gfx.fillRect(-3, 9, 3, 2);
  gfx.fillRect(1, 11, 4, 2);

  // Ragged short sleeves (expose green arms below)
  gfx.fillStyle(ZOMBIE.shirt);
  gfx.fillRect(-9, 0, 3, 4);
  gfx.fillRect(6, 0, 3, 4);

  // Belt
  gfx.fillStyle(ZOMBIE.belt);
  gfx.fillRect(-7, 13, 14, 2);

  // Pants — wide stance, separated from torso
  gfx.fillStyle(ZOMBIE.outline);
  gfx.fillRect(-11, 15, 6, 20);
  gfx.fillRect(5, 15, 6, 20);
  gfx.fillStyle(ZOMBIE.pants);
  gfx.fillRect(-10, 16, 4, 18);
  gfx.fillRect(6, 16, 4, 18);
  gfx.fillStyle(ZOMBIE.pantsDark);
  gfx.fillRect(-10, 24, 4, 2);
  gfx.fillRect(6, 25, 4, 2);
  gfx.fillRect(-9, 17, 2, 3);
  gfx.fillRect(7, 18, 2, 2);

  // Feet — sickly green, splayed outward
  gfx.fillStyle(ZOMBIE.outline);
  gfx.fillRect(-13, 34, 8, 4);
  gfx.fillRect(5, 34, 8, 4);
  gfx.fillStyle(ZOMBIE.skin);
  gfx.fillRect(-12, 35, 6, 2);
  gfx.fillRect(6, 35, 6, 2);

  // Left arm — hangs at side with clear gap from body
  gfx.fillStyle(ZOMBIE.outline);
  gfx.fillRect(-17, 0, 4, 10);
  gfx.fillStyle(ZOMBIE.skin);
  gfx.fillRect(-16, 1, 2, 8);
  gfx.fillStyle(ZOMBIE.outline);
  gfx.fillRect(-18, 10, 4, 10);
  gfx.fillStyle(ZOMBIE.skin);
  gfx.fillRect(-17, 11, 2, 8);
  gfx.fillStyle(ZOMBIE.skinDark);
  gfx.fillRect(-17, 18, 2, 2);
  gfx.fillRect(-19, 20, 2, 3);
  gfx.fillRect(-17, 21, 2, 3);
  gfx.fillRect(-15, 20, 2, 3);

  // Right arm — raised forward, elbow bent, claw hand
  gfx.fillStyle(ZOMBIE.outline);
  gfx.fillRect(12, -1, 4, 10);
  gfx.fillStyle(ZOMBIE.skin);
  gfx.fillRect(13, 0, 2, 8);
  gfx.fillStyle(ZOMBIE.outline);
  gfx.fillRect(14, -11, 4, 12);
  gfx.fillStyle(ZOMBIE.skin);
  gfx.fillRect(15, -10, 2, 10);
  gfx.fillStyle(ZOMBIE.skinDark);
  gfx.fillRect(16, -14, 2, 3);
  gfx.fillRect(18, -13, 2, 3);
  gfx.fillRect(16, -11, 2, 2);
  gfx.fillRect(18, -10, 2, 2);
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