import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';

const extensionName = 'SillyTavern-AdvancedAvatarControl';

const ExtensionState = {
    x: 0,
    y: 0,
    scale: 1,
    target: null,
    dragging: false,
    startX: 0,
    startY: 0,
    cleanupFunctions: [],
    initialized: false,
};

const defaultSettings = {
    enabled: true,
    alwaysOnTop: true,       // Z-Index kilidi
    zoomSpeed: 0.1,          // Tekerlek hassasiyeti
    fixCloseButton: true,    // Çarpı butonunu sabit boyutta tut
    ghostDragEffect: true    // Sürüklerken saydamlaşma
};

function getSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = { ...defaultSettings };
    }
    return extension_settings[extensionName];
}

function saveSettings() {
    saveSettingsDebounced();
}

function initCSSGenerator() {
    const settings = getSettings();
    const styleId = `${extensionName}-styles`;
    
    // Eski stili temizle
    let style = document.getElementById(styleId);
    if (style) style.remove();

    style = document.createElement('style');
    style.id = styleId;
    
    // SillyTavern'ın varsayılan kapatma butonu class'ları (gerekirse buraya kendi buton class'ını ekleyebilirsin)
    const closeButtonClasses = `
        .zoomed_avatar .zoom-cross, 
        .zoomed_avatar .avatar-close, 
        .zoomed_avatar .fa-times,
        .zoomed_avatar .close-btn
    `;

    style.textContent = `
        .zoomed_avatar {
            cursor: grab !important;
            transform: translate(var(--avatar-x, 0px), var(--avatar-y, 0px))
                       scale(var(--avatar-scale, 1)) !important;
            transform-origin: center center !important;
            will-change: transform !important;
            user-select: none !important;
            /* Her şeyin üstünde kalması için */
            position: fixed !important; 
            z-index: ${settings.alwaysOnTop ? '999999' : '1000'} !important;
            transition: opacity 0.2s ease;
        }

        .zoomed_avatar.dragging {
            cursor: grabbing !important;
            ${settings.ghostDragEffect ? 'opacity: 0.8 !important;' : ''}
        }

        /* Çarpı butonunun ters ölçeklendirmesi (Avatar büyüdükçe bu küçülür, böylece boyutu sabit kalır) */
        ${settings.fixCloseButton ? `
        ${closeButtonClasses} {
            transform: scale(var(--avatar-inverse-scale, 1)) !important;
            transform-origin: top right !important;
            transition: transform 0.1s ease-out;
        }
        ` : ''}
    `;
    document.head.appendChild(style);

    ExtensionState.cleanupFunctions.push(() => {
        const el = document.getElementById(styleId);
        if (el) el.remove();
    });
}

function getAvatar(el) {
    return el?.closest?.('.zoomed_avatar');
}

function read(el) {
    ExtensionState.x = parseFloat(el.dataset.avatarX || "0");
    ExtensionState.y = parseFloat(el.dataset.avatarY || "0");
    ExtensionState.scale = parseFloat(el.dataset.avatarScale || "1");
}

function write(el) {
    el.dataset.avatarX = ExtensionState.x;
    el.dataset.avatarY = ExtensionState.y;
    el.dataset.avatarScale = ExtensionState.scale;

    el.style.setProperty('--avatar-x', ExtensionState.x + 'px');
    el.style.setProperty('--avatar-y', ExtensionState.y + 'px');
    el.style.setProperty('--avatar-scale', ExtensionState.scale);
    
    // Çarpı butonunun büyümesini engelleyen asıl matematik (Ters Orantı)
    // Örn: Avatar 4 kat büyürse, buton 1/4 oranında küçülür ve orijinal boyutunda görünür.
    el.style.setProperty('--avatar-inverse-scale', 1 / ExtensionState.scale);
}

function resetAvatar(el) {
    ExtensionState.x = 0;
    ExtensionState.y = 0;
    ExtensionState.scale = 1;
    write(el);
}

function initAvatarControl() {
    const settings = getSettings();
    if (!settings.enabled) return;

    const onPointerDown = (e) => {
        const target = getAvatar(e.target);
        if (!target) return;
        
        // Eğer tıklanan şey kapatma butonunun kendisiyse sürüklemeyi başlatma
        if (e.target.closest('.zoom-cross, .avatar-close, .close-btn, .fa-times')) return;

        ExtensionState.target = target;
        ExtensionState.dragging = true;

        read(target);

        ExtensionState.startX = e.clientX - ExtensionState.x;
        ExtensionState.startY = e.clientY - ExtensionState.y;

        target.classList.add('dragging');
    };

    const onPointerMove = (e) => {
        if (!ExtensionState.dragging || !ExtensionState.target) return;

        ExtensionState.x = e.clientX - ExtensionState.startX;
        ExtensionState.y = e.clientY - ExtensionState.startY;

        write(ExtensionState.target);
    };

    const onPointerUp = () => {
        if (!ExtensionState.dragging) return;
        ExtensionState.dragging = false;

        if (ExtensionState.target) {
            ExtensionState.target.classList.remove('dragging');
            write(ExtensionState.target);
        }
        ExtensionState.target = null;
    };

    const onWheel = (e) => {
        const target = getAvatar(e.target);
        if (!target) return;

        e.preventDefault();
        read(target);

        if (e.deltaY < 0) ExtensionState.scale += settings.zoomSpeed;
        else ExtensionState.scale -= settings.zoomSpeed;

        // Çok küçük veya çok büyük olmasını engelle (0.2x - 8x arası)
        ExtensionState.scale = Math.max(0.2, Math.min(8, ExtensionState.scale));

        write(target);
    };

    const onDoubleClick = (e) => {
        const target = getAvatar(e.target);
        if (!target) return;
        
        // Çift tıklama ile pozisyonu ve boyutu sıfırla
        resetAvatar(target);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('dblclick', onDoubleClick);

    ExtensionState.cleanupFunctions.push(() => {
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('wheel', onWheel);
        document.removeEventListener('dblclick', onDoubleClick);
    });
}

function cleanup() {
    try {
        ExtensionState.cleanupFunctions.forEach(fn => {
            try { fn(); } catch (error) { console.error(`[${extensionName}] Cleanup error:`, error); }
        });
        ExtensionState.cleanupFunctions = [];
        ExtensionState.initialized = false;
        console.log(`[-] ${extensionName} Cleaned up`);
    } catch (error) {
        console.error(`[${extensionName}]`, 'Cleanup fatal error:', error);
    }
}

async function init() {
    if (ExtensionState.initialized) return;
    
    try {
        console.log(`[+] ${extensionName}: Loading...`);
        getSettings();
        
        initCSSGenerator();
        initAvatarControl();

        ExtensionState.initialized = true;
        console.log(`[+] ${extensionName}: Initialized successfully`);
        
    } catch (error) {
        console.error(`[${extensionName}]`, 'Error during initialization:', error);
    }
}

jQuery(() => {
    init();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { cleanup };
}

window.AdvancedAvatarControlExtension = window.AdvancedAvatarControlExtension || {};
window.AdvancedAvatarControlExtension.cleanup = cleanup;
window.AdvancedAvatarControlExtension.regenerate = () => {
    cleanup();
    init();
};