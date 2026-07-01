// ============================================================================
//  Avatar - read/write/reset the transform of a single .zoomed_avatar element.
//
//  Desktop:  we ONLY set CSS custom properties on the element.  All positioning
//            and centering lives in style.css - the SillyTavern desktop layout
//            is untouched, letting SillyTavern's own inline transforms compose
//            with our CSS variables through the cascade rules that were tested
//            and working in v2.0.4.
//
//  Mobile:   SillyTavern 1.18 writes an inline `style="transform: ..."` on the
//            zoomed_avatar element as it opens.  On small viewports that ends
//            up positioning the avatar off-screen.  For MOBILE ONLY we bake
//            our own transform / top / left inline with `!important` priority
//            so we always win the cascade and the avatar is guaranteed to
//            appear centered.
// ============================================================================

import { dragState, rotationState } from './state.js';
import { CSS_VARS, DATA_ATTRS, LIMITS } from './constants.js';
import { clamp, normalizeAngle, toast, vibrate } from './utils.js';
import { savePosition, clearPosition, loadPosition, getSettings } from './settings.js';

const MOBILE_BREAKPOINT = 768;
function isMobileViewport() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
}

// Pull element -> global state
export function readAvatar(el) {
    if (!el) return;
    dragState.x = parseFloat(el.dataset[DATA_ATTRS.X]) || 0;
    dragState.y = parseFloat(el.dataset[DATA_ATTRS.Y]) || 0;
    dragState.scale = parseFloat(el.dataset[DATA_ATTRS.SCALE]) || 1;
    rotationState.rotation = parseFloat(el.dataset[DATA_ATTRS.ROTATION]) || 0;
}

let saveTimer = null;
function scheduleSave(el) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        savePosition(el, {
            x: dragState.x,
            y: dragState.y,
            scale: dragState.scale,
            rotation: rotationState.rotation,
        });
        saveTimer = null;
    }, 250);
}

// Remove any inline layout properties we may have added earlier (used when
// switching viewport sizes so a desktop reload doesn't inherit our mobile
// overrides).
function clearMobileInlineOverrides(el) {
    el.style.removeProperty('top');
    el.style.removeProperty('left');
    el.style.removeProperty('right');
    el.style.removeProperty('bottom');
    el.style.removeProperty('margin');
    el.style.removeProperty('transform');
    el.style.removeProperty('-webkit-transform');
    el.style.removeProperty('transform-origin');
    // Do NOT remove `position` - style.css already forces `position: fixed`.
    el.style.removeProperty('position');
}

// Push global state -> element.
export function writeAvatar(el, { persist = true } = {}) {
    if (!el) return;
    const scale = clamp(dragState.scale, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
    const rotation = normalizeAngle(rotationState.rotation);
    dragState.scale = scale;
    rotationState.rotation = rotation;

    // Persist to data-* so subsequent readAvatar sees the same values.
    el.dataset[DATA_ATTRS.X] = String(dragState.x);
    el.dataset[DATA_ATTRS.Y] = String(dragState.y);
    el.dataset[DATA_ATTRS.SCALE] = String(scale);
    el.dataset[DATA_ATTRS.ROTATION] = String(rotation);

    // CSS custom properties - the primary channel on desktop, still used on
    // mobile for the close-button counter-scale.
    el.style.setProperty(CSS_VARS.X, `${dragState.x}px`);
    el.style.setProperty(CSS_VARS.Y, `${dragState.y}px`);
    el.style.setProperty(CSS_VARS.SCALE, String(scale));
    el.style.setProperty(CSS_VARS.ROTATE, `${rotation}deg`);
    el.style.setProperty(CSS_VARS.INVERSE_SCALE, String(1 / scale));

    if (isMobileViewport()) {
        // Mobile-only guard rail: bake a centered transform inline with
        // !important so SillyTavern's own inline top/left/transform can't push
        // the avatar off-screen.  `mobileYBias` shifts the visual centre down a
        // touch on phones (a fully-centred sprite tends to sit above the
        // comfortable thumb zone).
        const yBias = getSettings().mobileYBias ?? 200;
        const tx = `calc(-50% + ${dragState.x}px)`;
        const ty = `calc(-50% + ${dragState.y + yBias}px)`;
        const transform = `translate(${tx}, ${ty}) scale(${scale}) rotate(${rotation}deg)`;
        el.style.setProperty('transform', transform, 'important');
        el.style.setProperty('-webkit-transform', transform, 'important');
        el.style.setProperty('transform-origin', 'center center', 'important');
        el.style.setProperty('position', 'fixed', 'important');
        el.style.setProperty('top', '50%', 'important');
        el.style.setProperty('left', '50%', 'important');
        el.style.setProperty('right', 'auto', 'important');
        el.style.setProperty('bottom', 'auto', 'important');
        el.style.setProperty('margin', '0', 'important');
    } else {
        // Desktop: clear any mobile-inline leftovers so the stylesheet keeps
        // full control (this matches v2.0.4 behaviour byte-for-byte).
        clearMobileInlineOverrides(el);
    }

    if (persist) scheduleSave(el);
}

// Bring `el` back to center / 1x scale / 0 rotation and forget any saved state.
export function resetAvatar(el) {
    if (!el) return;
    dragState.x = 0;
    dragState.y = 0;
    dragState.scale = 1;
    rotationState.rotation = 0;
    writeAvatar(el, { persist: false });
    clearPosition(el);

    el.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => { el.style.transition = ''; }, 300);

    if (getSettings().showToasts !== false) toast('Avatar reset');
    vibrate([40, 40, 40]);
}

// Called when a new avatar is mounted.  Applies the saved transform (or the
// default centered one) so the very first frame the user sees is already in
// the correct position.
export function restoreAvatar(el) {
    if (!el) return;
    const saved = loadPosition(el);

    if (saved) {
        const vw = window.innerWidth || 800;
        const vh = window.innerHeight || 600;
        const maxX = vw * 0.45;
        const maxY = vh * 0.45;
        dragState.x = clamp(saved.x ?? 0, -maxX, maxX);
        dragState.y = clamp(saved.y ?? 0, -maxY, maxY);
        dragState.scale = saved.scale ?? 1;
        rotationState.rotation = saved.rotation ?? 0;
    } else {
        dragState.x = 0;
        dragState.y = 0;
        dragState.scale = 1;
        rotationState.rotation = 0;
    }

    writeAvatar(el, { persist: false });
}
