import * as PIXI from "pixi.js";

export class ErrorScene {
  constructor() {
    this.container = new PIXI.Container();
    this.init();
  }

  init() {
    const text = new PIXI.Text({
      text: "An error occured. Please try again.",
      style: { fill: "red", fontSize: 48, fontWeight: "bold" },
    });
    this.container.addChild(text);
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
