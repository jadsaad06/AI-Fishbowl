import * as PIXI from "pixi.js";
import { FishSwarm, CommonStyles } from "../assets/sprites.js";

export class IdleScene {
  constructor(app) {
    this.container = new PIXI.Container();

    const background = new PIXI.Graphics();
    background.beginFill(0x0b62f7);
    background.drawRect(0, 0, app.screen.width, app.screen.height);
    background.endFill();
    this.container.addChild(background);

    this.swarm = new FishSwarm(50, app.screen.width, app.screen.height);
    this.container.addChild(this.swarm.container);

    const label = new PIXI.Text("Idle State", CommonStyles.header);
    label.anchor.set(0.5);
    label.position.set(app.screen.width / 2, app.screen.height / 2 - 50);
    this.container.addChild(label);

    this.update = () => this.swarm.update();
    PIXI.Ticker.shared.add(this.update);
  }

  destroy() {
    PIXI.Ticker.shared.remove(this.update);
    this.container.destroy({ children: true });
  }
}
