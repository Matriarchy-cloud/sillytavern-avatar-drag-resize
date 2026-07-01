// ============================================================================
//  Zoom - mouse wheel (desktop) + on-screen buttons (mobile).
//
//  The wheel-zoom is multiplicative and magnitude-aware:
//    * A single detent (`deltaY` ~ ±100) applies `speed` as a percentage
//      growth/shrink factor (default 10 %).
//    * A high-precision trackpad emits smaller `deltaY` values many times per
//      swipe - we clamp/normalise the magnitude to `1.0` so a fast wheel-flick
//      does not blow the avatar up in a single frame.
//    * Growing and shrinking use reciprocal factors, so 10 clicks up cancels
//      out 10 clicks down back to the original scale.
// ============================================================================

import { dragState } from '../shared/state.js';
import { LIMITS } from '../shared/constants.js';
import { clamp } from '../shared/utils.js';
import { readAvatar, writeAvatar } from '../shared/avatar.js';
import { getSettings } from '../shared/settings.js';

// Cap the effective delta so a burst of precision-touchpad events cannot
// scale beyond one "physical notch" per event.
const DELTA_CAP = 100;

export function wheelZoom(target, deltaY) {
    if (!target || !deltaY) return;
    readAvatar(target);

    const speed = getSettings().zoomSpeed || 0.1;
    const magnitude = Math.min(Math.abs(deltaY), DELTA_CAP) / DELTA_CAP;   // 0..1
    const growth = 1 + speed * magnitude;
    const factor = deltaY < 0 ? growth : 1 / growth;

    dragState.scale = clamp(dragState.scale * factor, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
    writeAvatar(target);
}

export function stepZoom(target, direction /* +1 | -1 */) {
    if (!target) return;
    readAvatar(target);
    const speed = getSettings().mobileZoomStep || 0.1;
    const growth = 1 + speed;
    const factor = direction > 0 ? growth : 1 / growth;
    dragState.scale = clamp(dragState.scale * factor, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
    writeAvatar(target);
}
