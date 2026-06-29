import { dragState, rotationState } from '../shared/state.js';
import { readAvatar } from '../shared/avatar.js';
import { getSettings } from '../shared/settings.js';
import { getAngle, getDistance, normalizeAngleDiff } from '../shared/utils.js';

/**
 * Check if the user intends to rotate based on click position
 * @param {Event} e - Mouse or Touch event
 * @param {HTMLElement} target - The avatar element
 * @returns {boolean} - True if rotation should start
 */
export function shouldRotate(e, target) {
    const settings = getSettings();
    
    // --- Check if rotation is enabled ---
    if (!settings.enableRotation) return false;
    
    // --- Get avatar dimensions ---
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // --- Calculate distance from center ---
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    
    const distX = clientX - centerX;
    const distY = clientY - centerY;
    const distance = Math.sqrt(distX * distX + distY * distY);
    
    // --- Get the radius (half of the smaller dimension) ---
    const radius = Math.min(rect.width, rect.height) / 2;
    
    // --- Get threshold from settings (default: 0.6 = 60% from center) ---
    const threshold = settings.rotationThreshold ?? 0.2;
    
    // --- Calculate the minimum distance required to start rotation ---
    // threshold 0.0 = center, 1.0 = edge
    const minDistance = radius * threshold;
    
    // --- Return true if click is outside the threshold zone ---
    const isOutside = distance > minDistance;
    
    // --- Debug log (remove in production) ---
    // console.log(`Rotate check: distance=${distance.toFixed(2)}, minDistance=${minDistance.toFixed(2)}, threshold=${threshold}, isOutside=${isOutside}`);
    
    return isOutside;
}

/**
 * Start rotation mode
 * @param {Event} e - Mouse or Touch event
 * @param {HTMLElement} target - The avatar element
 */
export function startRotate(e, target) {
    // --- Set drag mode ---
    dragState.mode = 'rotate';
    dragState.target = target;
    
    // --- Read current avatar state ---
    readAvatar(target);
    
    // --- Get initial angle ---
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    rotationState.lastAngle = getAngle(clientX, clientY, target.getBoundingClientRect());
    
    // --- Apply visual feedback ---
    target.classList.add('rotating');
    target.style.transition = 'none';
    
    // --- Ghost effect if enabled ---
    const settings = getSettings();
    if (settings.ghostDragEffect) {
        target.style.opacity = '0.9';
    }
}

/**
 * Update rotation during drag
 * @param {Event} e - Mouse or Touch event
 * @param {HTMLElement} target - The avatar element
 */
export function updateRotate(e, target) {
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    
    const rect = target.getBoundingClientRect();
    const currentAngle = getAngle(clientX, clientY, rect);
    
    // --- Calculate angle difference ---
    const angleDiff = normalizeAngleDiff(currentAngle - rotationState.lastAngle);
    rotationState.rotation += angleDiff * (180 / Math.PI);
    rotationState.lastAngle = currentAngle;
}