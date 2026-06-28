export const dragState = {
    target: null,
    mode: null,
    x: 0,
    y: 0,
    scale: 1,
    startX: 0,
    startY: 0
};

export const rotationState = {
    rotation: 0,
    lastAngle: 0
};

export const touchState = {
    touches: new Map(),
    isPinching: false,
    touchMoved: false,
    lastTapTime: 0,
    lastTapTarget: null,
    longPressTimer: null,
    initialPinchDistance: 0,
    initialPinchScale: 1,
    initialPinchAngle: 0,
    initialPinchRotation: 0
};

export const intervals = {
    animation: null,
    mobile: {}
};

export const cleanupFns = [];

export function resetAllState() {
    Object.assign(dragState, {
        target: null, mode: null, x: 0, y: 0, scale: 1, startX: 0, startY: 0
    });
    
    Object.assign(rotationState, {
        rotation: 0, lastAngle: 0
    });
    
    touchState.touches.clear();
    Object.assign(touchState, {
        isPinching: false, touchMoved: false, lastTapTime: 0, lastTapTarget: null,
        longPressTimer: null, initialPinchDistance: 0, initialPinchScale: 1,
        initialPinchAngle: 0, initialPinchRotation: 0
    });
    
    if (intervals.animation) {
        cancelAnimationFrame(intervals.animation);
        intervals.animation = null;
    }
    
    Object.keys(intervals.mobile).forEach(key => {
        clearInterval(intervals.mobile[key]);
    });
    intervals.mobile = {};
    
    cleanupFns.forEach(fn => { try { fn(); } catch(e) {} });
    cleanupFns.length = 0;
}