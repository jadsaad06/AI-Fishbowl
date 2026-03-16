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
  GradientText,
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

    this.titleText = new GradientText({
      text: "Terms of Service",
      fontSize: 54,
      gradientColor1: "#ff2402",
      gradientColor2: "#ffff00",
      x: app.screen.width / 2,
      y: app.screen.height * 0.2,
    });

    this.titleBox = new GlassBox(30);
    this.container.addChild(this.titleBox.graphics);
    this.container.addChild(this.titleText.sprite);

    const tosContent =
      "1. This is an AI based tool that can confabulate and make mistakes.\n\n" +
      "2. This tool is not your official advisor. For anything other than general inquiries, reach out to the advisors in the CS Department.\n\n" +
      "3. A small fraction of your chats may be stored for up to 30 days.\n\n" +
      "4. Chats may be used to train and improve future iterations of this tool.\n\n" +
      "5. PLEASE DO NOT SHARE PERSONALLY IDENTIFIABLE OR SENSITIVE INFORMATION";

    this.bodyText = new TypewriterText(
      tosContent,
      {
        fontFamily: "Verdana",
        fontSize: 28,
        fill: "#ffff00",
        align: "center",
        wordWrap: true,
        wordWrapWidth: 800,
        letterSpacing: 1,
        stroke: "#000000",
        strokeThickness: 4,
        dropShadow: true,
        dropShadowAlpha: 0.5,
      },
      { durationPerChar: 30 },
    );

    this.bodyText.container.position.set(
      app.screen.width / 2,
      app.screen.height * 0.6,
    );

    this.bodyBox = new GlassBox(30);
    this.bodyText.container.addChildAt(this.bodyBox.graphics, 0);
    this.container.addChild(this.bodyText.container);

    this.backText = new TypewriterText(
      "Press ESC To Go Back",
      {
        fontFamily: "Garamond",
        fontSize: 34,
        fontWeight: "italic",
        fill: "#000000",
      },
      { durationPerChar: 70 },
    );
    this.backText.container.position.set(
      app.screen.width * 0.15,
      app.screen.height * 0.15,
    );
    this.container.addChild(this.backText.container);
    this.backBox = new GlassBox(20);
    this.backText.container.addChildAt(this.backBox.graphics, 0);

    this.initScene();
  }

  initScene() {
    this.titleBox.reshape(this.titleText.sprite);
    this.bodyText.play();
    this.backText.play();

    this.updateLoop = () => {
      if (this.bodyBox && this.bodyText) {
        this.bodyBox.reshape(this.bodyText.textObject);
      }
      if (this.backBox && this.backText) {
        this.backBox.reshape(this.backText.textObject);
      }
    };
    this.app.ticker.add(this.updateLoop);
  }

  destroy() {
    if (this.updateLoop) {
      this.app.ticker.remove(this.updateLoop);
    }
    if (this.bodyText) this.bodyText.destroy();
    if (this.backText) this.backText.destroy();
    if (this.container) this.container.destroy({ children: true });
  }
}
