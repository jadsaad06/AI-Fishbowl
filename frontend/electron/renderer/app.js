/**
 * Main application file for the Electron renderer process. (Frontend)
 */
import * as PIXI from "pixi.js";
import { subscribe, setState } from "./state/store.js";
import { setScene } from "./scenes/index.js";

/** Initializes a new PIXI application in the UI */
const app = new PIXI.Application();

/**
 * Initializes the PIXI application, sets up IPC listeners for state changes,
 * and subscribes to the state store to update scenes accordingly.
 * preload.js exposes the "fishbowl" API in the window context allowing app.js to request state changes
 * using functions like onStateChange and setState.
 */
async function init() {
  try {
    /** Displays the application document */
    await app.init({
      resizeTo: window,
      //background: "#0b62f7ff",
    });
    document.body.appendChild(app.canvas);

    await PIXI.Assets.load(["./assets/images/Underwater BG Blank.png"]);

    /**
     * If the main process broadcasts a new UI state, this IPC listener is triggered.
     * After trigger, it updates the local state store with the new state received via subscription.
     */
    if (window.fishbowl) {
      window.fishbowl.onStateChange((newState) => {
        console.log("IPC Received State:", newState);
        setState(newState);
      });
    }

    /**
     * The subscription monitors the global state store for any updates.
     * If an update in the store is detected, it calls setScene to trigger a scene change in the PIXI application.
     */
    subscribe((state) => {
      console.log("Store Updated, Setting Scene:", state);
      setScene(app, state);
    });

    /** Default landing page initialization */
    setScene(app, "idle");
  } catch (error) {
    console.error("Failed to initialize PIXI application:", error);
  }
}

/** Log unhandled errors and call the init function */
init().catch(console.error);
