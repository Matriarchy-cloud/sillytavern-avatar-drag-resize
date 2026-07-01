import { loadSettings, getSettings } from './src/shared/settings.js';
import { isMobileDevice, getZIndexValue } from './src/shared/utils.js';
import { registerDesktop } from './src/desktop/pointer.js';
import { registerMobile } from './src/mobile/touch.js';
import { createUI } from './src/ui/settings.js';
import { createMobileControls } from './src/ui/mobile.js';
import { CSS_CLASSES } from './src/shared/constants.js';

$(document).ready(() => {
    console.log('AvatarManip: Starting...');
    loadSettings();
    
    // Apply initial z-index to all avatars
    const zIndex = getZIndexValue(getSettings().zIndexMode);
    document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`).forEach(el => {
        el.style.setProperty('--avatar-z-index', zIndex, 'important');
    });
    document.documentElement.style.setProperty('--avatar-z-index', zIndex);
    
    setTimeout(() => {
        createUI();
        
        if (getSettings().enabled) {
            if (isMobileDevice()) {
                registerMobile();
                createMobileControls();
            } else {
                registerDesktop();
            }
        }
    }, 500);
});