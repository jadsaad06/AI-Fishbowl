/**
 * This file contains the animations of the terms of service scene which can be seen when the system is idle for 60 seconds.
 * It spawns a box with a gradient text title and shows the general terms of service of the application.
 * It can be exited from by pressing ESC.
 */
import * as PIXI from "pixi.js";
import { subscribePrompt, getResponder } from "../state/store.js";
import {
  BACKGROUNDS,
  RESPONDER_PROMPTS,
  RESPONDERS,
  FALLBACK_PROMPTS,
} from "../app.js";
import { BackgroundManager, createResponder } from "../assets/sprites.js";
import {
  PulseText,
  ModernBox,
  GlassBox,
  TypewriterText,
} from "../assets/sprites_anime.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

export class TOSScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bgManager = new BackgroundManager(app, BACKGROUNDS);
    this.container.addChild(this.bgManager.container);
  }

  destroy() {
    if (this.container) this.container.destroy({ children: true });
  }
}
