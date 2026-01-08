import * as PIXI from "pixi.js";
import { subscribe } from "./state/store.js";
import { setScene } from "./scenes/index.js";

const app = new PIXI.Application({
  resizeTo: window,
  backgroundColor: 0x000000,
});

document.body.appendChild(app.view);

subscribe((state) => {
  setScene(app, state);
});
