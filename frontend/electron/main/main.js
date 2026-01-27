const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const { start } = require("repl");

// Create a global reference of the kiosk window to maintain a single source of truth for the current state
let win;
let pythonClient;
let ttsProcess;




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
  win.webContents.send("ui-state-changed", newState);
});

ipcMain.on("keyboard-prompt", (_, text) => {
  console.log("Keyboard input received:", text);
  // Forward text to Michel ###########




});



function startServices() {


/*
  const agent = spawn(
    `fastapi dev ${path.join(__dirname, "../../../backend/src/mcp_stack/client.py")}`,
    {
      shell: true,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        PYTHONIOENCODING: "utf-8",
        // Python 3.7+: force UTF-8 mode
        PYTHONUTF8: "1",
      },
    },
  );
  

  
  agent.stderr.on("data", (d) => console.error("[Agent STDERR]:", d.toString()));
  agent.on("exit", (code, signal) => console.log("[Agent EXIT]:", { code, signal }));
  agent.on("error", (err) => console.error("[Agent SPAWN ERROR]:", err));
  

  agent.stdout.on("data", (data) => {
    const out = data.toString();
    console.log("[Agent Output]:", out);
    if (out.includes("AGENT_RESPONSE:")) {
      const responseText = out.split("AGENT_RESPONSE")[1].trim();
      win.webContents.send("render-subtitles", responseText);
    }
  });
*/

  const stt = spawn("python", [
    "-u",
    path.join(
      __dirname,
      "../../../backend/src/services/stt/Test/test_transcribe.py",
    ),
  ]);

  stt.stdout.on("data", (data) => {
    const out = data.toString();
    console.log("[STT Output]:", out);

    if (out.includes("Listening. Press Ctrl+C to stop")) {
      updateUIState("listening");
    }
    if (out.includes("[Transcript]:")) {
      updateUIState("thinking");
    }
  });

  const tts = spawn("python", [
    path.join(__dirname, "../../../backend/src/services/tts/tts_wrapper.py"),
  ]);

  tts.stdout.on("data", (data) => {
    const out = data.toString();

    console.log("[TTS]: " + out);

    if (out.includes("TTS_SPEECH_STARTED")) {
      updateUIState("responding");
    }
    if (out.includes("TTS_SPEECH_ENDED")) {
      updateUIState("idle");
    }
  });
}

// When Electron has finished initialization, create the kiosk browser window.
app.whenReady().then(() => {
  createWindow();
  console.log(path.join(__dirname, "../../../backend/src/mcp_stack/client.py"));

  startServices();
});
