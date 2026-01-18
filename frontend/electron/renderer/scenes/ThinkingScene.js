import * as PIXI from "pixi.js";
import {
  createBackground,
  FishSwarm,
  PulsingLabel,
} from "../assets/sprites.js";

export class ThinkingScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.init(app);

    this.elapsed = 0;
  }

  async init(app) {
    this.bg = await createBackground();

    this.bg.width = this.app.screen.width;
    this.bg.height = this.app.screen.height;
    this.container.addChildAt(this.bg, 0);

    this.swarm = new FishSwarm(
      20,
      this.app.screen.width,
      this.app.screen.height
    );
    this.container.addChild(this.swarm.container);

    this.label = new PulsingLabel(this.app, "Thinking...");
    this.container.addChild(this.label.container);

    this.glow = new PIXI.Graphics();
    this.glow.circle(0, 0, 250).fill({ color: 0x3a8dde, alpha: 0.15 });
    this.glow.x = app.screen.width / 2;
    this.glow.y = app.screen.height / 2;
    this.container.addChild(this.glow);

    this.tickerCallback = (delta) => this.update(delta);
    PIXI.Ticker.shared.add(this.tickerCallback);
  }

  update(delta) {
    if (this.swarm) this.swarm.update();
    if (this.label) this.label.update();
    this.elapsed += delta * 0.05;

    this.swarm.fishData.forEach((f) => {
      f.angle += 0.002;
    });

    this.glow.alpha = 0.12 + Math.sin(this.elapsed) * 0.05;
  }

  destroy() {
    if (this.tickerCallback) {
      PIXI.Ticker.shared.remove(this.tickerCallback);
    }
    this.container.destroy({ children: true });
  }
}
