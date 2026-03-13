/**
 * This file contains the animations for the thinking scene that is invoked when the user prompt from
 * the speech state or the keyboard state is successfully sent to the MCP agent.
 *
 * It spawns a fish with multiple Diver sprites swimming around it, displaying multiple "thinking indicators"
 * that imitate loading. Since this can be displayed for an undeterministic amount of time, the thinking indicators
 * are set on shuffle and update every second.
 *
 * The state also displays that the microphone is off.
 *
 * It is automatically cleaned up and destroyed to spawn the responding state after the socket receives the agent response.
 */
import * as PIXI from "pixi.js";
import {
  BackgroundRandomizer,
  createFishSprite,
  Diver,
} from "../assets/sprites.js";
import {
  TypewriterText,
  ModernBox,
  PulseText,
} from "../assets/sprites_anime.js";
import { BACKGROUNDS } from "../app.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

export class ThinkingSceneAnime {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bg = new BackgroundRandomizer(app, BACKGROUNDS);
    this.container.addChild(this.bg.container);

    this.divers = [];
    for (let i = 0; i < 3; i++) {
      const diverInstance = new Diver(app, 200);
      this.divers.push(diverInstance);
      this.container.addChild(diverInstance.sprite);
    }

    this.syncGroup = new PIXI.Container();
    this.syncGroup.position.set(app.screen.width / 2, app.screen.height / 2);
    this.container.addChild(this.syncGroup);

    const fishPath = ["assets/images/thinking_fish.png"];
    this.centerFish = createFishSprite(fishPath, 600);
    this.centerFish.position.set(0, 0);
    this.syncGroup.addChild(this.centerFish);

    this.statusMessages = [
      "Putting My Humans To Work",
      "Collecting Information",
      "Contacting Agent",
      "Pooling Resources",
      "Multiplying Matrix Embeddings",
      "Other Loading Screen Zoomies...",
    ];
    this.statusIndex = 0;

    this.statusLabel = new PulseText(
      this.statusMessages[0],
      {
        fontFamily: "Courier New",
        fontSize: 28,
        fill: "#FFC35C",
        align: "center",
      },
      {
        minScale: 0.98,
        maxScale: 1.05,
        duration: 2000,
      },
    );

    this.statusBox = new ModernBox(40, 0x000000, 0.8);
    this.statusLabel.container.addChildAt(this.statusBox.graphics, 0);
    this.statusLabel.container.position.set(0, -380);
    this.syncGroup.addChild(this.statusLabel.container);

    this.statusInterval = setInterval(() => {
      this.statusIndex = (this.statusIndex + 1) % this.statusMessages.length;
      this.statusLabel.setText(this.statusMessages[this.statusIndex]);
    }, 1500);

    this.userPrompt = new TypewriterText(
      "Mic Off, Thinking...",
      {
        fontFamily: "Roboto",
        fontSize: 32,
        fill: "#FFC35C",
        align: "center",
        wordWrap: true,
        wordWrapWidth: 600,
      },
      {
        durationPerChar: 10,
        loop: false,
      },
    );

    this.promptBox = new ModernBox(40, 0x000000, 0.8);
    this.userPrompt.container.addChildAt(this.promptBox.graphics, 0);
    this.userPrompt.container.position.set(0, 350);
    this.syncGroup.addChild(this.userPrompt.container);

    this.updateLoop = () => {
      this.divers.forEach((d) => d.update());
      if (this.statusBox && this.statusLabel) {
        this.statusBox.reshape(this.statusLabel.textObject);
      }

      if (this.promptBox && this.userPrompt) {
        this.promptBox.reshape(this.userPrompt.textObject);
      }
    };

    this.app.ticker.add(this.updateLoop);
    this.userPrompt.play();

    anime({
      targets: this.syncGroup,
      y: app.screen.height / 2 - 40,
      duration: 3000,
      easing: "easeInOutQuad",
      direction: "alternate",
      loop: true,
    });
  }

  updateTranscript(text) {
    if (!this.userPrompt) return;
    this.userPrompt.stop();
    this.userPrompt.setText(text);
    this.userPrompt.play();
  }

  destroy() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
    if (this.updateLoop) {
      this.app.ticker.remove(this.updateLoop);
    }

    anime.remove(this.syncGroup);

    if (this.userPrompt) {
      this.userPrompt.destroy();
    }
    if (this.statusLabel) this.statusLabel.destroy();

    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}
