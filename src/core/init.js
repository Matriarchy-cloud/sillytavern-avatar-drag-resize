import { loadSettings, getSettings } from '../shared/settings.js';
import { isMobileDevice, getZIndexValue } from '../shared/utils.js';
import { registerDesktop } from '../desktop/pointer.js';
import { registerMobile } from '../mobile/touch.js';
import { createSettingsUI } from '../ui/settings.js';
import { createMobileControls } from '../ui/mobile.js';
import { CSS_CLASSES } from '../shared/constants.js';

let initialized = false;

export function initExtension() {
    if (initialized) return;
    
    loadSettings();
    createSettingsUI();
    
    if (getSettings().enabled) {
        enableFeatures();
    }
    
    initialized = true;
    console.log('AvatarManip: Ready');
}

export function enableFeatures() {
    if (isMobileDevice()) {
        registerMobile();
        createMobileControls();
    } else {
        registerDesktop();
    }
    
    updateAllZIndex();
}

export function disableFeatures() {
    if (isMobileDevice()) {
        // unregisterMobile();
    } else {
        // unregisterDesktop();
    }
}

export function updateAllZIndex() {
    const zIndex = getZIndexValue(getSettings().zIndexMode);
    document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`).forEach(el => {
        el.style.setProperty('--avatar-z-index', zIndex);
    });
}