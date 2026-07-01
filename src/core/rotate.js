// Rotation operation handlers

import { dragState, rotationState } from '../shared/state.js';
import { CSS_CLASSES } from '../shared/constants.js';
import { getAngle } from '../shared/utils.js';
import { getSettings } from '../shared/settings.js';

// Check if pointer is near the edge (should rotate instead of drag)
export function shouldRotate(e, target) {
    if (!getSettings().enableRotation) return false;
    
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceFromCenter = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    const maxRadius = Math.max(rect.width, rect.height) / 2;
    
    // Rotate if pointer is beyond the threshold radius
    return (distanceFromCenter / maxRadius) > (getSettings().rotationThreshold || 0.7);
}

// Begin a rotation operation
export function startRotate(e, target) {
    dragState.mode = 'rotate';
    
    const rect = target.getBoundingClientRect();
    rotationState.centerX = rect.left + rect.width / 2;
    rotationState.centerY = rect.top + rect.height / 2;
    rotationState.startAngle = getAngle(
        rotationState.centerX, rotationState.centerY,
        e.clientX, e.clientY
    ) - rotationState.rotation;
    
    target.classList.add(CSS_CLASSES.ROTATING);
}

// Update rotation angle during rotation
export function updateRotate(e) {
    const currentAngle = getAngle(
        rotationState.centerX, rotationState.centerY,
        e.clientX, e.clientY
    );
    rotationState.rotation = currentAngle - rotationState.startAngle;
}

// End a rotation operation
export function endRotate(target) {
    dragState.mode = null;
    if (target) {
        target.classList.remove(CSS_CLASSES.ROTATING);
    }
}