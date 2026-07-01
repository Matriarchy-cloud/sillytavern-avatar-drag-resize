// Utility functions used across the extension

import { CSS_CLASSES } from './constants.js';
import { getSettings } from './settings.js';

// Find the closest zoomed_avatar element from a target element
export function getAvatar(target) {
    return target?.closest(`.${CSS_CLASSES.AVATAR}`);
}

// DÜZELTME: En son etkileşime girilen (active olan) avatarı bulur, yoksa ilkini seçer
export function getActiveAvatar() {
    return document.querySelector(`.${CSS_CLASSES.AVATAR}.active`) || document.querySelector(`.${CSS_CLASSES.AVATAR}`);
}

// Check if an element should be excluded from interaction
export function isExcludedTarget(el) {
    return el.closest('button, input, select, textarea, .dragClose, .avatar-close, .close-btn, .fa-times');
}

// Detect if the device is a mobile phone
export function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

// Clamp a number between min and max values
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Normalize an angle to the 0-360 range
export function normalizeAngle(angle) {
    return ((angle % 360) + 360) % 360;
}

// Calculate distance between two points
export function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// Calculate angle between two points in degrees
export function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

// Get z-index value based on layer position mode
export function getZIndexValue(mode) {
    const zIndexMap = {
        background: 10,
        aboveChat: 100,
        aboveUI: 999999
    };
    return zIndexMap[mode] || 100;
}

// Show a toast notification at the top of the screen
export function toast(msg) {
    const settings = getSettings();
    
    if (settings.showToasts === false) return;
    
    console.log(`AvatarManip: ${msg}`);
    
    const existing = document.getElementById('am_toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'am_toast';
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        padding: 10px 24px;
        border-radius: 20px;
        font-size: 14px;
        font-family: sans-serif;
        z-index: 99999999;
        pointer-events: none;
        animation: amToastIn 0.3s ease-out, amToastOut 0.3s ease-in 1.5s forwards;
    `;
    
    if (!document.getElementById('am_toast_styles')) {
        const style = document.createElement('style');
        style.id = 'am_toast_styles';
        style.textContent = `
            @keyframes amToastIn {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            @keyframes amToastOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 2000);
}

// Trigger haptic feedback if available
export function vibrate(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}