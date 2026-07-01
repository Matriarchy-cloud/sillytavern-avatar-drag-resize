// Pinch-to-zoom and two-finger rotation gesture handlers

import { dragState, rotationState, touchState } from '../shared/state.js';
import { CSS_CLASSES } from '../shared/constants.js';
import { getDistance, getAngle } from '../shared/utils.js';
import { getSettings } from '../shared/settings.js';

// Store initial values when pinch begins
let initialDistance = 0;
let initialScale = 1;
let initialRotation = 0;
let initialPinchAngle = 0;

// Start a pinch gesture - record initial finger positions
export function startPinch(target, touches) {
    dragState.mode = 'pinch';
    
    // Calculate initial distance between two fingers
    initialDistance = getDistance(
        touches[0].clientX, touches[0].clientY,
        touches[1].clientX, touches[1].clientY
    );
    initialScale = dragState.scale;
    
    // Calculate initial rotation for two-finger rotate
    initialRotation = rotationState.rotation;
    initialPinchAngle = getAngle(
        touches[0].clientX, touches[0].clientY,
        touches[1].clientX, touches[1].clientY
    );
    
    target.classList.add(CSS_CLASSES.PINCHING);
}

// Update scale and rotation based on current finger positions
export function updatePinch(touches) {
    if (touches.length < 2) return;
    
    // Update scale based on distance between fingers
    const currentDistance = getDistance(
        touches[0].clientX, touches[0].clientY,
        touches[1].clientX, touches[1].clientY
    );
    
    if (initialDistance > 0) {
        dragState.scale = initialScale * (currentDistance / initialDistance);
    }
    
    // Only rotate if multi-touch rotate setting is enabled
    if (getSettings().enableMultiTouchRotate === true) {
        const currentAngle = getAngle(
            touches[0].clientX, touches[0].clientY,
            touches[1].clientX, touches[1].clientY
        );
        
        let angleDelta = currentAngle - initialPinchAngle;
        
        // Handle angle wrap-around at 0/360 boundary
        if (angleDelta > 180) angleDelta -= 360;
        if (angleDelta < -180) angleDelta += 360;
        
        rotationState.rotation = initialRotation + angleDelta;
    }
}

// End a pinch gesture
export function endPinch(target) {
    dragState.mode = null;
    touchState.isPinching = false;
    if (target) {
        target.classList.remove(CSS_CLASSES.PINCHING);
    }
}