export const CSS_CLASSES = {
    AVATAR: 'zoomed_avatar',
    DRAGGING: 'dragging',
    ROTATING: 'rotating',
    PINCHING: 'pinching',
    CONTAINER: 'avatarmanip-container',
    MOBILE_CONTROLS: 'avatarmanip-mobile-controls'
};

export const CSS_VARS = {
    X: '--avatar-x',
    Y: '--avatar-y',
    SCALE: '--avatar-scale',
    ROTATE: '--avatar-rotate',
    INVERSE_SCALE: '--avatar-inverse-scale'
};

export const DATA_ATTRS = {
    X: 'x',
    Y: 'y',
    SCALE: 'scale',
    ROTATION: 'rotation'
};

export const LIMITS = {
    SCALE_MIN: 0.1,
    SCALE_MAX: 8
};

export const Z_INDEX_MAP = {
    background: '10',
    aboveChat: '1000',
    aboveUI: '999999'
};

export const EXCLUDED_SELECTORS = '.dragClose, .zoom-cross, .avatar-close, .close-btn, .fa-times';