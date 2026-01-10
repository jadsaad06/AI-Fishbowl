import * as PIXI from "pixi.js";
import {
  FishSwarm,
  createFancyFish,
  createEnvironment,
  createFishSprite,
} from "../assets/sprites.js";

export class ListeningScene {
  constructor(app) {
    this.container = new PIXI.Container();

    this.swarm = new FishSwarm(25);
    this.container.addChild(this.swarm.container);

    this.swarm.scatter();

    this.bigFish = null;
    this.bigFishSpawned = false;

    this.ticker = PIXI.Ticker.shared;
    this.ticker.add(this.update, this);
  }

  spawnBigFish() {
    this.bigFish = createFishSprite(0xff88cc, 300, 150);
    this.bigFish.position.set(window.innerWidth / 2, window.innerHeight / 2);

    this.bigFish.scale.set(0);
    this.container.addChild(this.bigFish);

    const grow = () => {
      this.bigFish.scale.x += 0.02;
      this.bigFish.scale.y += 0.02;

      if (this.bigFish.scale.x < 1) {
        requestAnimationFrame(grow);
      } else {
        this.bigFish.scale.set(1);
      }
    };

    this.ticker.add(grow);
  }

  update() {
    this.swarm.update();

    if (!this.bigFishSpawned && this.swarm.isScattering) {
      const margin = 100;
      const allGone = this.swarm.fishData.every(
        (f) =>
          f.x < -margin ||
          f.x > window.innerWidth + margin ||
          f.y < -margin ||
          f.y > window.innerHeight + margin
      );

      if (allGone) {
        this.spawnBigFish();
        this.bigFishSpawned = true;
      }
    }
  }

  destroy() {
    this.ticker.remove(this.update, this);
    this.container.destroy({ children: true });
  }
}
