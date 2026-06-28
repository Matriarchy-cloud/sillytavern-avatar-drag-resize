import { dragState, rotationState, touchState } from '../shared/state.js';
import { readAvatar, writeAvatar } from '../shared/avatar.js';
import { getSettings } from '../shared/settings.js';
import { getPinchDistance, getPinchAngle, clamp, normalizeAngleDiff } from '../shared/utils.js';
import { LIMITS } from '../shared/constants.js';

export function startPinch(target, touches) {
    dragState.mode = 'pinch';
    dragState.target = target;
    readAvatar(target);
    
    touchState.isPinching = true;
    touchState.initialPinchDistance = getPinchDistance(touches);
    touchState.initialPinchScale = dragState.scale;
    touchState.initialPinchAngle = getPinchAngle(touches);
    touchState.initialPinchRotation = rotationState.rotation;
    
    target.classList.add('pinching');
    target.style.transition = 'none';
    
    if (getSettings().ghostDragEffect) {
        target.style.opacity = '0.8';
    }
}

export function updatePinch(touches) {
    if (!touchState.isPinching || touches.length < 2) return;
    
    const currentDistance = getPinchDistance(touches);
    const settings = getSettings();
    
    if (touchState.initialPinchDistance > 0 && currentDistance > 0) {
        const factor = currentDistance / touchState.initialPinchDistance;
        dragState.scale = clamp(touchState.initialPinchScale * factor, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
    }
    
    if (settings.enableRotation && settings.enableMultiTouchRotate !== false) {
        const currentAngle = getPinchAngle(touches);
        const angleDiff = normalizeAngleDiff(currentAngle - touchState.initialPinchAngle);
        const speed = settings.multiTouchRotateSpeed || 1.0;
        rotationState.rotation = touchState.initialPinchRotation + (angleDiff * (180 / Math.PI) * speed);
    }
}

export function endPinch(target) {
    if (!target) return;
    
    target.classList.remove('pinching');
    target.style.opacity = '1';
    target.style.transition = '';
    writeAvatar(target);
    
    touchState.isPinching = false;
    touchState.initialPinchDistance = 0;
    touchState.initialPinchAngle = 0;
}