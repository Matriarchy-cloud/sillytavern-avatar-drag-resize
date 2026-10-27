// ============================================================================
//  Multiple avatars - make SillyTavern keep already-open avatar nodes when
//  another chat avatar is selected, without permanently enabling its global
//  Moving UI setting.
// ============================================================================

import { getSettings } from './shared/settings.js';

let registered = false;
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

    // SillyTavern checks `movingUI` in its delegated click handler before
    // removing earlier avatars. Keep the override through the next task so
    // all native click processing observes it before it is restored.
    if (restoreTimer) clearTimeout(restoreTimer);
    if (temporarilyChangedSettings !== powerUserSettings) {
        originalMovingUI = powerUserSettings.movingUI;
        temporarilyChangedSettings = powerUserSettings;
    }
    powerUserSettings.movingUI = true;

    restoreTimer = setTimeout(() => {
        if (temporarilyChangedSettings?.movingUI === true) {
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
