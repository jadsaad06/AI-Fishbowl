import * as PIXI from "pixi.js";
import { BackgroundManager, FishSwarm } from "../assets/sprites.js";

import { AnimeIdleText } from "../assets/sprites_anime.js";
import { BACKGROUNDS, ANIMATED_FISH } from "../app.js";

export class IdleSceneAnime {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bgManager = new BackgroundManager(app, BACKGROUNDS);
    this.container.addChild(this.bgManager.container);

    this.swarm = new FishSwarm(
      20,
      app.screen.width,
      app.screen.height,
      ANIMATED_FISH,
      120,
    );

    this.container.addChild(this.swarm.container);

    this.animeText = new AnimeIdleText(app);
    this.container.addChild(this.animeText.container);

    this.update = (delta) => {
      this.swarm.update();
    };

    PIXI.Ticker.shared.add(this.update);

    this.bgInterval = setInterval(() => {
      this.bgManager.next();
    }, 5000);
  }

  destroy() {
    clearInterval(this.bgInterval);
    PIXI.Ticker.shared.remove(this.update);

    this.animeText.destroy();
    this.container.destroy({ children: true });
  }
}
