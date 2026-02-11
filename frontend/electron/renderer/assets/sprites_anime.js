import * as PIXI from "pixi.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

export class AnimeIdleText {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.container.position.set(app.screen.width / 2, app.screen.height / 2);

    this.header = new PIXI.Text("AI Fishbowl", {
      fontFamily: "Roboto",
      fontSize: 64,
      fill: "#ffffff",
    });
    this.header.anchor.set(0.5);
    this.header.y = -50;

    this.subheader = new PIXI.Text("", {
      fontFamily: "Roboto",
      fontSize: 32,
      fill: "#bdefff",
    });
    this.subheader.anchor.set(0.5);
    this.subheader.y = 20;

    this.container.addChild(this.header, this.subheader);
    this._timeline = this._createTimeline();
  }

  _createTimeline() {
    const fullText = "Your aquatic CS companion";
    const typingState = { chars: 0 };

    return anime
      .timeline({ autoplay: true })
      .add({
        targets: this.container,
        alpha: [0, 1],
        translateY: [30, 0],
        duration: 1200,
        easing: "easeOutExpo",
      })
      .add({
        targets: typingState,
        chars: fullText.length,
        duration: 1800,
        easing: "linear",
        update: () => {
          this.subheader.text = fullText.slice(
            0,
            Math.floor(typingState.chars),
          );
        },
      })
      .add({
        targets: this.container.scale,
        x: [1, 1.02],
        y: [1, 1.02],
        duration: 4000,
        easing: "easeInOutSine",
        direction: "alternate",
        loop: true,
      });
  }

  destroy() {
    anime.remove(this.container);
    this.container.destroy({ children: true });
  }
}
