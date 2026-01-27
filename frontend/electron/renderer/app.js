/**
 * Main application file for the Electron renderer process. (Frontend)
 */
import * as PIXI from "pixi.js";
import {
  subscribe,
  setState,
  setSubtitles,
  setPrompt,
  getPrompt,
  getState,
} from "./state/store.js";
import { setScene, currentScene } from "./scenes/index.js";
import { RespondingScene } from "./scenes/RespondingScene.js";

export const BACKGROUNDS = [
  "assets/images/idle_bg_1.png",
  "assets/images/idle_bg_2.png",
  "assets/images/idle_bg_3.png",
  "assets/images/idle_bg_4.png",
  "assets/images/idle_bg_5.png",
  "assets/images/idle_bg_6.png",
];

export const ANIMATED_FISH = [
  "assets/images/fish_blue.png",
  "assets/images/fish_brown.png",
  "assets/images/fish_green.png",
  "assets/images/fish_orange.png",
  "assets/images/fish_red.png",
  "assets/images/fish_pink.png",
  "assets/images/fish_grey.png",
];

export const ENHANCED_FISH = [
  "assets/images/Red_Fish_AnarkaliArt.png",
  "assets/images/animated_fish_1.png",
  "assets/images/animated_fish_2.png",
  "assets/images/fish_tuna.png",
];

export const RESPONDERS = [
  "assets/images/responder_1.png",
  "assets/images/responder_2.png",
  "assets/images/responder_3.png",
];

/** Initializes a new PIXI application in the UI */
const app = new PIXI.Application();
console.log(BACKGROUNDS);




/**
 * Initializes the PIXI application, sets up IPC listeners for state changes,
 * and subscribes to the state store to update scenes accordingly.
 * preload.js exposes the "fishbowl" API in the window context allowing app.js to request state changes
 * using functions like onStateChange and setState.
 */
async function init() {
  try {
    await PIXI.Assets.load(BACKGROUNDS);
    await PIXI.Assets.load(ANIMATED_FISH);
    await PIXI.Assets.load(ENHANCED_FISH);
    await PIXI.Assets.load(RESPONDERS);
    await PIXI.Assets.load("assets/images/ocean_diver.png");

    /** Displays the application document */
    await app.init({
      resizeTo: window,
    });
    document.body.appendChild(app.canvas);

    /**
     * If the main process broadcasts a new UI state, this IPC listener is triggered.
     * After trigger, it updates the local state store with the new state received via subscription.
     */
    if (window.fishbowl) {
      window.fishbowl.onStateChange((newState) => {
        console.log("IPC Received State:", newState);
        setState(newState);
      });

      window.fishbowl.onAgentResponse((text) => {
        console.log("IPC Received Subtitles: ", text);
        setSubtitles(text);

        if (currentScene instanceof RespondingScene) {
          currentScene.updateSubtitles(text);
        }
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
    setupKeyboardInput();
  } catch (error) {
    console.error("Failed to initialize PIXI application:", error);
  }
}

/** Log unhandled errors and call the init function */
init();

let ws = null;
let is_connected = false;



setTimeout(() => {
  ws = new WebSocket("ws://localhost:8000/text_input");

  ws.addEventListener("open", (event) => {
    console.log("Connection from someone");
    ws.send("Hello man!")
    is_connected = true;
  });

  ws.addEventListener("message", (event) => {
    console.log("YOU HAVE RECEIVED A MESSAGE");
    console.log(event.data);
    setSubtitles(event.data);
    setScene(app, "responding")
  });

  ws.addEventListener("close", (event) => {
    console.log("You are terminating connection");
    console.log(event);
    is_connected = false;

  });

}, 10000);

if (socket.readyState === WebSocket.CLOSED) {
    console.log("Connection is closed. Cannot send data.");
}

else if (socket.readyState === WebSocket.OPEN) {
    console.log("Connection is open. Can send data.");
}



function setupKeyboardInput() {
  window.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const currentState = getState();

    if (e.key.toLowerCase() === "k" && currentState !== "keyboard") {
      e.preventDefault();
      window.fishbowl.setState("keyboard");
      return;
    }

    if (currentState === "keyboard") {
      if (e.key === "Enter") {
        const prompt = getPrompt().trim();
        if (!prompt) return;

        console.log("Keyboard Prompt Submitted:", prompt);
        if (ws && ws.readyState == WebSocket.OPEN){
          ws.send(prompt);
        }
        else{
          console.log("Agent is not connected to the web server");
        }

        // ------- SEND PROMPT TO MCP FROM HERE (Michel) -------------
        setPrompt("");
        window.fishbowl.setState("thinking");
        return;
      }

      if (e.key === "Backspace") {
        setPrompt(getPrompt().slice(0, -1));
        return;
      }

      if (e.key === "Escape") {
        setPrompt("");
        window.fishbowl.setState("idle");
        return;
      }

      if (e.key.length === 1) {
        setPrompt(getPrompt() + e.key);
      }
    }
  });
}
