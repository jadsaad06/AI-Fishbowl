const { ipcMain } = require("electron");

let uiState = "idle";

module.exports = (win) => {
  ipcMain.on("set-ui-state", (_, state) => {
    uiState = state;
    win.webContents.send("ui-state", uiState);
  });
};
