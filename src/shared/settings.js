// Settings management - reads/writes to localStorage

const STORAGE_KEY = 'AvatarManip_settings';

// Default settings for first run
const defaults = {
    enabled: true,
    enableRotation: true,
    zIndexMode: 'aboveChat',
    ghostDragEffect: true,
    zoomSpeed: 0.1,
    rotationThreshold: 0.7,
    enableMultiTouchRotate: true,
    doubleTapTimeout: 300,
    longPressDuration: 600,
    mobileMoveStep: 50,
    showToasts: true
};

// Current settings (initialized with defaults)
let settings = { ...defaults };

// Load settings from localStorage, merge with defaults
export function loadSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            settings = { ...defaults, ...JSON.parse(stored) };
        }
    } catch (error) {
        settings = { ...defaults };
    }
    return settings;
}

// Get current settings object
export function getSettings() {
    return settings;
}

// Save current settings to localStorage
export function saveSettings() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        // Silently fail if localStorage is unavailable
    }
}