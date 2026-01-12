# AI Fishbowl -- Frontend

## Overview

The frontend is an Electron-based kiosk application that uses Node.js backend services and Pixi.js to render and process animations. It communicates with the Electron main process via Inter-Process Communication to react to application state changes such as idle, listening, thinking, responding, error, etc.

The frontend is designed to be modular, state-driven, response-independent, and visually reactive. All animations are two-dimensional and are created and rendered in `sprites.js`

## Tech Stack

- Electron
- PixiJS
- JavaScript (ES Modules)
- Node.js / npm

## Prerequisites

- Node.js (v18+ recommended)
- npm

## Installation

- Electron is required to run the application, if not already installed, install it as a dependency with `npm install electron` inside the AI-Fishbowl/frontend directory.
- Optionally, To add electron to your `package.json`, run `npm install --save-dev electron`.
- Run the frontend using `npm start`
- Switch through the states using the temporary 'listening' button on the top left of the idle state screen.
- To exit the kiosk application, press `Ctrl + W` or `Cmd + W`.

## Testing

- Verify that:

1. The application launches without errors.
2. The idle scene renders correctly.
3. State changes trigger the appropriate state transitions.
4. Animations and IPC-driven updates function as expected.
