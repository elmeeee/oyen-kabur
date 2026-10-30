import { ShopScene, AchievementsScene } from './scenes/ShopScene';
import { WorldMapScene, LevelSelectScene, ResultScene } from './scenes/ProgressionScenes';
import Phaser from 'phaser';
import './style.css';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene, arcadeGravity } from './scenes/GameScene';
import { GameOverScene, VictoryScene } from './scenes/EndScenes';
export const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'app', width: 960, height: 540,
  pixelArt: true, roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: arcadeGravity }, debug: false } },
  scene: [MainMenuScene, ShopScene, AchievementsScene, WorldMapScene, LevelSelectScene, ResultScene, GameScene, GameOverScene, VictoryScene],
});
