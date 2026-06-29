import Phaser from "phaser";

export type CreatureKind = "kawaii" | "monster";

export abstract class Creature extends Phaser.GameObjects.Rectangle {
  readonly kind: CreatureKind;
  private active = false;

  constructor(scene: Phaser.Scene, x: number, hideY: number, kind: CreatureKind, color: number) {
    super(scene, x, hideY, 32, 32, color);
    this.kind = kind;
    scene.add.existing(this);
    this.setDepth(5);
    this.setInteractive();
  }

  popup(groundY: number, onComplete: () => void): void {
    if (this.active) return;
    this.active = true;
    const showY = groundY - 24;

    this.scene.tweens.chain({
      targets: this,
      tweens: [
        { y: showY, duration: 200, ease: "Back.Out" },
        { y: showY, duration: Phaser.Math.Between(600, 1200), ease: "Linear" },
        { y: this.y + 80, duration: 180, ease: "Back.In" },
      ],
      onComplete: () => {
        this.active = false;
        onComplete();
      },
    });
  }
}
