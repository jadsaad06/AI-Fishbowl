/**
 * Scene manager for the PIXI landing page.
 * Based on the current application state, it initializes and switches between different scenes.
 */
//import { IdleScene } from "./IdleScene.js";
import { IdleSceneAnime } from "./IdleSceneAnime.js";
import { ListeningSceneAnime } from "./ListeningSceneAnime.js";
import { ThinkingSceneAnime } from "./ThinkingSceneAnime.js";
import { RespondingSceneAnime } from "./RespondingSceneAnime.js";
import { SpeechSceneAnime } from "./SpeechSceneAnime.js";
//import { ListeningScene } from "./ListeningScene.js";
// import { ThinkingScene } from "./ThinkingScene.js";
// import { RespondingScene } from "./RespondingScene.js";
import { ErrorScene } from "./ErrorScene.js";
import { KeyboardScene } from "./KeyboardScene.js";
import { getSubtitles } from "../state/store.js";

// Tracks currently displayed scene
export let currentScene;

/**
 * Updates the displayed scene in the application window.
 * Loads a new scene where each Scene contains a different pixi container depending on the state.
 * @param {*} app PIXI application instance
 * @param {*} state current application state
 */
export function setScene(app, state) {
  /** Prevents rendering of leftover graphics */
  if (currentScene) {
    app.stage.removeChild(currentScene.container);
    currentScene.destroy();
  }

  switch (state) {
    case "idle":
      currentScene = new IdleSceneAnime(app);
      break;
    case "speech":
      currentScene = new SpeechSceneAnime(app);
      break;
    case "keyboard":
      currentScene = new KeyboardScene(app);
      break;
    case "listening":
      currentScene = new ListeningSceneAnime(app);
      break;
    case "thinking":
      currentScene = new ThinkingSceneAnime(app);
      break;
    case "responding":
      const text = getSubtitles();
      currentScene = new RespondingSceneAnime(app, text);
      break;
    case "error":
      currentScene = new ErrorScene();
      break;
    default:
      currentScene = new IdleSceneAnime(app);
  }

  app.stage.addChild(currentScene.container);
}
