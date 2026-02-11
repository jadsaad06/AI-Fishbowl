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
  setResponder,
  getResponder,
} from "./state/store.js";
import { setScene, currentScene } from "./scenes/index.js";
import { RespondingScene } from "./scenes/RespondingScene.js";
import { ListeningScene } from "./scenes/ListeningScene.js";
import { ThinkingScene } from "./scenes/ThinkingScene.js";

export const BACKGROUNDS = [
  "assets/images/idle_bg_main.png",
  "assets/images/idle_bg_main_2.png",
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

const url = window.fishbowl.config.gcpUrl;

let ws = null;
let keepRetrying = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connect_agent() {
  keepRetrying = true;

  while (keepRetrying) {
    try {
      ws = await new Promise((resolve, reject) => {
        const sock = new WebSocket(`wss://${url}/text_input`);

        sock.addEventListener("open", () => {
          console.log("WS connected");
          //sock.send("Hello man!");
          resolve(sock);
        });

        sock.addEventListener("message", (event) => {
          console.log("Message:", event.data);
          setSubtitles(event.data);
          window.fishbowl.sendToTTS(event.data);
          //setScene(app, "responding");
        });

        // either error or close => treat as failed/ended connection
        sock.addEventListener("error", () => reject(new Error("WS error")));
        sock.addEventListener("close", () => reject(new Error("WS closed")));
      });

      // Wait until it closes before reconnecting
      await new Promise((resolve) =>
        ws.addEventListener("close", resolve, { once: true }),
      );
    } catch (e) {
      if (!keepRetrying) break;
      console.log("Retrying in 5 seconds...", e);
      await sleep(5000);
    }
  }
}

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

window.fishbowl.onUserPrompt((text) => {
  if (getState() === "keyboard") {
    console.log("Suppressed STT: Keyboard active.");
    return;
  }

  const responder = getResponder();
  const formattedText = "Prompt: " + text;
  const finalText = responder ? `RESPONDER_NUM:${responder}\n${text}` : text;
  if (currentScene instanceof ThinkingScene) {
    currentScene.updateTranscript(formattedText);
  }

  // 3. Socket Communication: Send the raw text to the MCP server
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log("STT sent to socket:", finalText);
    ws.send(finalText);
    setScene("thinking");
  } else {
    console.warn("WebSocket not ready. Could not send STT.");
  }
});

function setupKeyboardInput() {
  window.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const currentState = getState();
    if (e.key === "1" || e.key === "2" || e.key === "3") {
      setResponder(Number(e.key));
      console.log("Responder selected:", e.key);
      return;
    }

    if (e.key.toLowerCase() === "k" && currentState !== "keyboard") {
      e.preventDefault();
      window.fishbowl.setState("keyboard");
      return;
    }

    if (currentState === "keyboard") {
      if (e.key === "Enter") {
        const responder = getResponder();
        const prompt = getPrompt().trim();
        const finalPrompt = responder
          ? `RESPONDER_NUM:${responder}\n${prompt}`
          : prompt;
        if (!prompt) return;

        console.log("Keyboard Prompt Submitted:", prompt);
        if (ws && ws.readyState == WebSocket.OPEN) {
          ws.send(finalPrompt);
        } else {
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

async function run_all() {
  await init();
  await connect_agent();
}

run_all();
