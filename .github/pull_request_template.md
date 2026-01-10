## Summary

### What changed

- Brief, clear description of what was added, removed, or modified.
- Reference specific files, modules, or subsystems when relevant.
  Added all necessary frontend files, created state managing UI using IPC between the renderer, the
  main process, and the backend node. Used context bridge to hide sensitive backend APIs, created animations
  and rendering for Idle, and Listening states.

### Why it changed

- Explain the motivation for this change.
- Link to related issues, tasks, or discussions (e.g. `Closes #12`).
  Getting the frontend/UI of the project setup and to give out an idea on how 2D PIXI animations will look.

---

## Testing

### How to test

- Step-by-step instructions to verify the change locally.
- Include commands to run and expected behavior.

1. Ensure that both `package.json` and `package-lock.json` exist in `frontend/electron`
2. Ensure that your local machine has `node.js v23.10.0+` and `npm v11.6.4` installed.
3. `node -v and npm -v` will tell you if you have the requirements installed.
4. Run `npm install`. Once finished, run `npm start`.
5. A kiosk style application will open, if the fish swarm is visible, the idle scene animation is working.
6. On the top left, a "listening" button will be visible, on pressing, the swarm should scatter and a big fish should be at the center.
7. To exit the kiosk application, press `Cmd + W`.

### Test status

- [x] Tested locally
- [ ] Tests added or updated
- [ ] Not applicable (explain why)

---

## Documentation

- [ ] README updated (root or relevant subproject)
- [x] Inline code comments added where necessary
- [ ] No documentation changes needed (explain why)

---

## Impact

### Breaking changes

- [x] No breaking changes
- [ ] Yes (describe impact and migration steps)

### Affected components

- Backend
- Frontend [X]
- Hardware
- MCP tools
- Documentation

---

## Checklist

- [x] Code builds and runs locally
- [x] Follows project structure and conventions
- [x] No unrelated files included
- [x] PR title is clear and descriptive
