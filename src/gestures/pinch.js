// ============================================================================
//  Pinch - two-finger pinch to zoom + optional two-finger rotate.
// ============================================================================

import { dragState, rotationState, touchState } from '../shared/state.js';
import { CSS_CLASSES, LIMITS } from '../shared/constants.js';
import { clamp, twoPointAngle, twoPointDistance, wrapAngleDelta } from '../shared/utils.js';
import { readAvatar } from '../shared/avatar.js';
import { getSettings } from '../shared/settings.js';

export function startPinch(target, touches) {
    if (touches.length < 2) return;
    dragState.mode = 'pinch';
    dragState.target = target;
    touchState.isPinching = true;
    readAvatar(target);

    touchState.pinchDistance0 = twoPointDistance(touches[0], touches[1]);
    touchState.pinchScale0 = dragState.scale;
    touchState.pinchAngle0 = twoPointAngle(touches[0], touches[1]);
    touchState.pinchRotation0 = rotationState.rotation;

    target.classList.add(CSS_CLASSES.PINCHING);
    target.style.transition = 'none';
    if (getSettings().ghostDragEffect) target.style.opacity = '0.8';
}

export function updatePinch(touches) {
    if (!touchState.isPinching || touches.length < 2) return;
    const settings = getSettings();

    // Scale
    const currentDist = twoPointDistance(touches[0], touches[1]);
    if (touchState.pinchDistance0 > 0 && currentDist > 0) {
        const factor = currentDist / touchState.pinchDistance0;
        dragState.scale = clamp(touchState.pinchScale0 * factor, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
    }

    // Rotate (opt-in)
    if (settings.enableRotation && settings.enableMultiTouchRotate) {
        const currentAngle = twoPointAngle(touches[0], touches[1]);
        const delta = wrapAngleDelta(currentAngle - touchState.pinchAngle0);
        const speed = settings.multiTouchRotateSpeed ?? 1.0;
        rotationState.rotation = touchState.pinchRotation0 + delta * (180 / Math.PI) * speed;
    }
}

export function endPinch(target) {
    touchState.isPinching = false;
    touchState.pinchDistance0 = 0;
    if (!target) return;
    target.classList.remove(CSS_CLASSES.PINCHING);
    target.style.opacity = '';
    target.style.transition = '';
}
