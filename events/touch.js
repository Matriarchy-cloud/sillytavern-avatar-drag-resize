import { dragState, touchState } from '../shared/state.js';

export function onTouchStart(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
    }
}

export function onTouchMove(e) {
    const shouldBlock = touchState.isPinching || 
                       (e.touches?.length === 2 && dragState.target);
    if (shouldBlock) {
        e.preventDefault();
        e.stopPropagation();
    }
}