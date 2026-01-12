const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// Create a global reference of the kiosk window to maintain a single source of truth for the current state
let win;

/**
 * Create a new window using this function.
 * Before the window is initialized, it runs the preload.js script to set up a secure context for IPC communication.
 * Once the function is called, it loads the index.html file onto the window.
 * The window is set to fullscreen and kiosk mode to prevent user interference.
 */

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    kiosk: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "../renderer/index.html"));
}

/**
 * Electron's Inter-Process Communication Handler.
 * This allows the main process to listen for changes via the frontend (conveyed by the renderer process)
 * and also allows sending backend processes done by Node back to the renderer process.
 * If ipcRenderer sends a message on the "set-ui-state" channel, this callback runs.
 * The main process updates the UI state from the "set-ui-state" channel in the backend, and forwards the update
 * back to the renderer process via the "ui-state-changed" channel. The changes are now reflected on the frontend.
 */
ipcMain.on("set-ui-state", (event, newState) => {
  console.log("State change requested:", newState);
  win.webContents.send("ui-state-changed", newState);
});

// When Electron has finished initialization, create the kiosk browser window.
app.whenReady().then(createWindow);
