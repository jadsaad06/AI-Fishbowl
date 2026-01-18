import * as PIXI from "pixi.js";
import {
  createBackground,
  FishSwarm,
  PulsingLabel,
  Diver,
} from "../assets/sprites.js";
import { BACKGROUNDS, ANIMATED_FISH, ENHANCED_FISH } from "../app.js";

export class ThinkingScene {
  constructor(app) {
    this.container = new PIXI.Container();
    this.divers = [];

    this.init(app);

    for (let i = 0; i < 5; i++) {
      const diverInstance = new Diver(app, 200);
      this.divers.push(diverInstance);
      this.container.addChild(diverInstance.sprite);
    }
    this.swarm = new FishSwarm(
      5,
      app.screen.width,
      app.screen.height,
      ANIMATED_FISH,
    );
    this.container.addChild(this.swarm.container);
    this.enhancedSwarm = new FishSwarm(
      5,
      app.screen.width,
      app.screen.height,
      ENHANCED_FISH,
    );
    this.container.addChild(this.enhancedSwarm.container);

    this.label = new PulsingLabel(app, "NAVIGATING THE DEPTHS FOR ANSWERS...");
    this.container.addChild(this.label.container);

    this.update = () => {
      this.divers.forEach((d) => d.update());
      this.swarm.update();
      this.enhancedSwarm.update();
      this.label.update();
    };

    PIXI.Ticker.shared.add(this.update);
  }

  async init(app) {
    this.bg = await createBackground("assets/images/idle_bg_3.png");
    this.bg.width = app.screen.width;
    this.bg.height = app.screen.height;
    this.container.addChildAt(this.bg, 0);
  }

  destroy() {
    PIXI.Ticker.shared.remove(this.update);
    this.container.destroy({ children: true });
  }
}
