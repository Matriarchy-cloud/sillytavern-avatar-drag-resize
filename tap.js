// ============================================================================
//  Utils - small pure helpers used across the extension.
// ============================================================================

import { CSS_CLASSES, EXCLUDED_SELECTOR, Z_INDEX_MAP } from './constants.js';

// -------------------- DOM helpers --------------------

export function getAvatar(el) {
    return el?.closest?.(`.${CSS_CLASSES.AVATAR}`) ?? null;
}

// Prefer the most recently interacted avatar, otherwise the first one on screen.
export function getActiveAvatar() {
    return (
        document.querySelector(`.${CSS_CLASSES.AVATAR}.${CSS_CLASSES.ACTIVE}`) ??
        document.querySelector(`.${CSS_CLASSES.AVATAR}`)
    );
}

export function isExcludedTarget(el) {
    return Boolean(el?.closest?.(EXCLUDED_SELECTOR));
}

export function isMobileDevice() {
    const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const touchOnly = matchMedia?.('(pointer: coarse)').matches;
    return uaMatch || touchOnly || window.innerWidth <= 768;
}

export function getZIndexValue(mode) {
    return Z_INDEX_MAP[mode] ?? Z_INDEX_MAP.aboveUI;
}

// -------------------- math --------------------

export function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
}

export function normalizeAngle(deg) {
    return ((deg % 360) + 360) % 360;
}

// Angle in radians between two touch points.
export function twoPointAngle(a, b) {
    return Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX);
}

export function twoPointDistance(a, b) {
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

// Angle in radians from `rect` center to (x, y).
export function angleFromCenter(x, y, rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(y - cy, x - cx);
}

// Wrap an angle delta so it stays in (-PI, PI].
export function wrapAngleDelta(delta) {
    if (delta > Math.PI) return delta - 2 * Math.PI;
    if (delta < -Math.PI) return delta + 2 * Math.PI;
    return delta;
}

// -------------------- feedback --------------------

export function vibrate(pattern = 10) {
    try { navigator.vibrate?.(pattern); } catch { /* iOS refuses without user gesture */ }
}

// Prefer SillyTavern's toastr if present; fallback to a plain fixed div.
export function toast(message) {
    if (typeof globalThis.toastr !== 'undefined') {
        globalThis.toastr.info(message, '', { timeOut: 1200 });
        return;
    }
    const existing = document.getElementById('am_toast');
    existing?.remove();
    const el = document.createElement('div');
    el.id = 'am_toast';
    el.textContent = message;
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
        'background:rgba(0,0,0,0.85);color:#fff;padding:10px 24px;border-radius:20px;' +
        'font:14px sans-serif;z-index:99999999;pointer-events:none;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
}
