const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fishbowl", {
  onStateChange: (cb) => ipcRenderer.on("ui-state", (_, state) => cb(state)),
  setState: (state) => ipcRenderer.send("set-ui-state", state),
});
