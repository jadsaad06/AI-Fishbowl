import * as PIXI from "pixi.js";

export class ListeningScene {
  constructor() {
    this.container = new PIXI.Container();

    this.text = new PIXI.Text("Listening...", {
      fill: "#ffffff",
      fontSize: 32,
      align: "center",
      fontWeight: "bold",
    });

    this.text.anchor.set(0.5);
    this.text.x = window.innerWidth / 2;
    this.text.y = window.innerHeight / 2;

    this.container.addChild(this.text);

    this.ticker = (ticker) => {
      this.text.alpha = 0.5 + 0.5 * Math.sin(ticker.lastTime / 200);
    };
    PIXI.Ticker.shared.add(this.ticker);
  }

  destroy() {
    PIXI.Ticker.shared.remove(this.ticker);
    this.container.destroy({ children: true });
  }
}
