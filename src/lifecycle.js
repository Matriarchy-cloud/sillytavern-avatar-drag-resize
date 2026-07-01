// ============================================================================
//  Lifecycle - init / cleanup / regenerate exposed via window.AvatarManip.
// ============================================================================

import { initSettings } from './shared/settings.js';
import { resetInteractionState } from './shared/state.js';
import { isMobileDevice } from './shared/utils.js';
import { registerInputHandlers, unregisterInputHandlers } from './input.js';
import { startObserver, stopObserver, applyZIndexEverywhere } from './observer.js';
import { createSettingsUI, removeSettingsUI } from './ui/settings.js';
import { createMobileControls, removeMobileControls } from './ui/mobile.js';

let started = false;

export async function init() {
    if (started) return;
    started = true;
    try {
        initSettings();
        startObserver();
        applyZIndexEverywhere();
        registerInputHandlers();
        createSettingsUI();
        if (isMobileDevice()) createMobileControls();
        console.log('[AvatarManip] ready');
    } catch (err) {
        started = false;
        console.error('[AvatarManip] init failed', err);
    }
}

export function cleanup() {
    unregisterInputHandlers();
    stopObserver();
    removeSettingsUI();
    removeMobileControls();
    resetInteractionState();
    started = false;
}

export async function regenerate() {
    cleanup();
    await init();
}
