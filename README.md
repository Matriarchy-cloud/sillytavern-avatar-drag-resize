# Avatar Manipulator (SillyTavern Extension)

A third-party SillyTavern extension that allows free positioning, rotation, zooming, and resetting of character and user avatars. Works on both desktop and mobile through a single Pointer Events code path.

## Features

- **Dragging**: Free dragging with one finger/mouse.
- **Rotation**: 360° rotation by grabbing from the outer edge on desktop. Two-finger rotation on mobile (optional).
- **Zoom**: Mouse wheel on desktop, two-finger pinch or on-screen buttons on mobile.
- **Reset**: Double-click (desktop), double-tap or long-press (mobile), on-screen Reset button.
- **Mobile Controls panel**: Zoom, rotate, move, and reset buttons. Buttons repeat when held down.
- **Three layers**: Background / Above Chat / Above UI.
- **Persistence**: Each character's (or avatar image's) last transform values are stored in SillyTavern's own `extension_settings` field — synced to the server and preserved across different devices.
- **Waifu Mode compatible**: Works correctly with WaifuMode both enabled and disabled.
- **Debug / diagnostics**: Instantly restart the extension via `window.AvatarManip.regenerate()`.

## Installation

Place the extension in the folder:
`...\SillyTavern\data\default-user\extensions\avatar-manip\`
Restart SillyTavern or use **Reload Extensions** from the Extensions panel.

Alternative: Go to SillyTavern → Extensions → **Install Extension**, paste this repository's URL, and install.

## Settings

| Field | Description |
|---|---|
| Enable Extension | Main on/off switch |
| Enable Rotation | Toggle edge-grab rotation on/off |
| Layer Position (Z-Index) | Background / Above Chat / Above UI |
| Opacity Feedback | Visual feedback during interaction |
| Show Toast Notifications | Notifications for actions like reset |
| Zoom Speed | Desktop wheel zoom step |
| Rotation Threshold | Percentage of radius from center after which rotation starts (0.7 = outer 30%) |
| Two-Finger Rotate *(mobile)* | Toggle two-finger rotation during pinch on/off |
| Two-Finger Rotate Speed | Pinch rotation sensitivity |
| Zoom Step (buttons) | Zoom In/Out step for Mobile Controls |
| Move Step (buttons) | Arrow key step (px) for Mobile Controls |
| Rotate Step (buttons) | Rotation step (°) for Mobile Controls |
| Double-Tap Timeout | Double-tap detection time (ms) |
| Long-Press Duration | Long-press to reset duration (ms) |

## Debug

In the console:
`AvatarManip.regenerate();`   // shut down and restart the extension
`AvatarManip.cleanup();`      // fully shut down
`AvatarManip.init();`         // start again

## Release Notes

### v2.0.0
- **Rewritten from scratch.** Modular architecture: `shared/`, `gestures/`, `ui/`, single `input.js` event management, `observer.js`, `lifecycle.js`.
- Uses native `SillyTavern.getContext()` + `extension_settings` + `saveSettingsDebounced` (not localStorage).
- Character/image-based persistent storage integrated into SillyTavern's own synchronization.
- Wheel zoom calls `preventDefault` only when over the avatar; page scrolling remains free.
- Mobile Controls buttons listen for both `touchstart` and `pointerdown`; no interval leaks; panel retries until `#extensions_settings` is in the DOM.
- `touchState.isPinching = true` is now set inside `startPinch`.
- iOS Safari `@supports` block is now inside the mobile media query; reset reliably centers the avatar.
- Orphan `}` and centering conflicts from the previous version cleaned up in CSS.
- Lifecycle: `AvatarManip.init/cleanup/regenerate` globally exposed.

## License

NULL