/**
 * Main application file for the Electron renderer process. (Frontend)
 */
import * as PIXI from "pixi.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";
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
import { InfoOverlay } from "./assets/sprites_anime.js";
import { ThinkingSceneAnime } from "./scenes/ThinkingSceneAnime.js";
import { ListeningSceneAnime } from "./scenes/ListeningSceneAnime.js";
import { RespondingSceneAnime } from "./scenes/RespondingSceneAnime.js";

export const BACKGROUNDS = [
  "assets/images/idle_bg_main.png",
  "assets/images/idle_bg_main_2.png",
];

export const LISTENING_BACKGROUND = ["assets/images/light_background_1.png"];

export const THINKING_BACKGROUNDS = [
  "assets/images/background_3.png",
  "assets/images/deep_sea_bg.jpg",
];

export const RESPONDING_BACKGROUNDS = [
  "assets/images/background_1.png",
  "assets/images/deep_sea_bg.jpg",
  "assets/images/background_3.png",
  "assets/images/background_6.png",
];

export const RESPONDER_PROMPTS = {
  1: {
    name: "Pinto",
    prompts: [
      "Start talking, I'm listening!\n",
      "OR Press ESC to go to the homepage\n\n",
      "Examples of stuff I can help you with: \n",
      "Pick a random LeetCode problem for me.",
      "What's the weather in Portland, Oregon?",
      "How do Linked Lists work?",
      "Tell me your story.",
    ],
  },
  2: {
    name: "Jimbo",
    prompts: [
      "Start talking, I'm listening!\n",
      "OR Press ESC to go to the homepage\n\n",
      "Examples of stuff I can help you with: \n",
      "Why are you so mean?",
      "Why does everyone mess up pointers?",
      "What's the weather in Florida?",
      "What's the fastest way to crack a coding interview?",
    ],
  },
  3: {
    name: "Bongo",
    prompts: [
      "Start talking, I'm listening!\n",
      "OR Press ESC to go to the homepage\n\n",
      "Examples of stuff I can help you with: \n",
      "Walk me through dynamic programming",
      "What's the weather like in Fairbanks, Alaska?",
      "How does Binary Search work?",
      "Why do you sound so unsure of yourself? Cheer up!",
    ],
  },
  4: {
    name: "Koko",
    prompts: [
      "Start talking, I'm listening!\n",
      "OR Press ESC to go to the homepage\n\n",
      "Examples of stuff I can help you with: \n",
      "What low-level programming classes can I take next semester?",
      "How many credits do I need to graduate with a Bachelor's in CS?",
      "What electives pair well with software engineering?",
      "How did you meet Kiki?",
    ],
  },
  5: {
    name: "Kiki",
    prompts: [
      "Start talking, I'm listening!\n",
      "OR Press ESC to go to the homepage\n\n",
      "Examples of stuff I can help you with: \n",
      "How many credits do I need for a Master's degree in CS?",
      "How many electives are recommended per term?",
      "How many credits is CS510: Deep Learning?",
      "What are the grad school application requirements?",
    ],
  },
};

export const FALLBACK_PROMPTS = {
  name: "Your Companion",
  prompts: [
    "Press Escape to go back to the homepage.\n\n",
    "Examples of stuff I can help you with: \n\n",
    "Ask me anything about Computer Science!",
    "Need help with an assignment?",
    "Want to explore a CS concept together?",
  ],
};

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
  "assets/images/responder_advisor.png",
  "assets/images/responder_gradvisor.png",
];

/** Initializes a new PIXI application in the UI */
const app = new PIXI.Application();
console.log(BACKGROUNDS);

const url = window.fishbowl.config.gcpUrl;

let ws = null;
let keepRetrying = false;
let fullAgentResponse = "";
let responseTimeout = null;
let currentSessionId = 0;

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
          const sessionIdAtArrival = currentSessionId;
          console.log("Message:", event.data);
          fullAgentResponse += event.data;

          if (responseTimeout) clearTimeout(responseTimeout);

          responseTimeout = setTimeout(() => {
            if (sessionIdAtArrival !== currentSessionId) {
              console.log(
                "Aborting TTS trigger: Session is Stale, ESC invoked.",
              );
              fullAgentResponse = "";
              return;
            }
            setSubtitles(event.data);

            let layer1 = fullAgentResponse.replace(/^\s*\*+\s*/gm, "");
            let layer2 = layer1.replace(/\s*\n+\s*/g, " ");
            let layer3 = layer2.replace(/\s{2,}/g, " ").trim();
            let layer4 = layer3.replace(/\s*\n+\s*/g, ". ");

            console.log(layer4);
            if (getState() === "thinking") {
              window.fishbowl.sendToTTS(layer4);
            }
            fullAgentResponse = "";
          }, 500);
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

let infoOverlay;

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
    await PIXI.Assets.load("assets/images/listening_fish_cropped.png");
    await PIXI.Assets.load("assets/images/thinking_fish.png");
    await PIXI.Assets.load(LISTENING_BACKGROUND);
    await PIXI.Assets.load(THINKING_BACKGROUNDS);
    await PIXI.Assets.load(RESPONDING_BACKGROUNDS);

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

        if (currentScene instanceof RespondingSceneAnime) {
          currentScene.updateSubtitles(text);
        }
      });

      window.fishbowl.onResponderChange((responderId) => {
        console.log("Main Process Send Speech Setting:", responderId);

        setResponder(responderId);

        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send("PERSONALIZATION: " + responderId);
        }
      });

      window.fishbowl.onUserPrompt((text) => {
        if (getState() === "keyboard") {
          console.log("Suppressed STT: Keyboard active.");
          return;
        }
        const currentState = getState();
        if (
          currentState !== "listening" &&
          currentState !== "idle" &&
          currentState !== "thinking"
        )
          return;

        const formattedText = "You Said: " + text;
        if (currentScene instanceof ThinkingSceneAnime) {
          currentScene.updateTranscript(formattedText);
        }

        // 3. Socket Communication: Send the raw text to the MCP server
        if (ws && ws.readyState === WebSocket.OPEN) {
          console.log("STT sent to socket:", formattedText);
          ws.send(text);
          if (getState() !== "thinking") {
            window.fishbowl.requestState("thinking");
          }
        } else {
          console.warn("WebSocket not ready. Could not send STT.");
        }
      });
    }

    /**
     * The subscription monitors the global state store for any updates.
     * If an update in the store is detected, it calls setScene to trigger a scene change in the PIXI application.
     */
    subscribe((state) => {
      console.log("Store Updated, Setting Scene:", state);
      if (
        state === "responding" &&
        currentScene instanceof RespondingSceneAnime
      ) {
        return;
      }
      anime.remove("*");

      if (currentScene && typeof currentScene.destroy === "function") {
        currentScene.destroy();
      }
      setScene(app, state);

      if (infoOverlay && infoOverlay.container) {
        app.stage.addChild(infoOverlay.container);
      }
    });

    /** Default landing page initialization */
    setScene(app, "idle");
    infoOverlay = new InfoOverlay(app);
    app.stage.addChild(infoOverlay.container);
    setupKeyboardInput();
  } catch (error) {
    console.error("Failed to initialize PIXI application:", error);
  }
}

function setupKeyboardInput() {
  window.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (
      e.key === "Escape" &&
      getState() !== "thinking" &&
      getState() !== "responding"
    ) {
      currentSessionId++;
      console.log("Session Invalidated. New ID:", currentSessionId);
      setPrompt("");
      fullAgentResponse = "";
      if (responseTimeout) {
        clearTimeout(responseTimeout);
        responseTimeout = null;
      }

      window.fishbowl.requestState("idle");
      return;
    }

    const currentState = getState();

    if (currentState === "keyboard") {
      if (e.key === "Enter") {
        const prompt = getPrompt().trim();
        if (!prompt) return;

        console.log("Keyboard Prompt Submitted:", prompt);
        if (ws && ws.readyState == WebSocket.OPEN) {
          ws.send(prompt);
        } else {
          console.log("Agent is not connected to the web server");
        }

        // ------- SEND PROMPT TO MCP FROM HERE (Michel) -------------
        setPrompt("");
        window.fishbowl.requestState("thinking");
        return;
      }

      if (e.key === "Backspace") {
        setPrompt(getPrompt().slice(0, -1));
        return;
      }

      // if (e.key === "Escape") {
      //   setPrompt("");
      //   window.fishbowl.requestState("idle");
      //   return;
      // }

      if (e.key.length === 1) {
        setPrompt(getPrompt() + e.key);
      }
    } else {
      if (
        (e.key === "1" ||
          e.key === "2" ||
          e.key === "3" ||
          e.key === "4" ||
          e.key === "5") &&
        currentState === "idle"
      ) {
        if (getResponder() === Number(e.key)) {
          return;
        } else {
          window.fishbowl.requestResponderChange(Number(e.key));
          console.log("Responder selected:", e.key);
        }

        return;
      }

      if (e.key.toLowerCase() === "r") {
        const randomID = Math.floor(Math.random() * 3) + 1;
        if (getResponder() === Number(randomID)) {
          return;
        } else {
          console.log("Responder selected:", randomID);
          window.fishbowl.requestResponderChange(randomID);
        }

        return;
      }

      if (e.key.toLowerCase() === "k" && currentState === "idle") {
        e.preventDefault();
        window.fishbowl.requestState("keyboard");
        return;
      }

      if (e.key === "Escape" && currentState === "speech") {
        window.fishbowl.requestState("idle");
        return;
      }

      if (e.key.toLowerCase() === "l") {
        if (infoOverlay) infoOverlay.toggle();
        return;
      }

      if (
        infoOverlay &&
        infoOverlay.container.visible &&
        e.key.toLowerCase() !== "l"
      )
        return;
    }
  });
}

async function run_all() {
  await init();
  await connect_agent();
}

run_all();
