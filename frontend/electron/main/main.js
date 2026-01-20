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
    // width,
    // height,
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

function startServices() {
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

  /*
  agent.stderr.on("data", (d) => console.error("[Agent STDERR]:", d.toString()));
  agent.on("exit", (code, signal) => console.log("[Agent EXIT]:", { code, signal }));
  agent.on("error", (err) => console.error("[Agent SPAWN ERROR]:", err));
  */

  agent.stdout.on("data", (data) => {
    const out = data.toString();
    console.log("[Agent Output]:", out);
    if (out.includes("AGENT_RESPONSE:")) {
      const responseText = out.split("AGENT_RESPONSE")[1].trim();
      win.webContents.send("render-subtitles", responseText);
    }
  });

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
  });
}

// function startServices() {
//   // const list_devices = spawn("python3", [path.join(__dirname, "../../backend/src/services/stt/list_devices.py")]);

//   const mic = spawn("python3", [
//     path.join(__dirname, "../../hardware/src/mic-input.py"),
//   ]);
//   mic.stdout.on("data", (data) => {
//     const out = data.toString().trim();
//     if (out.includes("EVENT:MIC_STARTED")) {
//       updateUIState("listening");
//       const test_transcribe = spawn("python3", [
//         path.join(
//           __dirname,
//           "../../backend/src/services/stt/Test/test_transcribe.py",
//         ),
//       ]);
//     }
//     if (out.includes("EVENT:MIC_STOPPED")) updateUIState("thinking");
//   });

//   const agent = spawn("fastapi dev", [
//     path.join(__dirname, "../../backend/src/mcp_stack/client.py"),
//   ]);
//   agent.stdout.on("data", (data) => {
//     const out = data.toString();

//     if (out.includes("AGENT_RESPONSE:")) {
//       const responseText = out.split("AGENT_RESPONSE:")[1].trim();

//       win.webContents.send("render-subtitles", responseText);
//     }
//   });

//   const tts = spawn("python3", [
//     path.join(__dirname, "../../backend/services/tts/tts_wrapper.py"),
//   ]);
//   tts.stdout.on("data", (data) => {
//     const out = data.toString();

//     if (out.includes("TTS_SPEECH_STARTED")) {
//       updateUIState("responding");
//     }
//   });
// }

// function startMicListener() {
//   const pythonProcess = spawn("python3", [
//     path.join(__dirname, "../../hardware/src/mic-input.py"),
//   ]);

//   pythonProcess.stdout.on("data", (data) => {
//     const output = data.toString().trim();

//     if (output.includes("EVENT:MIC_STARTED")) {
//       updateUIState("listening");
//     }
//     if (output.includes("EVENT:MIC_STOPPED")) {
//       updateUIState("thinking");
//     }
//   });

//   pythonProcess.stderr.on("data", (data) => {
//     console.error(`Mic Script Error: ${data}`);
//   });
// }

// function startBackendServices() {
//   pythonClient = spawn("python3", [path.join(__dirname, "../../backend/src/mcp_stack/client.py")]);

//   pythonClient.stdout.on("data", (data) => {
//     const output = data.toString();
//     console.log(`[Client]: ${output}`);

//     if (output.includes("AGENT_RESPONSE:")) {
//       const responseText = output.split("AGENT_RESPONSE:")[1].trim();
//       handleAgentResponse(responseText);
//     }
//   });

//   ttsProcess = spawn("python3", [path.join(__dirname, "../../backend/services/tts/tts_wrapper.py")]);

//   ttsProcess.stdout.on("data", (data) => {
//     const output = data.toString();
//     if (output.includes("TTS_SPEECH_STARTED")) {
//       updateUIState("responding");
//     }
//   })
// }

// When Electron has finished initialization, create the kiosk browser window.
app.whenReady().then(() => {
  createWindow();
  console.log(path.join(__dirname, "../../../backend/src/mcp_stack/client.py"));

  startServices();
});
