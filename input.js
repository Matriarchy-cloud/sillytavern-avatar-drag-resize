// ============================================================================
//  Observer - watches the DOM for new .zoomed_avatar nodes and restores
//  any saved transform for them (and stamps the configured z-index).
// ============================================================================

import { CSS_CLASSES, CSS_VARS } from './shared/constants.js';
import { getSettings } from './shared/settings.js';
import { getZIndexValue } from './shared/utils.js';
import { restoreAvatar } from './shared/avatar.js';

let observer = null;

function applyZIndex(el) {
    const z = getZIndexValue(getSettings().zIndexMode);
    el.style.setProperty(CSS_VARS.Z_INDEX, String(z), 'important');
}

function onMount(el) {
    applyZIndex(el);
    // Apply our transform IMMEDIATELY so the first paint is already correct.
    restoreAvatar(el);

    // SillyTavern may write its own inline top/left/transform on the element
    // in the next animation frame (opening animation).  Re-apply ours after a
    // couple of frames to make sure we win.
    requestAnimationFrame(() => {
        if (document.contains(el)) restoreAvatar(el);
        requestAnimationFrame(() => {
            if (document.contains(el)) restoreAvatar(el);
        });
    });

    // If the image is still loading, apply once more on load (its natural size
    // can influence layout via SillyTavern's own JS).
    const img = el.querySelector('img');
    if (img && !img.complete) {
        img.addEventListener('load', () => {
            if (document.contains(el)) restoreAvatar(el);
        }, { once: true });
    }
}

export function applyZIndexEverywhere() {
    const z = getZIndexValue(getSettings().zIndexMode);
    document.documentElement.style.setProperty(CSS_VARS.Z_INDEX, String(z));
    document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`).forEach(applyZIndex);
}

export function startObserver() {
    if (observer) return;
    // Handle any avatars that already exist.
    document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`).forEach(onMount);

    observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                if (node.classList?.contains(CSS_CLASSES.AVATAR)) onMount(node);
                node.querySelectorAll?.(`.${CSS_CLASSES.AVATAR}`).forEach(onMount);
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

export function stopObserver() {
    observer?.disconnect();
    observer = null;
}
