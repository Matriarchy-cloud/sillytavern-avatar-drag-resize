// ============================================================================
//  Multiple avatars - make SillyTavern keep already-open avatar nodes when
//  another chat avatar is selected, without permanently enabling its global
//  Moving UI setting.
// ============================================================================

import { getSettings } from './shared/settings.js';

let registered = false;
let movingUIOverride = null;

function getPowerUserSettings() {
    const context = globalThis.SillyTavern?.getContext?.();
    return context?.powerUserSettings ?? globalThis.power_user ?? null;
}

function enableMovingUIForCurrentClick(settings) {
    const descriptor = Object.getOwnPropertyDescriptor(settings, 'movingUI');
    if (!descriptor?.configurable || !('value' in descriptor)) {
        const originalValue = settings.movingUI;
        settings.movingUI = true;
        return () => {
            if (settings.movingUI === true) settings.movingUI = originalValue;
        };
    }

    let currentValue = descriptor.value;
    Object.defineProperty(settings, 'movingUI', {
        configurable: true,
        enumerable: descriptor.enumerable,
        get: () => true,
        set: (value) => {
            if (descriptor.writable) currentValue = value;
        },
    });

    return () => {
        Object.defineProperty(settings, 'movingUI', { ...descriptor, value: currentValue });
    };
}

function onChatAvatarClick(e) {
    if (!getSettings().enabled || !getSettings().allowMultipleAvatars) return;
    if (!(e.target instanceof Element)) return;
    if (!e.target.closest('.mes .avatar')) return;

    const powerUserSettings = getPowerUserSettings();
    if (!powerUserSettings || powerUserSettings.movingUI) return;

    // SillyTavern checks `movingUI` in its delegated click handler before
    // removing earlier avatars. Limit this override to the current event task,
    // restoring the user's actual setting before another input event can run.
    const override = { restore: enableMovingUIForCurrentClick(powerUserSettings) };
    movingUIOverride = override;

    queueMicrotask(() => {
        if (movingUIOverride !== override) return;
        override.restore();
        movingUIOverride = null;
    });
}

export function registerMultipleAvatarSupport() {
    if (registered) return;
    registered = true;
    // Capture phase runs before SillyTavern's delegated document click handler.
    document.addEventListener('click', onChatAvatarClick, true);
}

export function unregisterMultipleAvatarSupport() {
    if (movingUIOverride) {
        movingUIOverride.restore();
        movingUIOverride = null;
    }
    document.removeEventListener('click', onChatAvatarClick, true);
    registered = false;
}
