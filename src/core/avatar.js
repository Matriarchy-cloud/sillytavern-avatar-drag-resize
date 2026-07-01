// Core avatar state management - read, write, and reset

import { dragState, rotationState } from '../shared/state.js';
import { CSS_VARS, DATA_ATTRS, LIMITS } from '../shared/constants.js';
import { clamp, normalizeAngle, getActiveAvatar, toast, vibrate } from '../shared/utils.js';

// Read current transform values from an avatar element into shared state
export function readAvatar(el) {
    if (!el) return;
    
    dragState.x = parseFloat(el.dataset[DATA_ATTRS.X]) || 0;
    dragState.y = parseFloat(el.dataset[DATA_ATTRS.Y]) || 0;
    dragState.scale = parseFloat(el.dataset[DATA_ATTRS.SCALE]) || 1;
    rotationState.rotation = parseFloat(el.dataset[DATA_ATTRS.ROTATION]) || 0;
}

// Write shared state values to an avatar element's CSS and dataset
export function writeAvatar(el) {
    if (!el) return;
    
    const scale = clamp(dragState.scale, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
    const rotation = normalizeAngle(rotationState.rotation);
    
    dragState.scale = scale;
    rotationState.rotation = rotation;
    
    el.dataset[DATA_ATTRS.X] = dragState.x;
    el.dataset[DATA_ATTRS.Y] = dragState.y;
    el.dataset[DATA_ATTRS.SCALE] = scale;
    el.dataset[DATA_ATTRS.ROTATION] = rotation;
    
    el.style.setProperty(CSS_VARS.X, dragState.x + 'px');
    el.style.setProperty(CSS_VARS.Y, dragState.y + 'px');
    el.style.setProperty(CSS_VARS.SCALE, scale);
    el.style.setProperty(CSS_VARS.ROTATE, rotation + 'deg');
    el.style.setProperty(CSS_VARS.INVERSE_SCALE, 1 / scale);
}

// Reset an avatar to its default centered position
export function resetAvatar(el) {
    el = el || getActiveAvatar();
    if (!el) return;
    
    readAvatar(el);
    
    // Reset all state values
    dragState.x = 0;
    dragState.y = 0;
    dragState.scale = 1;
    rotationState.rotation = 0;
    
    // Apply reset values
    writeAvatar(el);
    
    // Add smooth transition for visual feedback
    el.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => {
        el.style.transition = '';
    }, 300);
    
    toast('Avatar reset');
    vibrate([50, 50, 50]);
}