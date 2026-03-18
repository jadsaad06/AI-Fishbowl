/**
 * Main Inter Process Communication handler which allows the backend to safely allow the frontend
 * to use APIs configured in Node without including the APIs in the frontend source code.
 *
 * Controlled API exposure for Electron's renderer process.
 * This script runs before the application is launched, and creates a bridge between the frontend
 * renderer process and the Node APIs accessed by the main process.
 * The bridge transmits information from the frontend to the main process using ipcRenderer.
 */
const { contextBridge, ipcRenderer } = require("electron");

/**
 * Lets the renderer process subscribe to state changes from the main process.
 * Preload bridge exists in the window context as "fishbowl".
 */
contextBridge.exposeInMainWorld("fishbowl", {
  // ipcRenderer listens to the channel "ui-state-changed" for any state updates from the main process.
  onStateChange: (cb) =>
    ipcRenderer.on("ui-state-changed", (_, state) => cb(state)),
  // Lets the renderer process request a UI state change in the main process.
  // If the request is approved, the main process updates uiState and broadcasts the change back to all renderer windows.
  requestState: (state) => ipcRenderer.send("request-state-transition", state),

  // Opens a bridge between the renderer and main to allow the renderer to send the
  // response received from the MCP agent to the main process.
  onAgentResponse: (cb) =>
    ipcRenderer.on("render-subtitles", (_, text) => cb(text)),

  // Opens a bridge to send the user prompt collected from the keyboard listener in the renderer (app.js)
  // to the main process. Currently unused as the prompt is processed and displayed all on the frontend.
  sendKeyboardPrompt: (text) => ipcRenderer.send("keyboard-prompt", text),

  // This handler is called in app.js to send the agent response to the main process, which contains the
  // child process spawned for the text to speech script. The main process forwards the agent response to
  // the text to speech if it is open and has standard input active.
  sendToTTS: (text) => ipcRenderer.send("send-to-tts", text),

  // This handler is used by app.js to collect the user prompt received from the speech to text script and use
  // it in the thinking state to show the user their spoken prompt. Does not apply to keyboard prompts.
  onUserPrompt: (cb) =>
    ipcRenderer.on("display-user-prompt", (_event, value) => cb(value)),

  // The main process uses this handler to convey the authoritative current responder, overriding
  // the current responder stored in the renderer. This ensures that when a responder is changed,
  // it is preserved and communicated across the pipeline.
  onResponderChange: (cb) =>
    ipcRenderer.on("responder-force-update", (_, responderId) =>
      cb(responderId),
    ),

  // The renderer uses this bridge to request a responder change if a responder is chosen
  // via the keyboard, or via the pullout menu. The main process checks if there is a conflict
  // in the responder chosen via keyboard and via 'hey bob', and updates the renderer with
  // the authoritative choice.
  requestResponderChange: (id) =>
    ipcRenderer.send("request-responder-change", id),

  // The main process conveys the MIC_STARTED and MIC_STOPPED events from the STT script to the
  // renderer, which uses the events to render live 'mic listening'/'mic standby' animations.
  onMicState: (cb) =>
    ipcRenderer.on("mic-state-changed", (_, payload) => cb(payload)),

  // This handler exposes sensitive environment variables from the Node backend, then the main process,
  // and then sends it to the renderer. This allows the renderer to access those variables
  // without exposing the API calls and the environment variables.
  config: {
    gcpUrl: process.env.GCP_MCP_URL,
    apiNinjasKey: process.env.API_NINJAS_KEY,
  },
});
