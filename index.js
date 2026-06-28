import { initSettings, getSettings } from './shared/settings.js';
import { createUI, updateZIndexOnly } from './core/ui.js';
import { createMobileControls } from './mobile/ui.js';
import { registerAll, unregisterAll } from './events/registry.js';
import { resetAllState } from './shared/state.js';
import { clearLongPress } from './mobile/gestures.js';

function init() {
    try {
        initSettings();
        const settings = getSettings();
        
        createUI();
        createMobileControls();
        registerAll();
        updateZIndexOnly(settings.zIndexMode || 'aboveUI');
        
        console.log('AvatarManip: Ready');
    } catch (err) {
        console.error('AvatarManip init error:', err);
    }
}

function cleanup() {
    unregisterAll();
    clearLongPress();
    resetAllState();
    
    document.getElementById('avatarmanip-container')?.remove();
    document.getElementById('avatarmanip-mobile-controls')?.remove();
}

function regenerate() {
    cleanup();
    init();
}

jQuery(async () => {
    await init();
});

export { cleanup, regenerate };

window.AvatarManip = window.AvatarManip || {};
window.AvatarManip.cleanup = cleanup;
window.AvatarManip.regenerate = regenerate;