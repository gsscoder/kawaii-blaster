import Phaser from "phaser";
import { Creature } from "./Creature";

export class Monster extends Creature {
  constructor(scene: Phaser.Scene, x: number, hideY: number) {
    super(scene, x, hideY, "monster", 0x6a0dad); // purple
  }
}
