/**
 * This file is a global state store that contains all requested UI states for the Electron renderer process.
 * It is a reactive state store that keeps track of the current UI state and notifies subscribers of any changes.
 */
let currentState = "idle";

// Set of callback functions that want to be notified when the state changes
const listeners = new Set();

// Exports the current state in case we want to access the state without subscribing
export function getState() {
  return currentState;
}

/**
 * This is where the actual state is updated on the frontend.
 * If the new state received is the same as current state, it prevents re-rendering by returning early.
 * If there is an actual change to be triggered, it goes through the set of callback functions to notify them of the new state.
 * @param {} newState received from the main process
 * @returns
 */
export function setState(newState) {
  if (newState == currentState) return;

  currentState = newState;
  listeners.forEach((cb) => cb(currentState));
}

/**
 * Adds all callback functions that want to be notified on state changes to the listeners set.
 * @param {} cb the callback function to be added to the listeners set
 * @returns
 */
export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
