import { dragState, touchState } from '../shared/state.js';
import { getSettings } from '../shared/settings.js';
import { resetAvatar } from '../shared/avatar.js';
import { vibrate } from '../shared/utils.js';

export function handleDoubleTap(e, target) {
    const settings = getSettings();
    const now = Date.now();
    const timeout = settings.doubleTapTimeout || 300;
    
    if (target === touchState.lastTapTarget && now - touchState.lastTapTime < timeout) {
        e.preventDefault();
        e.stopPropagation();
        resetAvatar(target);
        
        touchState.lastTapTime = 0;
        touchState.lastTapTarget = null;
        return true;
    }
    
    touchState.lastTapTime = now;
    touchState.lastTapTarget = target;
    return false;
}

export function startLongPress(target) {
    if (!target) return;
    
    clearLongPress();
    touchState.touchMoved = false;
    
    const duration = getSettings().longPressDuration || 600;
    
    touchState.longPressTimer = setTimeout(() => {
        if (!touchState.touchMoved && dragState.target === target && !touchState.isPinching) {
            resetAvatar(target);
            vibrate(50);
        }
    }, duration);
}

export function clearLongPress() {
    if (touchState.longPressTimer) {
        clearTimeout(touchState.longPressTimer);
        touchState.longPressTimer = null;
    }
}

export function markTouchMoved() {
    touchState.touchMoved = true;
}