import Phaser from "phaser";
import { createGameState, type GameState } from "../state/GameState";
import { Kawaii } from "../sprites/Kawaii";
import { Monster } from "../sprites/Monster";
import type { Creature } from "../sprites/Creature";

const CANVAS_W = 800;
const CANVAS_H = 450;
const GROUND_Y = 320;
const SEGMENT_W = 40;
const SPAWN_MIN = 800;
const SPAWN_MAX = 2000;
const HIDE_Y = GROUND_Y + 60;

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private scoreText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.state = createGameState();
    this.drawLandscape();
    this.buildHUD();
    this.scheduleSpawn();
  }

  // --- landscape ---

  private drawLandscape(): void {
    const gfx = this.add.graphics();
    const points: [number, number][] = [];

    for (let x = 0; x <= CANVAS_W; x += SEGMENT_W) {
      const jitter = Phaser.Math.Between(-12, 12);
      points.push([x, GROUND_Y + jitter]);
    }

    gfx.fillStyle(0x4a7c3f);
    gfx.beginPath();
    gfx.moveTo(0, CANVAS_H);
    for (const [px, py] of points) {
      gfx.lineTo(px, py);
    }
    gfx.lineTo(CANVAS_W, CANVAS_H);
    gfx.closePath();
    gfx.fillPath();

    gfx.lineStyle(3, 0x2d5a1b);
    gfx.beginPath();
    const first = points[0];
    if (first !== undefined) gfx.moveTo(first[0], first[1]);
    for (let i = 1; i < points.length; i++) {
      const pt = points[i];
      if (pt !== undefined) gfx.lineTo(pt[0], pt[1]);
    }
    gfx.strokePath();
    gfx.setDepth(10);
  }

  // --- spawn ---

  private scheduleSpawn(): void {
    if (this.state.gameOver) return;
    const delay = Phaser.Math.Between(SPAWN_MIN, SPAWN_MAX);
    this.time.delayedCall(delay, () => this.spawnCreature());
  }

  private spawnCreature(): void {
    if (this.state.gameOver) return;
    const x = Phaser.Math.Between(40, CANVAS_W - 40);
    const isKawaii = Math.random() < 0.6;
    const creature: Creature = isKawaii
      ? new Kawaii(this, x, HIDE_Y)
      : new Monster(this, x, HIDE_Y);

    creature.on("pointerdown", () => this.onCreatureClick(creature));

    creature.popup(GROUND_Y, () => {
      creature.destroy();
      this.scheduleSpawn();
    });
  }

  // --- click ---

  private onCreatureClick(creature: Creature): void {
    if (this.state.gameOver) return;
    if (creature.kind === "kawaii") {
      this.state.score += 10;
    } else {
      this.state.health -= 1;
    }
    creature.destroy();
    this.updateHUD();
    if (this.state.health <= 0) this.triggerGameOver();
  }

  // --- HUD ---

  private buildHUD(): void {
    this.scoreText = this.add.text(12, 12, "Score: 0", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setDepth(20);

    this.healthText = this.add.text(12, 36, "Hearts: ♥♥♥", {
      fontSize: "18px",
      color: "#ff4444",
      stroke: "#000000",
      strokeThickness: 3,
    }).setDepth(20);

    this.gameOverText = this.add.text(CANVAS_W / 2, CANVAS_H / 2, "GAME OVER", {
      fontSize: "48px",
      color: "#ff0000",
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(30).setVisible(false);
  }

  private updateHUD(): void {
    this.scoreText.setText(`Score: ${this.state.score}`);
    const hearts = "♥".repeat(Math.max(0, this.state.health));
    this.healthText.setText(`Hearts: ${hearts}`);
  }

  private triggerGameOver(): void {
    this.state.gameOver = true;
    this.gameOverText.setVisible(true);
    this.time.removeAllEvents();
  }

  update(): void {
    // loop managed by events, nothing per-frame needed yet
  }
}
