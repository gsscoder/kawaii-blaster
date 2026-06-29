import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  backgroundColor: "#0a0512",
  pixelArt: true,
  scene: [GameScene],
  parent: document.body,
});
