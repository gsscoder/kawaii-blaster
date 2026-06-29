export interface GameState {
  score: number;
  health: number;
  gameOver: boolean;
}

export function createGameState(): GameState {
  return { score: 0, health: 3, gameOver: false };
}
