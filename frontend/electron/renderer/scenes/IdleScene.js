import * as PIXI from "pixi.js";
import {
  createFishSprite,
  BigFish,
  FishSwarm,
  CommonStyles,
  createBackground,
} from "../assets/sprites.js";

/**
 * This class creates the animations responsible for being displayed
 * when no user is interacting with the application.
 * It generates a background, and uses the FishSwarm class from sprites.js to create a swarm of fish.
 * The swarm class contains the functionality for fish angles and movements and speed.
 */
export class IdleScene {
  constructor(app) {
    this.container = new PIXI.Container();

    this.initBackground(app);

    this.swarm = new FishSwarm(50, app.screen.width, app.screen.height);
    this.bigFish = new BigFish(app.screen.width, app.screen.height);
    this.container.addChild(this.swarm.container);
    this.container.addChild(this.bigFish.sprite);

    const label = new PIXI.Text("Idle State", CommonStyles.header);
    label.anchor.set(0.5);
    label.position.set(app.screen.width / 2, app.screen.height / 2 - 60);
    this.container.addChild(label);

    this.update = () => {
      this.swarm.update();
      this.bigFish.update();
    };
    PIXI.Ticker.shared.add(this.update);
  }

  async initBackground(app) {
    const bg = await createBackground();

    bg.width = app.screen.width;
    bg.height = app.screen.height;
    this.container.addChildAt(bg, 0);
  }

  destroy() {
    PIXI.Ticker.shared.remove(this.update);
    this.container.destroy({ children: true });
  }
}
