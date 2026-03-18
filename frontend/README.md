# AI Fishbowl -- Frontend

## Overview

- The frontend for this project is an Electron.js application functioning as a Kiosk window. It leverages PIXI.js and animeJS to render all sprites, textures, frames, and animations. The frontend is a finite state machine that has deterministic
  outputs on all states and has authoritative transitions that are featured in the Electron Main Process. The Inter Process Communication handler built into Electron allows us to also spawn all backend services and connections required for the application which are:

      - Speech-To-Text script: Voice Activity Detection, User Input Transcription, and Responder Personality Selection
      - Text-To-Speech script: Prints flags to indicate when the TTS model output is active and when it has elapsed for frontend state management.

- The State Machine Pipeline is as follows:
  1. Idle -> Speech -> Listening -> Thinking -> Responding -> Speech.
  2. Idle -> Keyboard -> Thinking -> Responding -> Keyboard.

## Tech Stack

1. ElectronJS
   - Open source, cross-platform, desktop JavaScript implementation that uses Chromium and Node.js to natively run applications with graphical user interfaces.
   - Can be used as a blank slate for integrating any libraries or frameworks like React or Next.js,
     for this implementation, we used Vanilla JS for lighter rendering.
2. Vanilla JavaScript (ES Modules)
   - All animations, sprites files, and process communication files are written in JavaScript for the frontend.
3. Node.js / Node Package Manager
   - Electron enables Inter Process Communication between the backend and the frontend using a context bridge.
   - This context bridge allows the application to leverage functionalities and APIs provided by npm without exposing them to the renderer or the frontend of the program.
   - The application itself is also exposed as an API that is launched using npm at the backend and then relayed to the renderer process using the bridge.
   - The setup for this context bridge can be found in `AI-Fishbowl/frontend/electron/preload.js`
4. PixiJS
   - Fast, feature rich 2D WebGL renderer that is used for creating and animating sprites and textures that are used throughout the program.
   - Provides blending features, sprite sheet support, asset loader, and an advanced text rendering functionality that makes the user experience smooth and seamless.
5. AnimeJS
   - All-in-one animation engine that is primary used in this application for smoother animations for text boxes, sprite movement, texture spawning, gradient generation, and so on.
   - The easing options, staggering options, and on-complete options provided by anime made it a framework that enabled pullout menus, bounding glass boxes, and typewriter/pulsing text effects possible in the application.

## Prerequisites

- Node.js (v18+ recommended): https://nodejs.org/en/download
- npm

## Installation

- Electron is required to run the application, if not already installed, install it as a dependency with `npm install electron` inside the AI-Fishbowl/frontend directory.
- Optionally, To add electron to your `package.json`, run `npm install --save-dev electron`.
- Run the frontend using `npm start`
- To exit the kiosk application, press `Ctrl + W` or `Cmd + W`.

## Testing

- Verify that:

1. The application launches without errors.
2. The idle scene renders correctly.
3. State changes trigger the appropriate state transitions.
4. Animations and IPC-driven updates function as expected.

## Troubleshooting

1. If the application is stuck at any event within its lifecycle, exit the program using `Ctrl/Cmd + W`, and restart the application using `npm start`.
2. If the application is used in combination with all Coral Net services, exit the application and launch the application again using the home screen icon or with the bash script provided in the AI-Fishbowl directory.
3. If the animations are overlapping or are mashed together, change the resolution of your display to 1920x1080.
4. If the application is not responding, and is perpetually thinking, press `Ctrl/Cmd + Shift + I` to open the dev tools, and check the console for the text `WS connected`. If the web socket is not connected, the server is down, retry after 10 minutes.
5. If the responder does not spawn correctly, ensure that the microphone is placed in an area that can pick up vocals clearly, and is not in an environment with significant interference.

## Citations

- Images and sprites downloaded from:
  - Freepik: https://www.freepik.com/log-in?client_id=freepik&lang=en&cb_url=https%3A%2F%2Fwww.freepik.com%2Fhome-auth
  - PNGTree: https://pngtree.com/
  - Adobe Stock: https://stock.adobe.com/
