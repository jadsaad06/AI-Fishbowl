import * as PIXI from "pixi.js";

import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

export class ModernBox {
  constructor(padding = 30, color = 0x1a1a1a, alpha = 0.9) {
    this.graphics = new PIXI.Graphics();
    this.padding = padding;
    this.color = color;
    this.boxAlpha = alpha;
  }

  reshape(targets) {
    const targetArray = Array.isArray(targets) ? targets : [targets];

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    targetArray.forEach((target) => {
      const w = target.width;
      const h = target.height;
      const x = target.x - target.anchor.x * w;
      const y = target.y - target.anchor.y * h;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    const width = maxX - minX + this.padding * 2;
    const height = maxY - minY + this.padding * 2;

    this.graphics.clear();
    this.graphics.fill({ color: this.color, alpha: this.boxAlpha });
    this.graphics.roundRect(
      minX - this.padding,
      minY - this.padding,
      width,
      height,
      12,
    );
    this.graphics.fill();
  }
}

export class AnimeIdleText {
  constructor(app) {
    this.app = app;

    this.container = new PIXI.Container();
    this.container.position.set(app.screen.width / 2, app.screen.height / 2);

    this.bgBox = new ModernBox(40);
    this.container.addChild(this.bgBox.graphics);

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
    anime.remove([
      this.container,
      this.header,
      this.subheader,
      this.bgBox.graphics,
    ]);

    const headerText = "AI Fishbowl";
    const subheaderText = "Your aquatic CS companion";
    const state = { headerChars: 0, subheaderChars: 0 };

    this.header.text = "";
    this.subheader.text = "";
    this.container.alpha = 0;
    this.bgBox.graphics.alpha = 0;

    anime
      .timeline({ autoplay: true })
      .add({
        targets: this.container,
        alpha: [0, 1],
        y: [this.app.screen.height / 2 + 20, this.app.screen.height / 2],
        duration: 800,
        easing: "easeOutExpo",
      })
      .add(
        {
          targets: this.bgBox.graphics,
          alpha: [0, 1],
          duration: 500,
          easing: "linear",
        },
        "-400",
      )
      .add({
        targets: state,
        headerChars: headerText.length,
        duration: 800,
        easing: "linear",
        update: () => {
          this.header.text = headerText.slice(0, Math.floor(state.headerChars));
          this.bgBox.reshape([this.header, this.subheader]);
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
          this.bgBox.reshape([this.header, this.subheader]);
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
