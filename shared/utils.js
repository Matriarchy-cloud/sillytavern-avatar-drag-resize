import { CSS_CLASSES, Z_INDEX_MAP, EXCLUDED_SELECTORS } from './constants.js';

export function getAvatar(el) {
    return el?.closest?.(`.${CSS_CLASSES.AVATAR}`);
}

export function getActiveAvatar(target) {
    if (target && document.contains(target)) return target;
    return document.querySelector(`.${CSS_CLASSES.AVATAR}`);
}

export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
           || (window.innerWidth <= 768);
}

export function isExcludedTarget(el) {
    return el?.closest?.(EXCLUDED_SELECTORS);
}

export function getZIndexValue(mode) {
    return Z_INDEX_MAP[mode] || '999999';
}

export function getAngle(clientX, clientY, rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx);
}

export function getDistance(clientX, clientY, rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.hypot(clientX - cx, clientY - cy);
}

export function getPinchDistance(touches) {
    if (touches.length < 2) return 0;
    return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
    );
}

export function getPinchAngle(touches) {
    if (touches.length < 2) return 0;
    return Math.atan2(
        touches[0].clientY - touches[1].clientY,
        touches[0].clientX - touches[1].clientX
    );
}

export function normalizeAngle(angle) {
    return ((angle % 360) + 360) % 360;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function clampToScreen(x, y, el) {
    if (!el) return { x, y };
    
    const rect = el.getBoundingClientRect();
    const padding = 20;
    
    const minX = -(rect.width / 2) + padding;
    const maxX = window.innerWidth - (rect.width / 2) - padding;
    const minY = -(rect.height / 2) + padding;
    const maxY = window.innerHeight - (rect.height / 2) - padding;
    
    return {
        x: clamp(x, minX, maxX),
        y: clamp(y, minY, maxY)
    };
}

export function getScreenSafeScale(scale, el) {
    if (!el) return scale;
    
    const naturalWidth = el.naturalWidth || el.width;
    const naturalHeight = el.naturalHeight || el.height;
    
    const maxScaleX = (window.innerWidth * 0.9) / naturalWidth;
    const maxScaleY = (window.innerHeight * 0.9) / naturalHeight;
    const maxScreenScale = Math.min(maxScaleX, maxScaleY, 8);
    
    return clamp(scale, 0.1, maxScreenScale);
}

export function normalizeAngleDiff(diff) {
    if (diff > Math.PI) return diff - 2 * Math.PI;
    if (diff < -Math.PI) return diff + 2 * Math.PI;
    return diff;
}

export function vibrate(pattern = 10) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

export function toast(message, duration = 1000) {
    if (typeof toastr !== 'undefined') {
        toastr.info(message, '', { timeOut: duration });
    }
}