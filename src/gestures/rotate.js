// ============================================================================
//  Rotate - one-pointer rotate when the pointer starts near the edge.
//  Rotation semantics: `rotationThreshold` (0..1) is the fraction of the
//  bounding-radius beyond which a press starts a rotate instead of a drag.
//  With threshold = 0.7, presses that land in the outer 30% rotate.
// ============================================================================

import { dragState, rotationState } from '../shared/state.js';
import { CSS_CLASSES } from '../shared/constants.js';
import { angleFromCenter, wrapAngleDelta } from '../shared/utils.js';
import { getSettings } from '../shared/settings.js';

export function shouldRotate(e, target) {
    const settings = getSettings();
    if (!settings.enableRotation) return false;

    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const maxRadius = Math.max(rect.width, rect.height) / 2;
    if (maxRadius === 0) return false;
    return (dist / maxRadius) >= (settings.rotationThreshold ?? 0.7);
}

export function startRotate(e, target) {
    dragState.mode = 'rotate';
    const rect = target.getBoundingClientRect();
    rotationState.centerX = rect.left + rect.width / 2;
    rotationState.centerY = rect.top + rect.height / 2;
    rotationState.startAngle = angleFromCenter(e.clientX, e.clientY, rect);

    target.classList.add(CSS_CLASSES.ROTATING);
    target.style.transition = 'none';
    if (getSettings().ghostDragEffect) target.style.opacity = '0.9';
}

export function updateRotate(e, target) {
    const rect = target.getBoundingClientRect();
    const current = angleFromCenter(e.clientX, e.clientY, rect);
    const delta = wrapAngleDelta(current - rotationState.startAngle);
    rotationState.rotation += delta * (180 / Math.PI);
    rotationState.startAngle = current;
}

export function endRotate(target) {
    if (!target) return;
    target.classList.remove(CSS_CLASSES.ROTATING);
    target.style.opacity = '';
    target.style.transition = '';
}
