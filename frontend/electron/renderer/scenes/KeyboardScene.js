/**
 * This file contains the animations of the keyboard scene which can be accessed by pressing K on the idle state.
 * It spawns a bobbling responder which is chosen from the state store, a box that contains example prompts that
 * utilize the tools of the chosen responder, and instructions for going back and proceeding.
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

export class KeyboardScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bgManager = new BackgroundManager(app, BACKGROUNDS);
    this.container.addChild(this.bgManager.container);

    this.syncGroup = new PIXI.Container();
    this.syncGroup.position.set(
      app.screen.width * 0.25,
      app.screen.height * 0.5,
    );
    this.container.addChild(this.syncGroup);

    const selectedID = getResponder();
    const responderIndex = selectedID && selectedID > 0 ? selectedID - 1 : 0;

    this.responder = createResponder(app, RESPONDERS[responderIndex], 300);
    this.responder.position.set(0, 0);
    this.syncGroup.addChild(this.responder);

    const responderData = RESPONDER_PROMPTS[selectedID] || FALLBACK_PROMPTS;
    const promptHint = responderData.prompts.join("\n\n");

    this.hintText = new PulseText(
      promptHint,
      {
        fontFamily: "Courier New",
        fontSize: 30,
        fill: "#000000",
        fontWeight: "bold",
        wordWrap: true,
        wordWrapWidth: app.screen.width * 0.4,
      },
      {
        minScale: 0.97,
        maxScale: 1.03,
        minAlpha: 0.6,
        maxAlpha: 1,
        duration: 2000,
        easing: "easeInOutSine",
      },
    );
    this.hintText.textObject.anchor.set(0, 0.5);
    this.hintText.container.position.set(250, 0);

    this.hintBox = new GlassBox(30);
    this.hintText.container.addChildAt(this.hintBox.graphics, 0);
    this.syncGroup.addChild(this.hintText.container);

    this.listeningText = new TypewriterText(
      "Start Typing, I'm Ready!",
      {
        fontFamily: "Garamond",
        fontSize: 34,
        fill: "#000000",
        fontWeight: "bold",
      },
      { durationPerChar: 50 },
    );
    this.listeningText.container.position.set(
      app.screen.width / 2,
      app.screen.height * 0.15,
    );
    this.container.addChild(this.listeningText.container);
    this.glassBox = new GlassBox(25);
    this.listeningText.container.addChildAt(this.glassBox.graphics, 0);

    // 4. Back Text (Top Left)
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

    const margin = 40;
    const boxHeight = 80;
    this.promptBox = new PIXI.Graphics()
      .fill({ color: 0x1a1a1a, alpha: 0.85 })
      .stroke({ width: 2, color: 0x00f000 })
      .roundRect(0, 0, app.screen.width - margin * 2, boxHeight, 15)
      .fill();
    this.promptBox.position.set(margin, app.screen.height - boxHeight - 150);
    this.container.addChild(this.promptBox);

    this.text = new PIXI.Text({
      text: "> Ready to type...",
      style: {
        fontFamily: "monospace",
        fill: "#fff652",
        fontSize: 24,
      },
    });

    this.text.position.set(20, boxHeight / 2 - this.text.height / 2);
    this.promptBox.addChild(this.text);

    this.unsubscribe = subscribePrompt((prompt) => {
      this.text.text = `> ${prompt}_`;
      this.text.y = boxHeight / 2 - this.text.height / 2;
    });

    this.updateLoop = () => {
      this.hintBox.reshape(this.hintText.textObject);
      this.glassBox.reshape(this.listeningText.textObject);
      this.backBox.reshape(this.backText.textObject);
    };
    this.app.ticker.add(this.updateLoop);

    this.rippleInterval = null;
    this.initAnimations();
    this.setupSyncEffects();

    this.bgInterval = setInterval(() => {
      this.bgManager.next();
    }, 10000);
  }

  setupSyncEffects() {
    const trigger = () => {
      this.glassBox.ripple("#ff8f45");
      this.backBox.ripple("#ff8f45");
      this.listeningText.play();
      this.backText.play();
    };
    trigger();
    this.rippleInterval = setInterval(trigger, 3000);
  }

  initAnimations() {
    anime({
      targets: this.syncGroup,
      y: this.syncGroup.y - 20,
      duration: 2000,
      direction: "alternate",
      loop: true,
      easing: "easeInOutSine",
    });
  }

  destroy() {
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
    if (this.rippleInterval) clearInterval(this.rippleInterval);
    this.unsubscribe?.();
    this.app.ticker.remove(this.updateLoop);
    anime.remove(this.syncGroup);
    if (this.hintText) this.hintText.destroy();
    if (this.listeningText) this.listeningText.destroy();
    if (this.backText) this.backText.destroy();
    this.container.destroy({ children: true });
  }
}
