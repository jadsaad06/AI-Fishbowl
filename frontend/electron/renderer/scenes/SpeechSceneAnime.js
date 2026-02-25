import * as PIXI from "pixi.js";
import { getResponder } from "../state/store.js";
import { BackgroundRandomizer, createResponder } from "../assets/sprites.js";
import { PulseText, ModernBox } from "../assets/sprites_anime.js";
import { RESPONDERS, RESPONDING_BACKGROUNDS } from "../app.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

const RESPONDER_PROMPTS = {
  1: {
    name: "Pinto",
    prompts: [
      "Press Escape to go back to the homepage.\n\n",
      "Examples of stuff I can help you with: \n\n",
      "Pick a random LeetCode problem for me.",
      "What's the weather in Portland, Oregon?",
      "How do Linked Lists work?",
      "Tell me your story.",
    ],
  },
  2: {
    name: "Jimbo",
    prompts: [
      "Press Escape to go back to the homepage.\n\n",
      "Examples of stuff I can help you with: \n\n",
      "Why are you so mean?",
      "Why does everyone mess up pointers?",
      "What's the weather in Florida?",
      "What's the fastest way to crack a coding interview?",
    ],
  },
  3: {
    name: "Bongo",
    prompts: [
      "Press Escape to go back to the homepage.\n\n",
      "Examples of stuff I can help you with: \n\n",
      "Walk me through dynamic programming",
      "What's the weather like in Fairbanks, Alaska?",
      "How does Binary Search work?",
      "Why do you sound so unsure of yourself? Cheer up!",
    ],
  },
  4: {
    name: "Koko",
    prompts: [
      "What low-level programming classes can I take next semester?",
      "How many credits do I need to graduate with a Bachelor's in CS?",
      "What electives pair well with software engineering?",
      "How did you meet Kiki?",
    ],
  },
  5: {
    name: "Kiki",
    prompts: [
      "Press Escape to go back to the homepage.\n\n",
      "Examples of stuff I can help you with: \n\n",
      "How many credits do I need for a Master's degree in CS?",
      "How many electives are recommended per term?",
      "How many credits is CS510: Deep Learning?",
      "What are the grad school application requirements?",
    ],
  },
};

const FALLBACK_PROMPTS = {
  name: "Your Companion",
  prompts: [
    "Press Escape to go back to the homepage.\n\n",
    "Examples of stuff I can help you with: \n\n",
    "Ask me anything about Computer Science!",
    "Need help with an assignment?",
    "Want to explore a CS concept together?",
  ],
};

export class SpeechSceneAnime {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bg = new BackgroundRandomizer(app, RESPONDING_BACKGROUNDS);
    this.container.addChild(this.bg.container);

    this.syncGroup = new PIXI.Container();
    this.syncGroup.position.set(app.screen.width * 0.1, app.screen.height / 2);
    this.container.addChild(this.syncGroup);

    const selectedID = getResponder();
    const responderIndex = selectedID && selectedID > 0 ? selectedID - 1 : 0;
    const responderPath = RESPONDERS[responderIndex];

    this.responder = createResponder(app, responderPath, 350);
    this.responder.position.set(0, 0);
    this.syncGroup.addChild(this.responder);

    const responderData = RESPONDER_PROMPTS[selectedID] || FALLBACK_PROMPTS;
    const promptText = responderData.prompts.join("\n\n");

    this.pulseText = new PulseText(
      promptText,
      {
        fontFamily: "Courier New",
        fontSize: 30,
        fill: "#ffffff",
        align: "left",
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
    this.pulseText.container.position.set(250, 0);

    this.promptBox = new ModernBox(40, 0x1a1a1a, 0.9);
    this.pulseText.container.addChildAt(this.promptBox.graphics, 0);

    this.syncGroup.addChild(this.pulseText.container);

    this.promptBox.reshape(this.pulseText.textObject);

    this.updateLoop = () => {
      if (this.promptBox && this.pulseText) {
        this.promptBox.reshape(this.pulseText.textObject);
      }
    };
    this.app.ticker.add(this.updateLoop);

    this.initAnimations();
  }

  initAnimations() {
    const finalX = this.app.screen.width * 0.15;
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
    if (this.updateLoop) {
      this.app.ticker.remove(this.updateLoop);
    }
    anime.remove(this.syncGroup);
    if (this.pulseText) this.pulseText.destroy();
    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}
