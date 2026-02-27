import * as PIXI from "pixi.js";
import { subscribePrompt, getResponder } from "../state/store.js";
import {
  BACKGROUNDS,
  RESPONDER_PROMPTS,
  RESPONDERS,
  FALLBACK_PROMPTS,
} from "../app.js";
import { BackgroundManager, createResponder } from "../assets/sprites.js";
import { PulseText, ModernBox } from "../assets/sprites_anime.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

export class KeyboardScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bgManager = new BackgroundManager(app, BACKGROUNDS);
    this.container.addChild(this.bgManager.container);

    const margin = 40;
    const boxHeight = 80;
    const boxY = app.screen.height - boxHeight - margin;
    const boxWidth = app.screen.width - margin * 2;

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
        fontSize: 26,
        fill: "#ffffff",
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

    this.hintBox = new ModernBox(30, 0x1a1a1a, 0.7);
    this.hintText.container.addChildAt(this.hintBox.graphics, 0);

    this.syncGroup.addChild(this.hintText.container);

    this.hintBox.reshape(this.hintText.textObject);

    this.promptBox = new PIXI.Graphics();
    this.promptBox.beginFill(0x1a1a1a, 0.85);
    this.promptBox.lineStyle(2, 0x00f000, 1);
    this.promptBox.drawRoundedRect(
      0,
      0,
      app.screen.width - margin * 2,
      boxHeight,
      15,
    );
    this.promptBox.endFill();

    this.promptBox.position.set(margin, boxY);
    this.container.addChild(this.promptBox);

    this.text = new PIXI.Text({
      text: "> Ready to type...",
      style: {
        fontFamily: "monospace",
        fill: "#00f000",
        fontSize: 24,
        wordWrap: true,
        wordWrapWidth: boxWidth - 40,
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
    };
    this.app.ticker.add(this.updateLoop);

    this.initAnimations();

    this.bgInterval = setInterval(() => {
      this.bgManager.next();
    }, 5000);
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
    this.unsubscribe?.();
    this.app.ticker.remove(this.updateLoop);
    anime.remove(this.syncGroup);
    if (this.hintText) this.hintText.destroy();
    this.container.destroy({ children: true });
  }
}

// export class KeyboardScene {
//   constructor(app) {
//     this.container = new PIXI.Container();

//     const promptBox = new PIXI.Graphics();
//     promptBox.beginFill(0x00f000, 0.6);
//     promptBox.drawRoundedRect(
//       0,
//       app.screen.height - 240,
//       app.screen.width,
//       120,
//       20,
//     );
//     promptBox.endFill();

//     this.container.addChild(promptBox);

//     this.text = new PIXI.Text({
//       text: "",
//       style: {
//         fill: "#ffffff",
//         fontSize: 28,
//         wordWrap: true,
//         wordWrapWidth: app.screen.width - 60,
//       },
//     });

//     this.text.position.set(30, app.screen.height - 90);
//     this.container.addChild(this.text);

//     this.unsubscribe = subscribePrompt((prompt) => {
//       this.text.text = `> ${prompt}_`;
//     });
//   }

//   destroy(app) {
//     this.unsubscribe?.();
//     this.container.destroy({ children: true });
//   }
// }
