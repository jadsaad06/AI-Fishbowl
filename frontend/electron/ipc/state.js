/** Importing main process */
const { ipcMain } = require("electron");

/** Initial UI state */
let uiState = "idle";

/**
 * Exports a function that allows the module to send updates from the main process back to the renderer process.
 * @param {*} win BrowserWindow instance representing the current application window.
 */
module.exports = (win) => {
  /**
   * If preload.js sends a new state request from the renderer process,
   * this callback is triggered in the main process and sent here, where the state is updated
   * and is broadcast back to the frontend renderer process.
   */
  ipcMain.on("set-ui-state", (_, state) => {
    uiState = state;
    win.webContents.send("ui-state", uiState);
  });
};
