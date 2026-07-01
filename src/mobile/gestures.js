// Mobile gesture handlers - double-tap and long-press detection

import { dragState, touchState } from '../shared/state.js';
import { getSettings } from '../shared/settings.js';
import { resetAvatar } from '../core/avatar.js';
import { vibrate } from '../shared/utils.js';

// Handle double-tap detection for avatar reset
export function handleDoubleTap(e, target) {
    const settings = getSettings();
    const now = Date.now();
    const timeout = settings.doubleTapTimeout || 300;
    
    // Check if same target was tapped within timeout period
    if (target === touchState.lastTapTarget && now - touchState.lastTapTime < timeout) {
        e.preventDefault();
        e.stopPropagation();
        resetAvatar(target);
        
        touchState.lastTapTime = 0;
        touchState.lastTapTarget = null;
        return true;
    }
    
    // Record this tap for next comparison
    touchState.lastTapTime = now;
    touchState.lastTapTarget = target;
    return false;
}

// Start long-press timer for avatar reset
export function startLongPress(target) {
    if (!target) return;
    
    clearLongPress();
    touchState.touchMoved = false;
    
    const duration = getSettings().longPressDuration || 600;
    
    touchState.longPressTimer = setTimeout(() => {
        // Only reset if finger hasn't moved and we're not pinching
        if (!touchState.touchMoved && dragState.target === target && !touchState.isPinching) {
            resetAvatar(target);
            vibrate(50);
        }
    }, duration);
}

// Clear the long-press timer
export function clearLongPress() {
    if (touchState.longPressTimer) {
        clearTimeout(touchState.longPressTimer);
        touchState.longPressTimer = null;
    }
}

// Mark that the touch has moved (cancels long-press)
export function markTouchMoved() {
    touchState.touchMoved = true;
}