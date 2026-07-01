// Zoom operation handler (mouse wheel or pinch)

import { dragState } from '../shared/state.js';
import { readAvatar, writeAvatar } from './avatar.js';
import { clamp } from '../shared/utils.js';
import { getSettings } from '../shared/settings.js';
import { LIMITS } from '../shared/constants.js';

// Simple zoom - scale changes from center (CSS transform-origin handles centering)
export function zoomAt(target, delta) {
    if (!target) return;
    
    readAvatar(target);
    
    const settings = getSettings();
    const speed = settings.zoomSpeed || 0.1;
    const zoomDelta = delta < 0 ? speed : -speed;
    
    dragState.scale = clamp(dragState.scale + zoomDelta, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
    
    writeAvatar(target);
}