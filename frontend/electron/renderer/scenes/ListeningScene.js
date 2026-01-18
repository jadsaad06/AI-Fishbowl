import * as PIXI from "pixi.js";
import {
  FishSwarm,
  createFishSprite,
  Diver,
  createBackground,
  PulsingLabel,
} from "../assets/sprites.js";
import { BACKGROUNDS, ANIMATED_FISH, ENHANCED_FISH } from "../app.js";

export class ListeningScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bgLayer = new PIXI.Container();
    this.swarmLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();
    this.container.addChild(this.bgLayer, this.swarmLayer, this.uiLayer);

    this.initBackground(app);

    this.swarm = new FishSwarm(
      20,
      app.screen.width,
      app.screen.height,
      ENHANCED_FISH
    );
    this.swarmLayer.addChild(this.swarm.container);
    this.swarm.scatter(app.screen.width / 2, app.screen.height / 2);

    this.label = new PulsingLabel(app, "Press the Mic button and ask away!");
    this.uiLayer.addChild(this.label.container);
    this.state = "SCATTERING_IDLE";

    this.updateHandler = (delta) => this.update(delta);
    PIXI.Ticker.shared.add(this.updateHandler);
  }

  async initBackground(app) {
    const bg = await createBackground("assets/images/idle_bg_1.png");

    bg.width = app.screen.width;
    bg.height = app.screen.height;
    this.bgLayer.addChild(bg);
  }

  update(delta) {
    if (this.swarm) this.swarm.update();
    if (this.newSwarm) this.newSwarm.update();

    if (this.label) {
      this.label.update();
    }

    if (this.state === "SCATTERING_IDLE") {
      this.checkIdleSwarmExit();
    }
  }

  checkIdleSwarmExit() {
    const margin = 100;
    const allGone = this.swarm.fishData.every(
      (f) =>
        f.x < -margin ||
        f.x > this.app.screen.width + margin ||
        f.y < -margin ||
        f.y > this.app.screen.height + margin
    );
    if (allGone) {
      this.state = "TRANSITIONING_UI";
      this.startUITransition();
    }
  }

  startUITransition() {
    const shrinkIdle = () => {
      if (this.label.container.scale.x > 0.01) {
        this.label.container.scale.set(this.label.container.scale.x * 0.85);
      } else {
        PIXI.Ticker.shared.remove(shrinkIdle);
        this.uiLayer.removeChild(this.label.container);
        this.swarmLayer.removeChild(this.swarm.container);
        this.spawnListeningUIAndSwarm();
      }
    };

    PIXI.Ticker.shared.add(shrinkIdle);
  }

  spawnListeningUIAndSwarm() {
    this.label = new PulsingLabel(this.app, "Listening...");
    this.uiLayer.addChild(this.label.container);

    this.label.container.scale.set(0);

    this.swarm = new FishSwarm(
      20,
      this.app.screen.width,
      this.app.screen.height,
      ANIMATED_FISH
    );
    this.swarmLayer.addChild(this.swarm.container);

    const growListening = () => {
      if (this.label.container.scale.x < 1) {
        this.label.container.scale.set(this.label.container.scale.x + 0.1);
      } else {
        this.label.container.scale.set(1);
        this.state = "LISTENING_ACTIVE";
        PIXI.Ticker.shared.remove(growListening);
      }
    };
    PIXI.Ticker.shared.add(growListening);
  }

  destroy() {
    PIXI.Ticker.shared.remove(this.updateHandler);
    this.container.destroy({ children: true });
  }
}
