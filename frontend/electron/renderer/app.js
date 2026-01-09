import * as PIXI from "pixi.js";
import { subscribe, setState } from "./state/store.js";
import { setScene } from "./scenes/index.js";

const app = new PIXI.Application();

async function init() {
  try {
    await app.init({
      resizeTo: window,
      background: "#0bf7ecff",
    });
    document.body.appendChild(app.canvas);

    if (window.fishbowl) {
      window.fishbowl.onStateChange((newState) => {
        console.log("IPC Received State:", newState);
        setState(newState);
      });
    }

    subscribe((state) => {
      console.log("Store Updated, Setting Scene:", state);
      setScene(app, state);
    });

    setScene(app, "idle");
  } catch (error) {
    console.error("Failed to initialize PIXI application:", error);
  }
}

init().catch(console.error);
