// Shared state for drag operations
export const dragState = {
    target: null,        // The avatar element being manipulated
    mode: null,          // Current mode: 'drag', 'rotate', 'pinch', or null
    x: 0,                // Current X offset from center
    y: 0,                // Current Y offset from center
    scale: 1,            // Current scale multiplier
    startX: 0,           // X position when drag started
    startY: 0,           // Y position when drag started
    pointerStartX: 0,    // Pointer X when drag started
    pointerStartY: 0     // Pointer Y when drag started
};

// Shared state for rotation operations
export const rotationState = {
    rotation: 0,         // Current rotation angle in degrees
    startAngle: 0,       // Initial angle when rotation started
    centerX: 0,          // Center X of avatar for rotation calculation
    centerY: 0           // Center Y of avatar for rotation calculation
};

// Shared state for touch/multi-touch operations
export const touchState = {
    touches: new Map(),  // Active touch points by identifier
    isPinching: false,   // Whether a pinch gesture is in progress
    touchMoved: false,   // Whether touch moved (cancels long-press)
    lastTapTime: 0,      // Timestamp of last tap for double-tap detection
    lastTapTarget: null, // Target of last tap for double-tap detection
    longPressTimer: null // Timer ID for long-press detection
};

// Shared timers and intervals
export const intervals = {
    animation: null,     // requestAnimationFrame ID for smooth updates
    mobile: {}           // Repeat intervals for mobile control buttons
};