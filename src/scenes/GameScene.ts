import Phaser from "phaser";
import { createGameState, type GameState } from "../state/GameState";
import { Kawaii } from "../sprites/Kawaii";
import { Monster } from "../sprites/Monster";
import type { Creature, CreatureKind } from "../sprites/Creature";

const CANVAS_W = 800;
const CANVAS_H = 450;
const GROUND_Y = 320;
const SEGMENT_W = 40;
const WAVE_PAUSE_MIN = 1200;
const WAVE_PAUSE_MAX = 2200;
const HIDE_Y = GROUND_Y + 60;
const SPAWN_MARGIN = 60;
const SPAWN_GAP = 90;
const STAGGER_MS = 180;

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private scoreText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;
  private nextWaveKind: CreatureKind = "kawaii";
  private waveRemaining = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.state = createGameState();
    this.drawAtmosphere();
    this.drawBackdrop();
    this.drawLandscape();
    this.buildHUD();
    this.scheduleWave();
  }

  // --- atmosphere ---

  private drawAtmosphere(): void {
    const gfx = this.add.graphics().setDepth(0);

    const skyBands: { y: number; h: number; color: number }[] = [
      { y: 0, h: 110, color: 0x0a0512 },
      { y: 110, h: 90, color: 0x120820 },
      { y: 200, h: 80, color: 0x1c1030 },
      { y: 280, h: GROUND_Y - 280 + 20, color: 0x281848 },
    ];
    for (const band of skyBands) {
      gfx.fillStyle(band.color);
      gfx.fillRect(0, band.y, CANVAS_W, band.h);
    }

    gfx.fillStyle(0x5a4870, 0.3);
    gfx.fillCircle(640, 74, 44);
    gfx.fillStyle(0xc8c0a0, 0.9);
    gfx.fillCircle(640, 68, 20);

    gfx.fillStyle(0x3a2858, 0.45);
    gfx.fillRect(0, GROUND_Y - 50, CANVAS_W, 50);
  }

  private drawBackdrop(): void {
    const trees = this.add.graphics().setDepth(2);
    trees.fillStyle(0x0e0818);
    this.drawDeadTree(trees, 60, GROUND_Y, 70);
    this.drawDeadTree(trees, 200, GROUND_Y, 55);
    this.drawDeadTree(trees, 520, GROUND_Y, 80);
    this.drawDeadTree(trees, 720, GROUND_Y, 60);

    const stones = this.add.graphics().setDepth(8);
    stones.fillStyle(0x1e1828);
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(30, CANVAS_W - 50);
      const w = Phaser.Math.Between(10, 18);
      const h = Phaser.Math.Between(16, 26);
      const baseY = GROUND_Y + Phaser.Math.Between(-6, 6);
      stones.fillRect(x, baseY - h, w, h);
      stones.fillCircle(x + w / 2, baseY - h, w / 2);
    }
  }

  private drawDeadTree(gfx: Phaser.GameObjects.Graphics, x: number, groundY: number, height: number): void {
    const trunkW = 8;
    gfx.fillRect(x - trunkW / 2, groundY - height, trunkW, height);
    gfx.fillTriangle(x - 30, groundY - height + 20, x, groundY - height - 30, x + 28, groundY - height + 10);
    gfx.fillTriangle(x - 22, groundY - height + 45, x + 6, groundY - height - 5, x + 34, groundY - height + 35);
  }

  // --- landscape ---

  private drawLandscape(): void {
    const gfx = this.add.graphics();
    const points: [number, number][] = [];

    for (let x = 0; x <= CANVAS_W; x += SEGMENT_W) {
      const jitter = Phaser.Math.Between(-12, 12);
      points.push([x, GROUND_Y + jitter]);
    }

    gfx.fillStyle(0x2a1810);
    gfx.beginPath();
    gfx.moveTo(0, CANVAS_H);
    for (const [px, py] of points) {
      gfx.lineTo(px, py);
    }
    gfx.lineTo(CANVAS_W, CANVAS_H);
    gfx.closePath();
    gfx.fillPath();

    gfx.lineStyle(3, 0x4a3020);
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

  private scheduleWave(): void {
    if (this.state.gameOver) return;
    const delay = Phaser.Math.Between(WAVE_PAUSE_MIN, WAVE_PAUSE_MAX);
    this.time.delayedCall(delay, () => this.spawnWave());
  }

  private spawnWave(): void {
    if (this.state.gameOver) return;

    const kind = this.nextWaveKind;
    this.nextWaveKind = kind === "kawaii" ? "monster" : "kawaii";

    const count = kind === "kawaii"
      ? Phaser.Math.Between(1, 2)
      : Phaser.Math.Between(1, 3);

    this.waveRemaining = count;
    const positions = this.pickSpreadPositions(count);

    for (let i = 0; i < count; i++) {
      const x = positions[i];
      if (x === undefined) continue;

      const creature: Creature = kind === "kawaii"
        ? new Kawaii(this, x, HIDE_Y)
        : new Monster(this, x, HIDE_Y);

      creature.on("pointerdown", () => this.onCreatureClick(creature));

      this.time.delayedCall(i * STAGGER_MS, () => {
        if (this.state.gameOver || creature.isRetired()) return;
        creature.popup(GROUND_Y, () => this.onCreatureDone(creature));
      });
    }
  }

  private pickSpreadPositions(count: number): number[] {
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      let placed = false;
      for (let attempt = 0; attempt < 40; attempt++) {
        const x = Phaser.Math.Between(SPAWN_MARGIN, CANVAS_W - SPAWN_MARGIN);
        const spaced = positions.every((p) => Math.abs(p - x) >= SPAWN_GAP);
        if (spaced) {
          positions.push(x);
          placed = true;
          break;
        }
      }
      if (!placed) {
        const slot = SPAWN_MARGIN + (i + 1) * ((CANVAS_W - SPAWN_MARGIN * 2) / (count + 1));
        positions.push(Math.round(slot));
      }
    }
    return positions;
  }

  private onCreatureDone(creature: Creature): void {
    if (creature.isRetired()) return;
    creature.retire();
    this.finishWaveCreature();
  }

  private finishWaveCreature(): void {
    this.waveRemaining -= 1;
    if (this.waveRemaining <= 0) this.scheduleWave();
  }

  // --- click ---

  private onCreatureClick(creature: Creature): void {
    if (this.state.gameOver || creature.isRetired()) return;
    if (creature.kind === "kawaii") {
      this.state.score += 10;
    } else {
      this.state.health -= 1;
    }
    creature.retire();
    this.finishWaveCreature();
    this.updateHUD();
    if (this.state.health <= 0) this.triggerGameOver();
  }

  // --- HUD ---

  private buildHUD(): void {
    this.scoreText = this.add.text(12, 12, "Score: 0", {
      fontSize: "18px",
      color: "#d8ccb0",
      stroke: "#1a0818",
      strokeThickness: 3,
    }).setDepth(20);

    this.healthText = this.add.text(12, 36, "Souls: ♥♥♥", {
      fontSize: "18px",
      color: "#cc3333",
      stroke: "#1a0818",
      strokeThickness: 3,
    }).setDepth(20);

    this.gameOverText = this.add.text(CANVAS_W / 2, CANVAS_H / 2, "YOUR SOUL\nIS FORFEIT", {
      fontSize: "40px",
      color: "#ff5500",
      stroke: "#1a0818",
      strokeThickness: 6,
      align: "center",
    }).setOrigin(0.5).setDepth(30).setVisible(false);
  }

  private updateHUD(): void {
    this.scoreText.setText(`Score: ${this.state.score}`);
    const hearts = "♥".repeat(Math.max(0, this.state.health));
    this.healthText.setText(`Souls: ${hearts}`);
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