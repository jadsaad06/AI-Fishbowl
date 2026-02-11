import * as PIXI from "pixi.js";

import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

export class AnimeIdleText {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.position.set(app.screen.width / 2, app.screen.height / 2);

    this.header = new PIXI.Text("", {
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

    this.playAnimation();

    this.repeatInterval = setInterval(() => {
      this.playAnimation();
    }, 10000);
  }

  playAnimation() {
    anime.remove(this.container);
    anime.remove(this.header);
    anime.remove(this.subheader);

    const headerText = "AI Fishbowl";
    const subheaderText = "Your aquatic CS companion";
    const state = { headerChars: 0, subheaderChars: 0 };

    this.header.text = "";
    this.subheader.text = "";
    this.container.alpha = 0;

    anime
      .timeline({ autoplay: true })
      .add({
        targets: this.container,
        alpha: [0, 1],
        y: [this.app.screen.height / 2 + 20, this.app.screen.height / 2],
        duration: 800,
        easing: "easeOutExpo",
      })
      .add({
        targets: state,
        headerChars: headerText.length,
        duration: 800,
        easing: "linear",
        update: () => {
          this.header.text = headerText.slice(0, Math.floor(state.headerChars));
        },
      })
      .add({
        targets: state,
        subheaderChars: subheaderText.length,
        duration: 1200,
        easing: "linear",
        update: () => {
          this.subheader.text = subheaderText.slice(
            0,
            Math.floor(state.subheaderChars),
          );
        },
      })

      .add({
        targets: [this.header.scale, this.subheader.scale],
        x: 1.03,
        y: 1.03,
        duration: 1500,
        direction: "alternate",
        loop: true,
        easing: "easeInOutSine",
      });
  }

  destroy() {
    if (this.repeatInterval) clearInterval(this.repeatInterval);
    anime.remove(this.container);
    anime.remove(this.header);
    anime.remove(this.subheader);
    anime.remove(this.header.scale);
    anime.remove(this.subheader.scale);
    this.container.destroy({ children: true });
  }
}
