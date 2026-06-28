import { dragState, rotationState } from './state.js';
import { CSS_VARS, DATA_ATTRS, LIMITS } from './constants.js';
import { clamp, normalizeAngle, getActiveAvatar, toast, vibrate } from './utils.js';

export function readAvatar(el) {
    if (!el) return;
    
    try {
        dragState.x = parseFloat(el.dataset[DATA_ATTRS.X]) || 0;
        dragState.y = parseFloat(el.dataset[DATA_ATTRS.Y]) || 0;
        dragState.scale = parseFloat(el.dataset[DATA_ATTRS.SCALE]) || 1;
        rotationState.rotation = parseFloat(el.dataset[DATA_ATTRS.ROTATION]) || 0;
    } catch (error) {
        console.error('AvatarManip: readAvatar failed', error);
        dragState.x = 0;
        dragState.y = 0;
        dragState.scale = 1;
        rotationState.rotation = 0;
    }
}

export function writeAvatar(el) {
    if (!el) return;
    
    try {
        const safeScale = clamp(dragState.scale || 1, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
        const normalizedRotation = normalizeAngle(rotationState.rotation || 0);
        
        dragState.scale = safeScale;
        rotationState.rotation = normalizedRotation;
        
        el.dataset[DATA_ATTRS.X] = dragState.x;
        el.dataset[DATA_ATTRS.Y] = dragState.y;
        el.dataset[DATA_ATTRS.SCALE] = safeScale;
        el.dataset[DATA_ATTRS.ROTATION] = normalizedRotation;
        
        el.style.setProperty(CSS_VARS.X, dragState.x + 'px');
        el.style.setProperty(CSS_VARS.Y, dragState.y + 'px');
        el.style.setProperty(CSS_VARS.SCALE, String(safeScale));
        el.style.setProperty(CSS_VARS.ROTATE, normalizedRotation + 'deg');
        el.style.setProperty(CSS_VARS.INVERSE_SCALE, String(1 / safeScale));
    } catch (error) {
        console.error('AvatarManip: writeAvatar failed', error);
    }
}

export function resetAvatar(el) {
    el = el || getActiveAvatar();
    if (!el) return;
    
    dragState.x = 0;
    dragState.y = 0;
    dragState.scale = 1;
    rotationState.rotation = 0;
    writeAvatar(el);
    
    el.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => { el.style.transition = ''; }, 300);
    
    toast('Avatar reset');
    vibrate([50, 50, 50]);
}