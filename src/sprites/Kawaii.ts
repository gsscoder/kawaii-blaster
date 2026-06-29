import Phaser from "phaser";
import { Creature } from "./Creature";

const JUMP_H = 10;
const JUMP_MS = 200;
const SETTLE_MS = 180;

export class Kawaii extends Creature {
  constructor(scene: Phaser.Scene, x: number, hideY: number) {
    super(scene, x, hideY, "kawaii");
  }

  protected drawSprite(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(0xf0c0d8);
    gfx.fillRect(-5, -18, 5, 13);
    gfx.fillRect(1, -18, 5, 13);

    gfx.fillStyle(0xffb0c8);
    gfx.fillRect(-4, -16, 3, 9);
    gfx.fillRect(2, -16, 3, 9);

    gfx.fillStyle(0xf0d0e0);
    gfx.fillCircle(0, -4, 10);
    gfx.fillEllipse(0, 8, 14, 11);

    gfx.fillStyle(0x2a1830);
    gfx.fillCircle(-4, -5, 2);
    gfx.fillCircle(4, -5, 2);

    gfx.fillStyle(0xffa0b8);
    gfx.fillCircle(0, -2, 2);
  }

  popup(groundY: number, onComplete: () => void): void {
    if (this.active) return;
    this.active = true;
    const showY = this.showY(groundY);
    const buryY = this.hideY();

    this.scene.tweens.add({
      targets: this,
      y: showY,
      duration: 150,
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
                  duration: 130,
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