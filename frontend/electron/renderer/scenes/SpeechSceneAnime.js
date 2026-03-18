/**
 * This file contains the animations of the speech scene which can be accessed by saying "Hey <fish name>" on the idle state.
 * It spawns a bobbling responder which is chosen from the state store, a box that contains example prompts that
 * utilize the tools of the chosen responder, and instructions for going back and proceeding.
 */

import * as PIXI from "pixi.js";
import { getResponder, subscribeMic, getMicActive } from "../state/store.js";
import { BackgroundRandomizer, createResponder } from "../assets/sprites.js";
import {
  PulseText,
  ModernBox,
  TypewriterText,
  GlassBox,
  MicIndicator,
} from "../assets/sprites_anime.js";
import {
  RESPONDERS,
  RESPONDER_PROMPTS,
  FALLBACK_PROMPTS,
  BACKGROUNDS,
} from "../app.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

export class SpeechSceneAnime {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bg = new BackgroundRandomizer(app, BACKGROUNDS);
    this.container.addChild(this.bg.container);

    this.syncGroup = new PIXI.Container();
    this.syncGroup.position.set(app.screen.width * 0.25, app.screen.height / 2);
    this.container.addChild(this.syncGroup);

    const selectedID = getResponder();
    const responderIndex = selectedID && selectedID > 0 ? selectedID - 1 : 0;
    const responderPath = RESPONDERS[responderIndex];

    this.responder = createResponder(app, responderPath, 350);
    this.responder.anchor.set(0.5);
    this.responder.position.set(0, 0);
    this.syncGroup.addChild(this.responder);

    const responderData = RESPONDER_PROMPTS[selectedID] || FALLBACK_PROMPTS;
    const promptText = responderData.prompts.join("\n\n");

    this.pulseText = new PulseText(
      promptText,
      {
        fontFamily: "Garamond",
        fontSize: 34,
        fill: "#000000",
        align: "center",
        fontWeight: "bold",
        wordWrap: true,
        wordWrapWidth: app.screen.width * 0.5,
        breakWords: true,
        lineHeight: 36,
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
    this.pulseText.textObject.anchor.set(0, 0.5);
    this.pulseText.container.position.set(200, 40);

    this.promptBox = new GlassBox(40);
    this.pulseText.container.addChildAt(this.promptBox.graphics, 0);

    this.syncGroup.addChild(this.pulseText.container);
    this.syncGroup.position.set(app.screen.width / 2, app.screen.height * 0.8);

    this.promptBox.reshape(this.pulseText.textObject);

    this.listeningText = new TypewriterText(
      "Start Talking, I'm Listening!",
      {
        fontFamily: "Garamond",
        fontSize: 34,
        fill: "#000000",
        fontWeight: "bold",
        align: "center",
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

    this.backText = new TypewriterText(
      "Press ESC To Go Back",
      {
        fontFamily: "Garamond",
        fontSize: 34,
        fontWeight: "italic",
        fill: "#000000",
        align: "center",
      },
      { durationPerChar: 70 },
    );

    this.backText.container.position.set(
      this.app.screen.width * 0.15,
      this.app.screen.height * 0.15,
    );
    this.container.addChild(this.backText.container);

    this.backBox = new GlassBox(20);
    this.backText.container.addChildAt(this.backBox.graphics, 0);

    this.micIndicator = new MicIndicator(app, 450, 120);
    this.micIndicator.container.position.set(
      this.app.screen.width * 0.85,
      this.app.screen.height * 0.15,
    );
    this.container.addChild(this.micIndicator.container);

    this.unsubscribeMic = subscribeMic((active) => {
      this.micIndicator.setVoiceActive(active);
    });

    this.micIndicator.setVoiceActive(getMicActive());

    this.updateLoop = () => {
      if (this.promptBox && this.pulseText) {
        this.promptBox.reshape(this.pulseText.textObject);
      }

      if (this.glassBox && this.listeningText) {
        this.glassBox.reshape(this.listeningText.textObject);
      }

      if (this.backBox && this.backText) {
        this.backBox.reshape(this.backText.textObject);
      }
    };
    this.app.ticker.add(this.updateLoop);

    this.rippleInterval = null;
    this.initAnimations();
    this.setupListeningUI();
  }

  setupListeningUI() {
    this.glassBox.reshape(this.listeningText.textObject);

    const originalUpdate = this.updateLoop;
    this.updateLoop = () => {
      if (originalUpdate) originalUpdate();
      if (this.glassBox && this.listeningText) {
        this.glassBox.reshape(this.listeningText.textObject);
      }
      if (this.backBox && this.backText) {
        this.backBox.reshape(this.backText.textObject);
      }
    };

    const triggerEffect = () => {
      this.glassBox.ripple("#ff8f45");
      this.backBox.ripple("#ff8f45");
      this.listeningText.play();
      this.backText.play();
    };
    triggerEffect();
    this.rippleInterval = setInterval(triggerEffect, 3000);
  }

  initAnimations() {
    const finalX = this.app.screen.width * 0.25;
    const finalY = this.app.screen.height / 2;

    anime({
      targets: this.syncGroup,
      x: finalX,
      y: finalY,
      duration: 2000,
      easing: "easeInOutCubic",
      complete: () => {
        anime({
          targets: this.syncGroup,
          y: finalY - 30,
          duration: 2000,
          direction: "alternate",
          loop: true,
          easing: "easeInOutSine",
        });
      },
    });
  }

  destroy() {
    if (this.rippleInterval) {
      clearInterval(this.rippleInterval);
    }
    if (this.updateLoop) {
      this.app.ticker.remove(this.updateLoop);
    }
    anime.remove(this.syncGroup);
    if (this.listeningText) this.listeningText.destroy();
    if (this.backText) this.backText.destroy();
    if (this.pulseText) this.pulseText.destroy();
    if (this.micIndicator) this.micIndicator.destroy();
    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}
