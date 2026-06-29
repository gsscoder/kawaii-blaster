# Architecture

## Stack
- `Phaser 3` as the game framework
- `TypeScript` as the language
- `esbuild` as the bundler — zero config, single command

## Entry Point
A single `index.html` loads the compiled bundle
The game boots from there with no server required — static file only

## Game Loop
Phaser handles the loop via `update()`
`GameScene` manages a spawn timer that triggers creature pop-ups on a random interval
Each creature follows a simple arc: emerge from behind the landscape line, pause briefly, then retreat
A click on an active creature resolves via Phaser's input hit area on the sprite

## Landscape
A static-ish ground line drawn once per session with slight random variation
Creatures spawn behind it using z-order (landscape rendered on top)