// ============================================================================
//  Settings - uses SillyTavern's native `extension_settings` object so values
//  are synchronised to the server via `saveSettingsDebounced()`.
//
//  In addition to user preferences we store `savedPositions`: a map of
//  characterKey -> { x, y, scale, rotation } used to restore a character's
//  avatar transform every time SillyTavern remounts the .zoomed_avatar node.
// ============================================================================

import { EXT_NAME } from './constants.js';

// Grab the context lazily so we work regardless of when this module is imported.
function ctx() {
    // Prefer the modern `SillyTavern.getContext()` API. Fall back to the
    // classic globals for older SillyTavern builds.
    if (globalThis.SillyTavern?.getContext) return globalThis.SillyTavern.getContext();
    return {
        extensionSettings: globalThis.extension_settings,
        saveSettingsDebounced: globalThis.saveSettingsDebounced,
    };
}

export const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    enableRotation: true,
    zIndexMode: 'aboveUI',            // 'background' | 'aboveChat' | 'aboveUI'
    ghostDragEffect: true,             // Fade avatar during interaction
    showToasts: true,                  // Toast on reset

    // Zoom
    zoomSpeed: 0.1,                    // Desktop wheel step
    mobileZoomStep: 0.1,               // On-screen zoom button step

    // Rotate
    rotationThreshold: 0.7,            // 0 = rotate from center, 1 = only at edge
    enableMultiTouchRotate: true,
    multiTouchRotateSpeed: 1.0,

    // Mobile
    doubleTapTimeout: 300,             // ms window for a second tap
    longPressDuration: 600,            // ms hold for reset
    mobileMoveStep: 20,                // px per tick on on-screen arrows
    mobileRotateStep: 10,              // deg per tick on on-screen rotate buttons
    mobileYBias: 200,                  // px added to the mobile reset centre (positive = lower)

    // Saved transforms per character/avatar (auto-managed, do not edit manually)
    savedPositions: {},
});

// Ensure our slice of `extension_settings` exists and every default key is present
// (so users updating from older versions never see `undefined`).
export function initSettings() {
    const context = ctx();
    if (!context.extensionSettings[EXT_NAME]) {
        context.extensionSettings[EXT_NAME] = structuredClone(DEFAULT_SETTINGS);
    }
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
        if (!Object.hasOwn(context.extensionSettings[EXT_NAME], key)) {
            context.extensionSettings[EXT_NAME][key] = structuredClone(DEFAULT_SETTINGS[key]);
        }
    }
    return context.extensionSettings[EXT_NAME];
}

export function getSettings() {
    return ctx().extensionSettings[EXT_NAME] || initSettings();
}

// Debounced by SillyTavern - safe to spam.
export function saveSettings() {
    ctx().saveSettingsDebounced?.();
}

// -------------------- per-character position persistence --------------------

// Derive a stable key for an avatar. Prefers SillyTavern's `forChar` attribute
// (populated on the zoomed avatar element) and falls back to the image path.
export function getAvatarKey(el) {
    if (!el) return null;
    const forChar = el.getAttribute('forChar') || el.getAttribute('data-char');
    if (forChar) return `char:${forChar}`;
    const img = el.querySelector('img');
    if (img?.src) {
        try {
            return `img:${new URL(img.src, window.location.href).pathname}`;
        } catch {
            return `img:${img.src}`;
        }
    }
    return null;
}

export function loadPosition(el) {
    const key = getAvatarKey(el);
    if (!key) return null;
    return getSettings().savedPositions?.[key] ?? null;
}

export function savePosition(el, transform) {
    const key = getAvatarKey(el);
    if (!key) return;
    const settings = getSettings();
    settings.savedPositions[key] = { ...transform, savedAt: Date.now() };
    saveSettings();
}

export function clearPosition(el) {
    const key = getAvatarKey(el);
    if (!key) return;
    const settings = getSettings();
    if (settings.savedPositions[key]) {
        delete settings.savedPositions[key];
        saveSettings();
    }
}
