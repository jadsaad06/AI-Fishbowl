import * as PIXI from "pixi.js";

export class IdleScene {
  constructor() {
    this.container = new PIXI.Container();

    const text = new PIXI.Text(
      "Press the microphone switch and ask a question",
      {
        fill: "white",
        fontSize: 36,
      }
    );

    text.anchor.set(0.5);
    text.x = window.innerWidth / 2;
    text.y = window.innerHeight / 2;

    this.container.addChild(text);
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
