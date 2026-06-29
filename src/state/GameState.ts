export const KARMA_MAX = 100;
export const KARMA_START = 50;
export const KARMA_KAWAII_HIT = -5;
export const KARMA_MONSTER_HIT = 10;

export interface GameState {
  karma: number;
  gameOver: boolean;
}

export function createGameState(): GameState {
  return { karma: KARMA_START, gameOver: false };
}