import { IdleScene } from "./IdleScene.js";
// import { ListeningScene } from "./ListeningScene.js";
// import { ThinkingScene } from "./ThinkingScene.js";
// import { RespondingScene } from "./RespondingScene.js";
import { ErrorScene } from "./ErrorScene.js";

let currentScene;

export function setScene(app, state) {
  if (currentScene) {
    app.stage.removeChild(currentScene.container);
    currentScene.destroy();
  }

  switch (state) {
    // case "listening":
    //   currentScene = new ListeningScene();
    //   break;
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
