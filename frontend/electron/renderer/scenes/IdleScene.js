import * as PIXI from "pixi.js";
import {
  createFishSprite,
  FishSwarm,
  Diver,
  CommonStyles,
  createBackground,
  PulsingLabel,
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

    this.swarm = new FishSwarm(30, app.screen.width, app.screen.height, "idle");
    this.container.addChild(this.swarm.container);

    this.label = new PulsingLabel(app, "Press the Mic button and ask away!");
    this.container.addChild(this.label.container);

    this.update = () => {
      this.swarm.update();
      this.label.update();
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
