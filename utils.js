// ============================================================================
//  Constants - centralized CSS selectors, keys, and numeric limits.
// ============================================================================

export const EXT_NAME = 'avatar_manip';

export const CSS_CLASSES = Object.freeze({
    AVATAR: 'zoomed_avatar',
    DRAGGING: 'am-dragging',
    ROTATING: 'am-rotating',
    PINCHING: 'am-pinching',
    ACTIVE: 'am-active',
    SETTINGS_CONTAINER: 'avatarmanip-settings',
    MOBILE_CONTROLS: 'avatarmanip-mobile-controls',
});

export const CSS_VARS = Object.freeze({
    X: '--am-x',
    Y: '--am-y',
    SCALE: '--am-scale',
    ROTATE: '--am-rotate',
    INVERSE_SCALE: '--am-inverse-scale',
    Z_INDEX: '--am-z-index',
});

// Stored on the element as data-am-* attributes so multiple avatars keep their own state.
export const DATA_ATTRS = Object.freeze({
    X: 'amX',
    Y: 'amY',
    SCALE: 'amScale',
    ROTATION: 'amRotation',
});

export const LIMITS = Object.freeze({
    SCALE_MIN: 0.1,
    SCALE_MAX: 8,
});

export const Z_INDEX_MAP = Object.freeze({
    background: 10,
    aboveChat: 1000,
    aboveUI: 999999,
});

// Any element matching this selector should never trigger avatar manipulation
// (close buttons, form inputs, and the on-screen mobile control buttons).
export const EXCLUDED_SELECTOR = [
    '.dragClose',
    '.zoom-cross',
    '.avatar-close',
    '.close-btn',
    '.fa-times',
    '.mobile-control-btn',
    '.mobile-controls-toggle',
    'button',
    'input',
    'select',
    'textarea',
    'a[href]',
].join(', ');
