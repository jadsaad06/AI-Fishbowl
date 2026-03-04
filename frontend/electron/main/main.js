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
let activateInputState = "speech";
let currentResponder = 1;
let stt;
let tts;
let currentSessionId = 0;

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
      devTools: true,
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

function transitionState(newState) {
  if (currentAppState === newState) return;

  if (newState === "idle") {
    currentSessionId++;
    console.log(`Session Reset. Current ID: ${currentSessionId}`);
  }

  console.log(`State Transition: ${currentAppState} -> ${newState}`);
  if (stt && stt.stdin.writable) {
    if (newState === "speech") {
      stt.stdin.write("SESSION_START\n");
    } else if (newState === "idle") {
      stt.stdin.write("SESSION_END\n");
    }
  }
  currentAppState = newState;

  if (win) {
    win.webContents.send("ui-state-changed", newState);
  }
}

function setResponderIfAllowed(responderId) {
  console.log("Attempting responder change:", responderId);

  if (currentAppState !== "idle") {
    console.log("Denied: Not in idle state");
    return;
  }

  if (!Number.isInteger(responderId) || responderId < 1 || responderId > 5) {
    console.log("Denied: Invalid Responder ID");
    return;
  }

  if (currentResponder === responderId) {
    return;
  }

  currentResponder = responderId;
  if (win) {
    win.webContents.send("responder-force-update", responderId);
  }

  console.log("Responder updated to:", responderId);
  return true;
}

/**
 * Electron's Inter-Process Communication Handler.
 * This allows the main process to listen for changes via the frontend (conveyed by the renderer process)
 * and also allows sending backend processes done by Node back to the renderer process.
 * If ipcRenderer sends a message on the "set-ui-state" channel, this callback runs.
 * The main process updates the UI state from the "set-ui-state" channel in the backend, and forwards the update
 * back to the renderer process via the "ui-state-changed" channel. The changes are now reflected on the frontend.
 */
// ipcMain.on("set-ui-state", (event, newState) => {
//   console.log("State change requested:", newState);
//   currentAppState = newState;
//   win.webContents.send("ui-state-changed", newState);
// });

ipcMain.on("request-state-transition", (_, requestedState) => {
  console.log("Renderer requested state:", requestedState);

  if (requestedState === "keyboard") {
    activateInputState = "keyboard";
  }

  if (requestedState === "speech") {
    activateInputState = "speech";
  }

  transitionState(requestedState);
});
ipcMain.on("keyboard-prompt", (_, text) => {
  console.log("Keyboard input received:", text);
  // Forward text to Michel ###########
});

ipcMain.on("request-responder-change", (_, responderId) => {
  setResponderIfAllowed(responderId);
});

function startServices() {
  stt = spawn("python", [
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
    console.log("STT Captured: " + out);

    if (out.includes("WAKE:")) {
      console.log(out);
      const heyResponder = out.replace("WAKE:", "").trim();
      if (currentAppState === "idle") {
        const responderMap = {
          pinto: 1,
          jimbo: 2,
          bongo: 3,
          koko: 4,
          kiki: 5,
        };

        const id = responderMap[heyResponder.toLowerCase()];

        if (id) {
          setResponderIfAllowed(id);
          activateInputState = "speech";
          transitionState("speech");
        }
      }
    }

    if (
      out.includes("[Transcript]:") &&
      (currentAppState === "listening" || currentAppState === "speech")
    ) {
      console.log(out);
      const promptText = out.replace("[Transcript]:", "").trim();
      if (currentAppState === "listening") {
        transitionState("thinking");
        if (stt && stt.stdin.writable) {
          stt.stdin.write("pause\n");
        }
        win.webContents.send("display-user-prompt", promptText);
      } else {
        console.log(`[STT IGNORED] System busy in state: ${currentAppState}`);
      }
    }

    if (out.includes("EVENT:MIC_STARTED")) {
      win.webContents.send("mic-state-changed", { active: true });
      if (currentAppState === "speech") {
        transitionState("listening");
      }
    }

    if (out.includes("EVENT:MIC_STOPPED")) {
      win.webContents.send("mic-state-changed", { active: false });
    }
  });

  tts = spawn("python", [
    path.join(__dirname, "../../../backend/src/services/tts/tts_wrapper.py"),
  ]);

  ipcMain.on("send-to-tts", (event, text) => {
    console.log(text);
    if (tts && tts.stdin.writable) {
      tts.stdin.write("MCP-AGENT-RESPONSE:" + text + "\n"); //Modified to send personality to TTS -Henry
    }
  });

  tts.stdout.on("data", (data) => {
    const out = data.toString();

    console.log("[TTS]: " + out);

    const sessionIdAtTrigger = currentSessionId;

    if (out.includes("TTS_SPEECH_STARTED") && currentAppState === "thinking") {
      if (
        currentSessionId === sessionIdAtTrigger &&
        currentAppState !== "idle"
      ) {
        transitionState("responding");
      }
    }
    if (out.includes("TTS_SPEECH_ENDED")) {
      // Resume the STT engine after a short delay to ensure audio has finished
      setTimeout(() => {
        if (
          currentSessionId !== sessionIdAtTrigger ||
          currentAppState === "idle"
        ) {
          console.log(
            "Cleanup: Suppressing state restoration because session is stale.",
          );
          return;
        }

        if (activateInputState === "keyboard") {
          transitionState("keyboard");
        } else {
          transitionState("speech");
        }

        if (stt && stt.stdin.writable) {
          stt.stdin.write("resume\n");
        }
      }, 2500); // 2500ms delay
    }
  });
}

// When Electron has finished initialization, create the kiosk browser window.
app.whenReady().then(() => {
  createWindow();
  console.log(path.join(__dirname, "../../../backend/src/mcp_stack/client.py"));

  startServices();
});
