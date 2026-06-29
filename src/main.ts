import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  backgroundColor: "#87ceeb",
  pixelArt: true,
  scene: [GameScene],
  parent: document.body,
});
