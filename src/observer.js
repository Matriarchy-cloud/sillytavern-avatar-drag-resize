// ============================================================================
//  Observer - watches the DOM for new .zoomed_avatar nodes and restores
//  any saved transform for them (and stamps the configured z-index).
// ============================================================================

import { CSS_CLASSES, CSS_VARS } from './shared/constants.js';
import { getSettings } from './shared/settings.js';
import { getZIndexValue } from './shared/utils.js';
import { restoreAvatar } from './shared/avatar.js';
import { applyCustomImage } from './shared/image.js';

let observer = null;

function applyZIndex(el) {
    const z = getZIndexValue(getSettings().zIndexMode);
    el.style.setProperty(CSS_VARS.Z_INDEX, String(z), 'important');
}

function onMount(el) {
    applyZIndex(el);
    restoreAvatar(el);
    applyCustomImage(el);

    requestAnimationFrame(() => {
        if (document.contains(el)) restoreAvatar(el);
        requestAnimationFrame(() => {
            if (document.contains(el)) restoreAvatar(el);
        });
    });

    const img = el.querySelector('img');
    if (img && !img.complete) {
        img.addEventListener('load', () => {
            if (document.contains(el)) {
                restoreAvatar(el);
                applyCustomImage(el);
            }
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
