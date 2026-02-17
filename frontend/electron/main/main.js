const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const { start } = require("repl");
require("dotenv").config();

const GCP_URL = process.env.GCP_MCP_URL;
app.commandLine.appendSwitch("disable-features", "AutofillServerCommunication");
app.commandLine.appendSwitch("log-level", "3");

// Create a global reference of the kiosk window to maintain a single source of truth for the current state
let win;
let currentAppState = "idle";

/**
 * Create a new window using this function.
 * Before the window is initialized, it runs the preload.js script to set up a secure context for IPC communication.
 * Once the function is called, it loads the index.html file onto the window.
 * The window is set to fullscreen and kiosk mode to prevent user interference.
 */

function createWindow() {
  // const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: false,
    kiosk: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "../renderer/index.html"));
}

function updateUIState(newState) {
  console.log("State Transition: ", newState);
  if (win) {
    win.webContents.send("ui-state-changed", newState);
  }
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
  currentAppState = newState;
  win.webContents.send("ui-state-changed", newState);
});

ipcMain.on("keyboard-prompt", (_, text) => {
  console.log("Keyboard input received:", text);
  // Forward text to Michel ###########
});

function startServices() {
  const stt = spawn("python", [
    "-u",
    path.join(
      __dirname,
      "../../../backend/src/services/stt/Test/test_transcribe.py",
    ),
  ]);

  stt.stdout.on("data", (data) => {
    const out = data.toString();
    if (currentAppState === "keyboard") {
      return;
    }

    if (out.includes("[Transcript]:")) {
      console.log(out);
      const promptText = out.replace("[Transcript]:", "").trim();
      if (currentAppState === "idle" || currentAppState === "listening") {
        updateUIState("thinking");
        if (stt && stt.stdin.writable) {
          stt.stdin.write("pause\n");
        }
        win.webContents.send("display-user-prompt", promptText);
      } else {
        console.log(`[STT IGNORED] System busy in state: ${currentAppState}`);
      }
    }

    if (out.includes("EVENT:MIC_STARTED")) {
      if (currentAppState === "idle") {
        updateUIState("listening");
      }
    }
  });

  const tts = spawn("python", [
    path.join(__dirname, "../../../backend/src/services/tts/tts_wrapper.py"),
  ]);

  ipcMain.on("send-to-tts", (event, text) => {
    console.log(text);
    if (tts && tts.stdin.writable) {
      tts.stdin.write("MCP-AGENT-RESPONSE:" + text + "\n");
    }
  });

  tts.stdout.on("data", (data) => {
    const out = data.toString();

    console.log("[TTS]: " + out);

    if (out.includes("TTS_SPEECH_STARTED")) {
      setTimeout(() => {
        updateUIState("responding");
      }, 700);
    }
    if (out.includes("TTS_SPEECH_ENDED")) {
      //updateUIState("idle");

      // Resume the STT engine after a short delay to ensure audio has finished
      setTimeout(() => {
        updateUIState("idle");
        if (stt && stt.stdin.writable) {
          stt.stdin.write("resume\n");
        }
      }, 2500); // 500ms delay
    }
  });
}

// When Electron has finished initialization, create the kiosk browser window.
app.whenReady().then(() => {
  createWindow();
  console.log(path.join(__dirname, "../../../backend/src/mcp_stack/client.py"));

  startServices();
});
