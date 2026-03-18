/**
 * This file is a global state store that contains all requested UI states for the Electron renderer process.
 * It is a reactive state store that keeps track of the current UI state and notifies subscribers of any changes.
 *
 * It allows functions to update their internal values when:
 *    1. The keyboard detects a keypress.
 *    2. The Mic detects voice input.
 *    3. The responder is changed using R, [1-5], or pullout menu.
 *    4. The responder is changed using Hey Pinto or Hey Mimi etc.
 *
 * It allows functions to access:
 *    1. The authoritative current state.
 *    2. The authoritative current responder chosen.
 *    3. The authoritative prompt after assessing all prompt input methods.
 *    4. The authoritative subtitles to be displayed as a response.
 */
let currentState = "idle";
let currentSubtitles = "";
let currentResponder = 1;
let currentPrompt = "";
let currentMicActive = false;
// Set of callback functions that want to be notified when the state changes
// These Sets will contain the listeners that are called throughout the pipeline.
const listeners = new Set();
const subtitleListeners = new Set();
const promptListeners = new Set();
const responderListeners = new Set();
const micListeners = new Set();

/**
 * If mic input is detected, this function is called by the detection routine which then
 * relays the information to all functionalities that are subscribed to the mic listener.
 *
 * This keeps a global state of the mic status and displays the mic status parallelly to all
 * processes preventing a mismatch of mic status across states.
 * @param {*} active
 * @returns
 */
export function setMicActive(active) {
  if (currentMicActive === active) return;
  currentMicActive = active;
  micListeners.forEach((cb) => cb(currentMicActive));
}

/**
 * Simple gateway for one-shot calls to know whether mic is currently collecting input or not.
 * Does not update in real time unless called in a loop.
 * @returns Microphone active or not
 */
export function getMicActive() {
  return currentMicActive;
}

/**
 * Allows a function to subscribe to the mic event listener to receive real-time mic status
 * updates. This mounts the calling function onto the mic listener, and on return,
 * forces the calling function to unmount and remove itself from the listeners to prevent memory leaks.
 * @param {*} cb
 * @returns an unmount routine for the calling function
 */
export function subscribeMic(cb) {
  micListeners.add(cb);
  return () => micListeners.delete(cb);
}

/**
 * If responder is to be changed, this function is called by the keyboard/speech detection which then
 * relays the information to all functionalities that are subscribed to the current responder state.
 *
 * This keeps a global state of the current responder value and displays the responder information parallelly to all
 * processes preventing a mismatch of the current responder across states.
 * @param {*} active
 * @returns
 */
export function setResponder(num) {
  if (currentResponder === num) return;
  currentResponder = num;
  responderListeners.forEach((cb) => cb(currentResponder));
}

/**
 * Simple gateway for one-shot calls to know who the current responder is.
 * Does not update in real time unless called in a loop.
 * @returns current responder
 */
export function getResponder() {
  return currentResponder;
}

/**
 * Allows a function to subscribe to the current responder store.
 * This mounts the calling function onto the responder store, and on return,
 * forces the calling function to unmount and remove itself from the listeners to prevent memory leaks.
 * @param {*} cb
 * @returns an unmount routine for the calling function
 */
export function subscribeResponder(cb) {
  responderListeners.add(cb);
  return () => responderListeners.delete(cb);
}

/**
 * If the user prompt is to be changed, this function is called by the STT receiver which then
 * relays the information to all functionalities that are subscribed to receive the user prompt.
 *
 * This keeps a global state of the user prompt value and displays the user prompt parallelly to all
 * processes preventing a mismatch of the user prompt across states.
 * @param {*} active
 * @returns
 */
export function setPrompt(text) {
  currentPrompt = text.slice(0, 200);
  promptListeners.forEach((cb) => cb(currentPrompt));
}

/**
 * Allows a function to subscribe to the authoritative user prompt.
 * Since there are multiple ways to configure a user prompt (keyboard, speech), this subscriber
 * prevents race conditions and stores only one prompt.
 * This mounts the calling function onto the prompt store, and on return,
 * forces the calling function to unmount and remove itself from the listeners to prevent memory leaks.
 * @param {*} cb
 * @returns an unmount routine for the calling function
 */
export function subscribePrompt(cb) {
  promptListeners.add(cb);
  return () => promptListeners.delete(cb);
}

/**
 * Simple gateway for one-shot calls to know what the given user prompt is.
 * Does not update in real time unless called in a loop.
 * @returns user prompt
 */
export function getPrompt() {
  return currentPrompt;
}

/**
 * Resets prompt.
 * Used when ESC key is used on keyboard or speech states when incomplete input is provided.
 */
export function clearPrompt() {
  setPrompt("");
}

/**
 * Simple gateway for one-shot calls to know what the current state is.
 * Does not update in real time unless called in a loop.
 * @returns current state
 */
export function getState() {
  return currentState;
}

/**
 * If the current state is to be changed, this function is called by the renderer or the main process which then
 * relays the information to all functionalities that are subscribed to receive the current state.
 *
 * This keeps a global state of the current state value and displays the current state parallelly to all
 * processes preventing a mismatch of the current state across application routines and processes.
 * @param {*} active
 * @returns
 */
export function setState(newState) {
  if (newState == currentState) return;

  currentState = newState;
  listeners.forEach((cb) => cb(currentState));
}

/**
 * Allows a function to subscribe to the authoritative current state.
 * Since there are multiple ways to change states (keyboard, speech, main process), this subscriber
 * prevents race conditions and stores only one state.
 * This mounts the calling function onto the state store, and on return,
 * forces the calling function to unmount and remove itself from the listeners to prevent memory leaks.
 * @param {*} cb
 * @returns an unmount routine for the calling function
 */
export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * If the subtitles are to be changed or updated, this function is called by the renderer or the main process which then
 * relays the information to all functionalities that are subscribed to receive the current state.
 *
 * This keeps a global state of the current subtitles to display and displays the subtitles parallelly to all
 * processes preventing a mismatch of the subtitles across application routines and processes.
 * @param {*} active
 * @returns
 */
export function setSubtitles(text) {
  currentSubtitles = text;
  subtitleListeners.forEach((cb) => cb(currentSubtitles));
}

/**
 * Allows a function to subscribe to the subtitles.
 * This mounts the calling function onto the subtitles store, and on return,
 * forces the calling function to unmount and remove itself from the listeners to prevent memory leaks.
 * @param {*} cb
 * @returns an unmount routine for the calling function
 */
export function subscribeSubtitles(cb) {
  subtitleListeners.add(cb);
  return () => subtitleListeners.delete(cb);
}

/**
 * Simple gateway for one-shot calls to know what the subtitles are.
 * Does not update in real time unless called in a loop.
 * @returns subtitles
 */
export function getSubtitles() {
  return currentSubtitles;
}
