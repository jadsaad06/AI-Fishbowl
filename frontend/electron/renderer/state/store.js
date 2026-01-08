let currentState = "idle";
const listeners = new Set();

export function getState() {
  return currentState;
}

export function setState(newState) {
  if (newState == currentState) return;

  currentState = newState;
  listeners.forEach((cb) => cb(currentState));
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
