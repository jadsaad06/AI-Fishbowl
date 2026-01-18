import * as PIXI from "pixi.js";
import {
  createBackground,
  FishSwarm,
  PulsingLabel,
  createFishSprite,
  createResponder,
} from "../assets/sprites.js";
import {
  BACKGROUNDS,
  ANIMATED_FISH,
  ENHANCED_FISH,
  RESPONDERS,
} from "../app.js";

export class RespondingScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    const targetWidth = 350;
    this.responder = createResponder(app, RESPONDERS, targetWidth);
    this.container.addChild(this.responder);

    this.targetX = this.responder.x + app.screen.width * 0.15;
    this.targetY = this.responder.y - app.screen.height * 0.15;

    this.speed = 0.05;
    this.arrived = false;

    this.elapsed = 0;
    this.bobIntensity = 10;
    this.bobSpeed = 0.07;

    this.update = (ticker) => {
      const delta = ticker.deltaTime;

      if (!this.arrived) {
        const dx = this.targetX - this.responder.x;
        const dy = this.targetY - this.responder.y;

        this.responder.x += dx * this.speed * delta;
        this.responder.y += dy * this.speed * delta;

        if (Math.abs(dy) < 1 && Math.abs(dy) < 1) {
          this.responder.x = this.targetX;
          this.responder.y = this.targetY;
          this.arrived = true;
        }
      } else {
        this.elapsed += this.bobSpeed * delta;
        const currentBob = Math.sin(this.elapsed) * this.bobIntensity;

        const baseUpdateY = this.arrived ? this.targetY : this.responder.y;
        this.responder.y = baseUpdateY + currentBob;
      }
    };

    PIXI.Ticker.shared.add(this.update);
  }

  destroy() {
    PIXI.Ticker.shared.remove(this.update);
    this.container.destroy({ children: true });
    this.responder = null;
  }
}
