import * as PIXI from "pixi.js";
import {
  FishSwarm,
  createFishSprite,
  CommonStyles,
  BigFish,
  Diver,
  createBackground,
  PulsingLabel,
} from "../assets/sprites.js";

export class ListeningScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.initBackground(app);

    this.swarm = new FishSwarm(20, app.screen.width, app.screen.height);
    this.container.addChild(this.swarm.container);
    this.swarm.scatter(app.screen.width / 2, app.screen.height / 2);

    this.label = new PulsingLabel(app, "Press the Mic button and ask away!");
    this.container.addChild(this.label.container);

    this.bigFish = null;
    this.state = "SCATTERING";

    this.ticker = PIXI.Ticker.shared;
    this.ticker.add(this.update, this);
  }

  async initBackground(app) {
    const bg = await createBackground(
      "assets/images/glowing_creature_background.jpg"
    );

    bg.width = app.screen.width;
    bg.height = app.screen.height;
    this.container.addChildAt(bg, 0);
  }

  update(delta) {
    this.swarm.update();

    if (this.label) {
      this.label.update();
    }

    if (this.bigFish) {
      this.bigFish.update();
    }

    if (this.state === "SCATTERING") {
      this.checkSwarmExit();
    }
  }

  checkSwarmExit() {
    const margin = 100;
    const allGone = this.swarm.fishData.every(
      (f) =>
        f.x < -margin ||
        f.x > this.app.screen.width + margin ||
        f.y < -margin ||
        f.y > this.app.screen.height + margin
    );
    if (allGone) {
      this.state = "TRANSITIONING";
      this.startTransition();
    }
  }

  startTransition() {
    const shrinkIdle = () => {
      if (this.label.container.scale.x > 0.01) {
        this.label.container.scale.set(this.label.container.scale.x * 0.85);
      } else {
        this.ticker.remove(shrinkIdle, this);
        this.container.removeChild(this.label.container);
        this.spawnListeningLabel();
      }
    };

    this.ticker.add(shrinkIdle, this);
  }

  spawnListeningLabel() {
    this.label = new PulsingLabel(this.app, "Listening...");
    this.container.addChild(this.label.container);

    this.label.container.scale.set(0);

    const growListening = () => {
      if (this.label.container.scale.x < 1) {
        this.label.container.scale.set(this.label.container.scale.x + 0.1);
      } else {
        this.label.container.scale.set(1);
        this.ticker.remove(growListening, this);
        this.spawnBigFish();
        this.state = "BIGFISH";
      }
    };
    this.ticker.add(growListening, this);
  }

  spawnBigFish() {
    this.bigFish = new BigFish(this.app.screen.width, this.app.screen.height);
    this.container.addChild(this.bigFish.sprite);
  }

  destroy() {
    this.ticker.remove(this.update, this);
    this.container.destroy({ children: true });
  }
}
