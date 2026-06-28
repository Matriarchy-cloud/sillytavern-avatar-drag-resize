import { dragState, rotationState } from '../shared/state.js';
import { readAvatar } from '../shared/avatar.js';
import { getSettings } from '../shared/settings.js';
import { getAngle, getDistance, normalizeAngleDiff } from '../shared/utils.js';

export function shouldRotate(e, target) {
    const settings = getSettings();
    if (!settings.enableRotation) return false;
    
    const rect = target.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) / 2;
    const dist = getDistance(e.clientX, e.clientY, rect);
    
    return dist > radius * (settings.rotationThreshold || 0.7);
}

export function startRotate(e, target) {
    dragState.mode = 'rotate';
    dragState.target = target;
    readAvatar(target);
    
    rotationState.lastAngle = getAngle(e.clientX, e.clientY, target.getBoundingClientRect());
    
    target.classList.add('rotating');
    target.style.transition = 'none';
    
    if (getSettings().ghostDragEffect) {
        target.style.opacity = '0.9';
    }
}

export function updateRotate(e, target) {
    const rect = target.getBoundingClientRect();
    const currentAngle = getAngle(e.clientX, e.clientY, rect);
    
    const angleDiff = normalizeAngleDiff(currentAngle - rotationState.lastAngle);
    rotationState.rotation += angleDiff * (180 / Math.PI);
    rotationState.lastAngle = currentAngle;
}