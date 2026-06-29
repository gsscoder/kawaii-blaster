import Phaser from "phaser";
import { Creature } from "./Creature";

export class Monster extends Creature {
  constructor(scene: Phaser.Scene, x: number, hideY: number) {
    super(scene, x, hideY, "monster");
  }

  protected drawSprite(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(0xd8ccb0);
    gfx.fillCircle(0, -8, 9);

    gfx.fillStyle(0x1a1028);
    gfx.fillCircle(-4, -9, 3);
    gfx.fillCircle(4, -9, 3);

    gfx.fillStyle(0xc8bca0);
    gfx.fillRect(-6, -2, 12, 5);

    gfx.lineStyle(2, 0xd8ccb0);
    gfx.lineBetween(0, 0, 0, 14);
    for (let x = -8; x <= 8; x += 4) {
      gfx.lineBetween(x, 4, x, 14);
    }

    gfx.lineBetween(-10, 2, -6, 8);
    gfx.lineBetween(10, 2, 6, 8);
  }

  popup(groundY: number, onComplete: () => void): void {
    if (this.active) return;
    this.active = true;
    const showY = this.showY(groundY);
    const buryY = this.hideY();

    this.scene.tweens.chain({
      targets: this,
      tweens: [
        { y: showY, duration: 200, ease: "Back.Out" },
        { y: showY, duration: this.holdMs(), ease: "Linear" },
        { y: buryY, duration: 180, ease: "Back.In" },
      ],
      onComplete: () => {
        this.active = false;
        onComplete();
      },
    });
  }
}