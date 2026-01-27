import * as PIXI from "pixi.js";
import { subscribePrompt } from "../state/store.js";
import { BACKGROUNDS } from "../app.js";
import { BackgroundManager } from "../assets/sprites.js";

export class KeyboardScene {
  constructor(app) {
    this.container = new PIXI.Container();

    const margin = 40;
    const boxHeight = 100;
    const boxY = app.screen.height - boxHeight - margin;
    const boxWidth = app.screen.width - margin * 2;

    this.bgManager = new BackgroundManager(app, BACKGROUNDS);
    this.container.addChild(this.bgManager.container);

    this.promptBox = new PIXI.Graphics();
    this.promptBox.beginFill(0x1a1a1a, 0.85);
    this.promptBox.lineStyle(2, 0x00f000, 1);
    this.promptBox.drawRoundedRect(0, 0, boxWidth, boxHeight, 15);
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

    this.bgInterval = setInterval(() => {
      this.bgManager.next();
    }, 5000);
  }

  destroy() {
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
    this.unsubscribe?.();
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
