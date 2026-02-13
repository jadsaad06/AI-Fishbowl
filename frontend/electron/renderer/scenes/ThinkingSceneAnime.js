import * as PIXI from "pixi.js";
import { BackgroundRandomizer } from "../assets/sprites.js";
import { TypewriterText, ModernBox } from "../assets/sprites_anime.js";
import { THINKING_BACKGROUNDS } from "../app.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

export class ThinkingSceneAnime {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bg = new BackgroundRandomizer(app, THINKING_BACKGROUNDS);
    this.container.addChild(this.bg.container);

    this.promptGroup = new PIXI.Container();
    this.promptGroup.position.set(app.screen.width / 2, app.screen.height / 2);
    this.container.addChild(this.promptGroup);

    this.promptBox = new ModernBox(40, 0x0b2d87, 0.8);
    this.promptGroup.addChild(this.promptBox.graphics);

    this.userPrompt = new TypewriterText(
      "Thinking..",
      {
        fontFamily: "Roboto",
        fontSize: 32,
        fill: "#ffffff",
        align: "center",
        wordWrap: true,
        wordWrapWidth: app.screen.width * 0.7,
      },
      {
        durationPerChar: 30,
        loop: false,
      },
    );

    this.promptGroup.addChild(this.userPrompt.container);

    this.updateLoop = () => {
      if (this.promptBox && this.userPrompt) {
        this.promptBox.reshape(this.userPrompt.textObject);
      }
    };
    this.app.ticker.add(this.updateLoop);
    this.userPrompt.play();
  }

  updateTranscript(text) {
    this.userPrompt.stop();
    this.userPrompt.setText(text);
    this.userPrompt.play();
  }

  destroy() {
    if (this.updateLoop) {
      this.app.ticker.remove(this.updateLoop);
    }

    if (this.userPrompt) {
      this.userPrompt.destroy();
    }

    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}
