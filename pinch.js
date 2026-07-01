// ============================================================================
//  State - shared mutable state for the current interaction.
//  Kept as plain objects (not classes) for zero-overhead access from hot paths.
// ============================================================================

export const dragState = {
    target: null,          // The .zoomed_avatar being manipulated
    mode: null,            // 'drag' | 'rotate' | 'pinch' | null
    x: 0, y: 0,            // Current transform x/y in px
    scale: 1,              // Current scale multiplier
    startPointerX: 0,      // Pointer position at gesture start
    startPointerY: 0,
    startX: 0,             // Avatar x/y at gesture start
    startY: 0,
};

export const rotationState = {
    rotation: 0,           // Current rotation in degrees
    startAngle: 0,         // Angle offset stored at rotate start
    centerX: 0,            // Screen-space center used for angle math
    centerY: 0,
};

export const touchState = {
    touches: new Map(),    // pointerId -> event, active pointers of type 'touch'
    isPinching: false,
    touchMoved: false,     // Set true when a drag/rotate move happens; cancels long-press
    lastTapTime: 0,
    lastTapTarget: null,
    longPressTimer: null,
    // Pinch reference frame
    pinchDistance0: 0,
    pinchScale0: 1,
    pinchAngle0: 0,
    pinchRotation0: 0,
};

export const intervals = {
    animation: null,       // requestAnimationFrame id
    mobile: Object.create(null), // buttonName -> setInterval id
};

export function resetInteractionState() {
    if (intervals.animation) cancelAnimationFrame(intervals.animation);
    intervals.animation = null;
    for (const k of Object.keys(intervals.mobile)) {
        clearInterval(intervals.mobile[k]);
        delete intervals.mobile[k];
    }
    Object.assign(dragState, {
        target: null, mode: null,
        x: 0, y: 0, scale: 1,
        startPointerX: 0, startPointerY: 0, startX: 0, startY: 0,
    });
    Object.assign(rotationState, {
        rotation: 0, startAngle: 0, centerX: 0, centerY: 0,
    });
    touchState.touches.clear();
    Object.assign(touchState, {
        isPinching: false, touchMoved: false,
        lastTapTime: 0, lastTapTarget: null,
        longPressTimer: null,
        pinchDistance0: 0, pinchScale0: 1,
        pinchAngle0: 0, pinchRotation0: 0,
    });
}
