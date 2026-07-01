// ============================================================================
//  Avatar Manipulator - Entry point
//  Waits for SillyTavern's app to be ready, then bootstraps the extension.
// ============================================================================

import { init, cleanup, regenerate } from './src/lifecycle.js';

jQuery(async () => {
    await init();
});

// Expose lifecycle hooks so users / other extensions can debug or restart us.
window.AvatarManip = { init, cleanup, regenerate };
