/**
 * Scene manager for the PIXI landing page.
 * Based on the current application state, it initializes and switches between different scenes.
 */
import { IdleScene } from "./IdleScene.js";
import { ListeningScene } from "./ListeningScene.js";
// import { ThinkingScene } from "./ThinkingScene.js";
// import { RespondingScene } from "./RespondingScene.js";
import { ErrorScene } from "./ErrorScene.js";

// Tracks currently displayed scene
let currentScene;

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
    case "listening":
      currentScene = new ListeningScene();
      break;
    // case "thinking":
    //   currentScene = new ThinkingScene();
    //   break;
    // case "responding":
    //   currentScene = new RespondingScene();
    //   break;
    case "error":
      currentScene = new ErrorScene();
      break;
    default:
      currentScene = new IdleScene();
  }

  app.stage.addChild(currentScene.container);
}
