/**
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
  setState: (state) => ipcRenderer.send("set-ui-state", state),
});
