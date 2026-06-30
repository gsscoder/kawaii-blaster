import Phaser from "phaser";
import {
  createGameState,
  KARMA_KAWAII_HIT,
  KARMA_MAX,
  KARMA_MONSTER_HIT,
  type GameState,
} from "../state/GameState";
import { Kawaii } from "../sprites/Kawaii";
import { Monster } from "../sprites/Monster";
import type { Creature } from "../sprites/Creature";
import { RetroMusic } from "../audio/RetroMusic";

const CANVAS_W = 800;
const CANVAS_H = 450;
const GROUND_Y = 320;
const SEGMENT_W = 40;
const WAVE_PAUSE_MIN = 1200;
const WAVE_PAUSE_MAX = 2200;
const HIDE_Y = GROUND_Y + 60;
const SPAWN_MARGIN = 60;
const SPAWN_GAP = 90;
const KARMA_BAR_X = 12;
const KARMA_BAR_Y = 34;
const KARMA_BAR_W = 180;
const KARMA_BAR_H = 12;
const DARK_PAUSE_MS = 2200;
const DOUBLE_CLICK_MS = 350;
const DOUBLE_CLICK_DIST = 14;

const TITLE_Y = CANVAS_H / 2 - 88;
const PROMPT_Y = CANVAS_H / 2 + 52;
const PROMPT_CONTROLS_Y = CANVAS_H / 2 + 118;

const PROMPT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "VT323, monospace",
  fontSize: "30px",
  color: "#d8ccb0",
  stroke: "#1a0818",
  strokeThickness: 4,
  align: "center",
};

const PROMPT_START = "any key/click to start";
const PROMPT_CONTROLS = [
  "P - pause the game",
  "N - restart the game",
  "Q - quit the game",
  "",
  "(ready? press again)",
].join("\n");
const CONFIRM_NEW_GAME = "restart the game?\nY / N";
const CONFIRM_QUIT = "quit the game?\nY / N";

type ConfirmAction = "newGame" | "quit";

function karmaFillColor(karma: number): number {
  if (karma <= 50) return 0x5a6b2a;
  if (karma <= 70) return 0xc8b030;
  return 0xf0a0c8;
}

function karmaTextColor(karma: number): string {
  if (karma <= 50) return "#8aab4a";
  if (karma <= 70) return "#e8d050";
  return "#ffb0d8";
}

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private karmaLabel!: Phaser.GameObjects.Text;
  private karmaBar!: Phaser.GameObjects.Graphics;
  private gameOverText!: Phaser.GameObjects.Text;
  private darkPauseText!: Phaser.GameObjects.Text;
  private pauseText!: Phaser.GameObjects.Text;
  private confirmPromptText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private waveRemaining = 0;
  private karmaPaused = false;
  private gamePaused = false;
  private gameStarted = false;
  private confirmPromptActive = false;
  private confirmAction: ConfirmAction | null = null;
  private wasPausedBeforeConfirm = false;
  private audioReady = false;
  private readonly music = new RetroMusic();
  private startHandler?: () => void;
  private lastPauseClickAt = 0;
  private lastPauseClickX = 0;
  private lastPauseClickY = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.state = createGameState();
    this.drawAtmosphere();
    this.drawBackdrop();
    this.drawLandscape();
    this.buildHUD();
    this.showTitleScreen();
    this.bindStartInput();
    this.bindGameplayKeys();
    this.bindPausePointer();
  }

  // --- title ---

  private showTitleScreen(prompt: string = PROMPT_START): void {
    this.titleText = this.add.text(CANVAS_W / 2, TITLE_Y, "Kawaii Blaster", {
      fontFamily: "Creepster, cursive",
      fontSize: "88px",
      color: "#ffb0d8",
      stroke: "#1a0818",
      strokeThickness: 8,
      align: "center",
    }).setOrigin(0.5).setDepth(40);

    this.buildPrompt(prompt, prompt === PROMPT_CONTROLS ? PROMPT_CONTROLS_Y : PROMPT_Y);
  }

  private buildPrompt(message: string, y: number = PROMPT_Y): void {
    if (this.promptText !== undefined) {
      this.tweens.killTweensOf(this.promptText);
      this.promptText.destroy();
    }

    this.promptText = this.add
      .text(CANVAS_W / 2, y, message, PROMPT_STYLE)
      .setOrigin(0.5)
      .setDepth(40);

    this.blinkPrompt();
  }

  private blinkPrompt(): void {
    this.tweens.killTweensOf(this.promptText);
    this.tweens.add({
      targets: this.promptText,
      alpha: 0.3,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }

  private bindStartInput(): void {
    const engage = (): void => {
      if (this.gameStarted) return;
      if (!this.audioReady) {
        this.audioReady = true;
        this.music.unlock();
        this.music.playAttract();
        this.buildPrompt(PROMPT_CONTROLS, PROMPT_CONTROLS_Y);
        return;
      }
      this.startGame();
    };
    this.startHandler = engage;
    this.input.on("pointerdown", engage);
    const keyboard = this.input.keyboard;
    if (keyboard !== null) keyboard.on("keydown", engage);
  }

  private unbindStartInput(): void {
    const handler = this.startHandler;
    if (handler === undefined) return;
    this.input.off("pointerdown", handler);
    const keyboard = this.input.keyboard;
    if (keyboard !== null) keyboard.off("keydown", handler);
    this.startHandler = undefined;
  }

  private startGame(): void {
    this.unbindStartInput();
    this.gameStarted = true;
    this.music.playGame();
    this.tweens.killTweensOf(this.promptText);
    this.titleText.destroy();
    this.promptText.destroy();
    this.karmaLabel.setVisible(true);
    this.karmaBar.setVisible(true);
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
    if (this.karmaPaused || this.gamePaused) {
      this.time.delayedCall(300, () => this.spawnWave());
      return;
    }

    const kawaiiCount = Phaser.Math.Between(1, 2);
    const monsterCount = Phaser.Math.Between(1, 3);
    const total = kawaiiCount + monsterCount;

    this.waveRemaining = total;
    const positions = this.pickSpreadPositions(total);
    const kinds = this.buildWaveKinds(kawaiiCount, monsterCount);

    for (let i = 0; i < total; i++) {
      const x = positions[i];
      const kind = kinds[i];
      if (x === undefined || kind === undefined) continue;

      const creature: Creature = kind === "kawaii"
        ? new Kawaii(this, x, HIDE_Y)
        : new Monster(this, x, HIDE_Y);

      creature.on("pointerdown", () => this.onCreatureClick(creature));
      creature.popup(GROUND_Y, () => this.onCreatureDone(creature));
    }
  }

  private buildWaveKinds(kawaiiCount: number, monsterCount: number): ("kawaii" | "monster")[] {
    const kinds: ("kawaii" | "monster")[] = [];
    for (let i = 0; i < kawaiiCount; i++) kinds.push("kawaii");
    for (let i = 0; i < monsterCount; i++) kinds.push("monster");
    Phaser.Utils.Array.Shuffle(kinds);
    return kinds;
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
    return positions.sort((a, b) => a - b);
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
    if (this.state.gameOver || this.gamePaused || creature.isRetired()) return;

    const delta = creature.kind === "kawaii" ? KARMA_KAWAII_HIT : KARMA_MONSTER_HIT;
    this.applyKarma(delta);

    creature.hit();
    this.finishWaveCreature();
  }

  private applyKarma(delta: number): void {
    const prev = this.state.karma;
    this.state.karma = Phaser.Math.Clamp(this.state.karma + delta, 0, KARMA_MAX);
    this.updateHUD();

    if (this.state.karma >= KARMA_MAX) {
      this.triggerGameOver("cuteness killed you");
      return;
    }

    if (prev > 0 && this.state.karma <= 0) {
      this.showDarkPause();
    }
  }

  private showDarkPause(): void {
    if (this.karmaPaused || this.state.gameOver) return;
    this.karmaPaused = true;
    this.darkPauseText.setVisible(true);
    this.time.delayedCall(DARK_PAUSE_MS, () => {
      this.darkPauseText.setVisible(false);
      this.karmaPaused = false;
    });
  }

  // --- gameplay keys ---

  private bindGameplayKeys(): void {
    const keyboard = this.input.keyboard;
    if (keyboard === null) return;
    keyboard.on("keydown", (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();

      if (key === "Y" && this.confirmPromptActive) {
        this.acceptConfirm();
        return;
      }

      if (key === "N" && this.confirmPromptActive) {
        this.cancelConfirm();
        return;
      }

      if (key === "P") {
        if (this.state.gameOver || !this.gameStarted || this.confirmPromptActive) return;
        if (this.gamePaused) this.resumeGame();
        else this.pauseGame();
        return;
      }

      if (key === "N") {
        if (!this.gameStarted || this.state.gameOver || this.confirmPromptActive) return;
        this.showConfirmPrompt("newGame");
        return;
      }

      if (key === "Q") {
        if (!this.gameStarted || this.state.gameOver || this.confirmPromptActive) return;
        this.showConfirmPrompt("quit");
      }
    });
  }

  private bindPausePointer(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.state.gameOver || !this.gameStarted || this.confirmPromptActive) return;

      const now = performance.now();
      const elapsed = now - this.lastPauseClickAt;
      const dx = Math.abs(pointer.x - this.lastPauseClickX);
      const dy = Math.abs(pointer.y - this.lastPauseClickY);

      if (elapsed <= DOUBLE_CLICK_MS && dx <= DOUBLE_CLICK_DIST && dy <= DOUBLE_CLICK_DIST) {
        this.lastPauseClickAt = 0;
        if (this.gamePaused) this.resumeGame();
        else this.pauseGame();
        return;
      }

      this.lastPauseClickAt = now;
      this.lastPauseClickX = pointer.x;
      this.lastPauseClickY = pointer.y;
    });
  }

  private showConfirmPrompt(action: ConfirmAction): void {
    this.wasPausedBeforeConfirm = this.gamePaused;
    if (!this.gamePaused) this.pauseGame();
    this.confirmPromptActive = true;
    this.confirmAction = action;
    this.confirmPromptText.setText(action === "newGame" ? CONFIRM_NEW_GAME : CONFIRM_QUIT);
    this.confirmPromptText.setVisible(true);
  }

  private cancelConfirm(): void {
    this.confirmPromptActive = false;
    this.confirmAction = null;
    this.confirmPromptText.setVisible(false);
    if (!this.wasPausedBeforeConfirm) this.resumeGame();
  }

  private acceptConfirm(): void {
    const action = this.confirmAction;
    this.confirmPromptActive = false;
    this.confirmAction = null;
    this.confirmPromptText.setVisible(false);
    if (action === "newGame") this.restartGame();
    else if (action === "quit") this.quitToTitle();
  }

  private restartGame(): void {
    this.resetGameplay();
    this.music.playGame(true);
    this.updateHUD();
    this.scheduleWave();
  }

  private quitToTitle(): void {
    this.resetGameplay();
    this.gameStarted = false;
    this.karmaLabel.setVisible(false);
    this.karmaBar.setVisible(false);
    this.music.playAttract();
    this.showTitleScreen(PROMPT_CONTROLS);
    this.bindStartInput();
  }

  private resetGameplay(): void {
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.clearCreatures();

    this.state = createGameState();
    this.waveRemaining = 0;
    this.karmaPaused = false;
    this.darkPauseText.setVisible(false);
    this.gameOverText.setVisible(false);

    if (this.gamePaused) {
      this.gamePaused = false;
      this.time.paused = false;
      this.tweens.resumeAll();
      this.pauseText.setVisible(false);
    }
  }

  private clearCreatures(): void {
    for (const child of [...this.children.list]) {
      if (child instanceof Kawaii || child instanceof Monster) {
        this.tweens.killTweensOf(child);
        child.destroy();
      }
    }
  }

  private pauseGame(): void {
    this.gamePaused = true;
    this.time.paused = true;
    this.tweens.pauseAll();
    this.music.pause();
    this.pauseText.setVisible(true);
  }

  private resumeGame(): void {
    if (!this.gamePaused) return;
    this.gamePaused = false;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.music.resume();
    this.pauseText.setVisible(false);
  }

  // --- HUD ---

  private buildHUD(): void {
    this.karmaLabel = this.add.text(12, 12, "Karma 50", {
      fontSize: "18px",
      color: karmaTextColor(KARMA_MAX / 2),
      stroke: "#1a0818",
      strokeThickness: 3,
    }).setDepth(20).setVisible(false);

    this.karmaBar = this.add.graphics().setDepth(20).setVisible(false);

    this.darkPauseText = this.add.text(CANVAS_W / 2, CANVAS_H / 2 - 40, "you're growing darker", {
      fontSize: "32px",
      color: "#8aab4a",
      stroke: "#1a0818",
      strokeThickness: 5,
      align: "center",
    }).setOrigin(0.5).setDepth(30).setVisible(false);

    this.gameOverText = this.add.text(CANVAS_W / 2, CANVAS_H / 2, "cuteness killed you", {
      fontSize: "40px",
      color: "#ffb0d8",
      stroke: "#1a0818",
      strokeThickness: 6,
      align: "center",
    }).setOrigin(0.5).setDepth(30).setVisible(false);

    this.pauseText = this.add.text(CANVAS_W / 2, CANVAS_H / 2, "GAME PAUSED", {
      fontSize: "44px",
      color: "#d8ccb0",
      stroke: "#1a0818",
      strokeThickness: 6,
      align: "center",
    }).setOrigin(0.5).setDepth(35).setVisible(false);

    this.pauseText.setInteractive({ useHandCursor: true });
    this.pauseText.on("pointerdown", () => {
      if (this.confirmPromptActive) return;
      this.resumeGame();
    });

    this.confirmPromptText = this.add.text(CANVAS_W / 2, CANVAS_H / 2 + 48, CONFIRM_NEW_GAME, {
      ...PROMPT_STYLE,
      fontSize: "28px",
    }).setOrigin(0.5).setDepth(36).setVisible(false);

    this.updateHUD();
  }

  private updateHUD(): void {
    const karma = this.state.karma;
    this.karmaLabel.setText(`Karma ${karma}`);
    this.karmaLabel.setColor(karmaTextColor(karma));

    this.karmaBar.clear();
    this.karmaBar.fillStyle(0x1a0818);
    this.karmaBar.fillRect(KARMA_BAR_X, KARMA_BAR_Y, KARMA_BAR_W, KARMA_BAR_H);
    this.karmaBar.lineStyle(1, 0x3a2848);
    this.karmaBar.strokeRect(KARMA_BAR_X, KARMA_BAR_Y, KARMA_BAR_W, KARMA_BAR_H);

    const fillW = (karma / KARMA_MAX) * KARMA_BAR_W;
    if (fillW > 0) {
      this.karmaBar.fillStyle(karmaFillColor(karma));
      this.karmaBar.fillRect(KARMA_BAR_X, KARMA_BAR_Y, fillW, KARMA_BAR_H);
    }
  }

  private triggerGameOver(message: string): void {
    this.state.gameOver = true;
    this.gameOverText.setText(message);
    this.gameOverText.setVisible(true);
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.music.stop();
  }

  update(): void {
    // loop managed by events, nothing per-frame needed yet
  }
}