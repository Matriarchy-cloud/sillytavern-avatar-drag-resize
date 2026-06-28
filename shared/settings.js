import { extension_settings } from '../../../../extensions.js';
import { saveSettingsDebounced } from '../../../../../script.js';

const EXT_NAME = 'avatar-manip';

const DEFAULT_SETTINGS = {
    enabled: true,
    zIndexMode: 'aboveUI',
    zoomSpeed: 0.1,
    ghostDragEffect: true,
    enableRotation: true,
    rotationThreshold: 0.7,
    doubleTapTimeout: 300,
    longPressDuration: 600,
    enableMultiTouchRotate: true,
    multiTouchRotateSpeed: 1.0,
    mobileMoveStep: 50,
    mobileRotateStep: 15
};

export function initSettings() {
    if (!extension_settings[EXT_NAME]) {
        extension_settings[EXT_NAME] = { ...DEFAULT_SETTINGS };
    }
    return extension_settings[EXT_NAME];
}

export function getSettings() {
    return extension_settings[EXT_NAME];
}

export function saveSettings() {
    saveSettingsDebounced();
}

export { EXT_NAME, DEFAULT_SETTINGS };