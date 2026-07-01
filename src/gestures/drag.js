// ============================================================================
//  Drag - one-finger / one-pointer drag.
// ============================================================================

import { dragState } from '../shared/state.js';
import { CSS_CLASSES } from '../shared/constants.js';
import { getSettings } from '../shared/settings.js';

export function startDrag(e, target) {
    dragState.mode = 'drag';
    dragState.startX = dragState.x;
    dragState.startY = dragState.y;
    dragState.startPointerX = e.clientX;
    dragState.startPointerY = e.clientY;

    target.classList.add(CSS_CLASSES.DRAGGING);
    target.style.transition = 'none';

    if (getSettings().ghostDragEffect) target.style.opacity = '0.7';
}

export function updateDrag(e) {
    dragState.x = dragState.startX + (e.clientX - dragState.startPointerX);
    dragState.y = dragState.startY + (e.clientY - dragState.startPointerY);
}

export function endDrag(target) {
    if (!target) return;
    target.classList.remove(CSS_CLASSES.DRAGGING);
    target.style.opacity = '';
    target.style.transition = '';
}
