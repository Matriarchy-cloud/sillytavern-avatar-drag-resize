// ============================================================================
//  Multiple avatars - make SillyTavern keep already-open avatar nodes when
//  another chat avatar is selected, without permanently enabling its global
//  Moving UI setting.
// ============================================================================

import { getSettings } from './shared/settings.js';

let registered = false;
let generation = 0;
let restoreTimer = null;
let originalMovingUI = null;
let temporarilyChangedSettings = null;

function getPowerUserSettings() {
    const context = globalThis.SillyTavern?.getContext?.();
    return context?.powerUserSettings ?? globalThis.power_user ?? null;
}

function onChatAvatarClick(e) {
    if (!getSettings().enabled || !getSettings().allowMultipleAvatars) return;
    if (!(e.target instanceof Element)) return;
    if (!e.target.closest('.mes .avatar')) return;

    const powerUserSettings = getPowerUserSettings();
    if (!powerUserSettings || powerUserSettings.movingUI) return;

    // SillyTavern checks `movingUI` inside its delegated click handler before
    // removing previously opened avatars. Capture phase lets us set it just
    // for this click; the regular Moving UI setting itself is restored after
    // that handler finishes.
    if (restoreTimer) clearTimeout(restoreTimer);
    if (temporarilyChangedSettings !== powerUserSettings) {
        originalMovingUI = powerUserSettings.movingUI;
        temporarilyChangedSettings = powerUserSettings;
    }
    powerUserSettings.movingUI = true;

    const currentGeneration = generation;
    restoreTimer = setTimeout(() => {
        if (currentGeneration === generation && temporarilyChangedSettings?.movingUI === true) {
            temporarilyChangedSettings.movingUI = originalMovingUI;
        }
        restoreTimer = null;
        originalMovingUI = null;
        temporarilyChangedSettings = null;
    }, 0);
}

export function registerMultipleAvatarSupport() {
    if (registered) return;
    registered = true;
    // Capture phase runs before SillyTavern's delegated document click handler.
    document.addEventListener('click', onChatAvatarClick, true);
}

export function unregisterMultipleAvatarSupport() {
    generation += 1;
    if (restoreTimer) clearTimeout(restoreTimer);
    if (temporarilyChangedSettings?.movingUI === true) {
        temporarilyChangedSettings.movingUI = originalMovingUI;
    }
    restoreTimer = null;
    originalMovingUI = null;
    temporarilyChangedSettings = null;
    document.removeEventListener('click', onChatAvatarClick, true);
    registered = false;
}
