import Phaser from "phaser";
import { Creature } from "./Creature";

export class Kawaii extends Creature {
  constructor(scene: Phaser.Scene, x: number, hideY: number) {
    super(scene, x, hideY, "kawaii", 0xff69b4); // pink
  }
}
