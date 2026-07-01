// Drag operation handlers

import { dragState } from '../shared/state.js';
import { CSS_CLASSES } from '../shared/constants.js';

// Begin a drag operation
export function startDrag(e, target) {
    dragState.mode = 'drag';
    // Store the current position as starting point
    dragState.startX = dragState.x;
    dragState.startY = dragState.y;
    // Store pointer position
    dragState.pointerStartX = e.clientX;
    dragState.pointerStartY = e.clientY;
    target.classList.add(CSS_CLASSES.DRAGGING);
}

// Update position during drag - calculate delta from start
export function updateDrag(e) {
    const dx = e.clientX - dragState.pointerStartX;
    const dy = e.clientY - dragState.pointerStartY;
    dragState.x = dragState.startX + dx;
    dragState.y = dragState.startY + dy;
}

// End a drag operation
export function endDrag(target) {
    dragState.mode = null;
    if (target) {
        target.classList.remove(CSS_CLASSES.DRAGGING);
    }
}