// ============================================================================
//  Zoom - mouse wheel (desktop) + on-screen buttons (mobile).
// ============================================================================

import { dragState } from '../shared/state.js';
import { LIMITS } from '../shared/constants.js';
import { clamp } from '../shared/utils.js';
import { readAvatar, writeAvatar } from '../shared/avatar.js';
import { getSettings } from '../shared/settings.js';

export function wheelZoom(target, deltaY) {
    if (!target) return;
    readAvatar(target);
    const step = getSettings().zoomSpeed || 0.1;
    const factor = deltaY < 0 ? step : -step;
    dragState.scale = clamp(dragState.scale + factor, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
    writeAvatar(target);
}

export function stepZoom(target, direction /* +1 | -1 */) {
    if (!target) return;
    readAvatar(target);
    const step = getSettings().mobileZoomStep || 0.1;
    dragState.scale = clamp(dragState.scale + direction * step, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
    writeAvatar(target);
}
