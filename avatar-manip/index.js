import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';

const extensionName = 'SillyTavern-AvatarControl';

const ExtensionState = {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    target: null,
    mode: null,
    startX: 0,
    startY: 0,
    lastAngle: 0,
    cleanupFunctions: [],
    initialized: false,
};

const defaultSettings = {
    enabled: true,
    zIndexMode: 'aboveUI', // 'background', 'aboveChat', 'aboveUI'
    zoomSpeed: 0.1,
    ghostDragEffect: true,
    enableRotation: true,
    rotationThreshold: 0.7
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

function getZIndexValue(mode) {
    switch(mode) {
        case 'background':
            return '10';
        case 'aboveChat':
            return '1000';
        case 'aboveUI':
            return '999999';
        default:
            return '999999';
    }
}

function initCSSGenerator() {
    const settings = getSettings();
    const styleId = `${extensionName}-styles`;
    
    let style = document.getElementById(styleId);
    if (style) style.remove();

    style = document.createElement('style');
    style.id = styleId;
    
    const closeButtonClasses = `
        .zoomed_avatar .dragClose,
        .zoomed_avatar .zoom-cross, 
        .zoomed_avatar .avatar-close, 
        .zoomed_avatar .fa-times,
        .zoomed_avatar .close-btn
    `;

    const zIndexValue = getZIndexValue(settings.zIndexMode);

    style.textContent = `
        .zoomed_avatar {
            cursor: grab !important;
            transform: translate(var(--avatar-x, 0px), var(--avatar-y, 0px))
                       scale(var(--avatar-scale, 1))
                       rotate(var(--avatar-rotate, 0deg)) !important;
            transform-origin: center center !important;
            will-change: transform !important;
            user-select: none !important;
            position: fixed !important; 
            z-index: ${zIndexValue} !important;
            transition: opacity 0.2s ease, z-index 0.3s ease;
            touch-action: none !important;
        }

        .zoomed_avatar.dragging {
            cursor: grabbing !important;
            ${settings.ghostDragEffect ? 'opacity: 0.8 !important;' : ''}
        }
        
        .zoomed_avatar.rotating {
            cursor: crosshair !important;
            ${settings.ghostDragEffect ? 'opacity: 0.9 !important;' : ''}
        }

        ${closeButtonClasses} {
            transform: scale(var(--avatar-inverse-scale, 1)) !important;
            transform-origin: center center !important;
            transition: transform 0.1s ease-out;
            position: relative;
            z-index: 9999999 !important;
        }
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
    ExtensionState.rotation = parseFloat(el.dataset.avatarRotate || "0");
}

function write(el) {
    el.dataset.avatarX = ExtensionState.x;
    el.dataset.avatarY = ExtensionState.y;
    el.dataset.avatarScale = ExtensionState.scale;
    el.dataset.avatarRotate = ExtensionState.rotation;

    el.style.setProperty('--avatar-x', ExtensionState.x + 'px');
    el.style.setProperty('--avatar-y', ExtensionState.y + 'px');
    el.style.setProperty('--avatar-scale', ExtensionState.scale);
    el.style.setProperty('--avatar-rotate', ExtensionState.rotation + 'deg');
    
    el.style.setProperty('--avatar-inverse-scale', 1 / ExtensionState.scale);
}

function resetAvatar(el) {
    ExtensionState.x = 0;
    ExtensionState.y = 0;
    ExtensionState.scale = 1;
    ExtensionState.rotation = 0;
    write(el);
}

function getAngleFromCenter(clientX, clientY, rect) {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX);
}

function getDistanceFromCenter(clientX, clientY, rect) {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.hypot(clientX - centerX, clientY - centerY);
}

function initAvatarControl() {
    const settings = getSettings();
    if (!settings.enabled) return;

    const onPointerDown = (e) => {
        const target = getAvatar(e.target);
        if (!target) return;
        
        if (e.target.closest('.dragClose, .zoom-cross, .avatar-close, .close-btn, .fa-times')) return;

        e.preventDefault();
        ExtensionState.target = target;
        read(target);

        const rect = target.getBoundingClientRect();
        const radius = Math.min(rect.width, rect.height) / 2;
        const dist = getDistanceFromCenter(e.clientX, e.clientY, rect);
        const threshold = settings.rotationThreshold || 0.7;

        if (settings.enableRotation && dist > radius * threshold) {
            ExtensionState.mode = 'rotate';
            ExtensionState.lastAngle = getAngleFromCenter(e.clientX, e.clientY, rect);
            target.classList.add('rotating');
            target.setPointerCapture(e.pointerId);
        } else {
            ExtensionState.mode = 'drag';
            ExtensionState.startX = e.clientX - ExtensionState.x;
            ExtensionState.startY = e.clientY - ExtensionState.y;
            target.classList.add('dragging');
            target.setPointerCapture(e.pointerId);
        }
    };

    const onPointerMove = (e) => {
        if (!ExtensionState.mode || !ExtensionState.target) return;

        e.preventDefault();

        if (ExtensionState.mode === 'drag') {
            ExtensionState.x = e.clientX - ExtensionState.startX;
            ExtensionState.y = e.clientY - ExtensionState.startY;
        } 
        else if (ExtensionState.mode === 'rotate') {
            const rect = ExtensionState.target.getBoundingClientRect();
            const currentAngle = getAngleFromCenter(e.clientX, e.clientY, rect);
            
            let angleDiff = currentAngle - ExtensionState.lastAngle;
            
            // Handle angle wrapping to prevent jumps
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            ExtensionState.rotation += angleDiff * (180 / Math.PI);
            ExtensionState.lastAngle = currentAngle;
        }

        write(ExtensionState.target);
    };

    const onPointerUp = (e) => {
        if (!ExtensionState.mode) return;

        if (ExtensionState.target) {
            ExtensionState.target.classList.remove('dragging', 'rotating');
            try {
                ExtensionState.target.releasePointerCapture(e.pointerId);
            } catch (err) {
                // Ignore if pointer capture wasn't set
            }
            write(ExtensionState.target);
        }
        
        ExtensionState.mode = null;
        ExtensionState.target = null;
    };

    const onPointerCancel = (e) => {
        if (ExtensionState.target) {
            ExtensionState.target.classList.remove('dragging', 'rotating');
            try {
                ExtensionState.target.releasePointerCapture(e.pointerId);
            } catch (err) {
                // Ignore if pointer capture wasn't set
            }
        }
        ExtensionState.mode = null;
        ExtensionState.target = null;
    };

    const onWheel = (e) => {
        const target = getAvatar(e.target);
        if (!target) return;

        e.preventDefault();
        read(target);

        if (e.deltaY < 0) {
            ExtensionState.scale += settings.zoomSpeed;
        } else {
            ExtensionState.scale -= settings.zoomSpeed;
        }

        ExtensionState.scale = Math.max(0.1, Math.min(8, ExtensionState.scale));
        write(target);
    };

    const onDoubleClick = (e) => {
        const target = getAvatar(e.target);
        if (!target) return;
        e.preventDefault();
        resetAvatar(target);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('dblclick', onDoubleClick);

    ExtensionState.cleanupFunctions.push(() => {
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerCancel);
        document.removeEventListener('wheel', onWheel);
        document.removeEventListener('dblclick', onDoubleClick);
    });
}

function createSettingsUI() {
    const settings = getSettings();
    const containerId = `${extensionName}-settings-container`;

    $(`#${containerId}`).remove();

    const zIndexLabels = {
        'background': '🔽 Background (Behind Chat)',
        'aboveChat': '🀄 Above Chat (Over Messages)',
        'aboveUI': '🔼 Above UI (Over Everything)'
    };

    const settingsHtml = `
        <div id="${containerId}" class="list-group-item">
            <div class="m-b-1"><b>Avatar Manip Settings</b></div>
            <hr class="m-t-1 m-b-1">
            
            <div class="flex-container m-b-1">
                <label class="checkbox_label">
                    <input type="checkbox" id="avatar_ext_enabled" ${settings.enabled ? 'checked' : ''}>
                    Enable Extension
                </label>
            </div>

            <div class="flex-container m-b-1">
                <label class="checkbox_label">
                    <input type="checkbox" id="avatar_ext_enableRotation" ${settings.enableRotation ? 'checked' : ''}>
                    Enable Rotation
                </label>
            </div>

            <div class="m-b-1">
                <label><b>Layer Position (Z-Index):</b></label>
                <select id="avatar_ext_zIndexMode" class="text_pole" style="width: 100%; margin-top: 5px;">
                    <option value="background" ${settings.zIndexMode === 'background' ? 'selected' : ''}>🔽 Background - Behind chat, subtle presence</option>
                    <option value="aboveChat" ${settings.zIndexMode === 'aboveChat' ? 'selected' : ''}>🀄 Above Chat - Over messages, visible during conversation</option>
                    <option value="aboveUI" ${settings.zIndexMode === 'aboveUI' ? 'selected' : ''}>🔼 Above UI - Over everything, always on top</option>
                </select>
            </div>

            <div class="flex-container m-b-1">
                <label class="checkbox_label">
                    <input type="checkbox" id="avatar_ext_ghostDragEffect" ${settings.ghostDragEffect ? 'checked' : ''}>
                    Opacity Feedback on Interaction
                </label>
            </div>

            <div class="flex-container m-b-1">
                <label>
                    Wheel Zoom Speed: 
                    <input type="number" id="avatar_ext_zoomSpeed" class="text_pole" min="0.05" max="0.5" step="0.05" value="${settings.zoomSpeed}" style="width: 80px; margin-left: 10px;">
                </label>
            </div>

            <div class="flex-container m-b-1">
                <label>
                    Rotation Zone Threshold: 
                    <input type="range" id="avatar_ext_rotationThreshold" min="0.5" max="0.95" step="0.05" value="${settings.rotationThreshold}" style="width: 150px; margin-left: 10px;">
                    <span id="rotationThresholdValue">${settings.rotationThreshold}</span>
                </label>
            </div>
        </div>
    `;

    $('#extensions_settings').append(settingsHtml);

    $('#avatar_ext_enabled').on('change', function() {
        settings.enabled = this.checked;
        saveSettings();
        window.AdvancedAvatarControlExtension.regenerate();
    });

    $('#avatar_ext_enableRotation').on('change', function() {
        settings.enableRotation = this.checked;
        saveSettings();
        window.AdvancedAvatarControlExtension.regenerate();
    });

    $('#avatar_ext_zIndexMode').on('change', function() {
        settings.zIndexMode = this.value;
        saveSettings();
        window.AdvancedAvatarControlExtension.regenerate();
    });

    $('#avatar_ext_ghostDragEffect').on('change', function() {
        settings.ghostDragEffect = this.checked;
        saveSettings();
        window.AdvancedAvatarControlExtension.regenerate();
    });

    $('#avatar_ext_zoomSpeed').on('change', function() {
        let val = parseFloat(this.value);
        if (isNaN(val)) val = 0.1;
        settings.zoomSpeed = val;
        saveSettings();
    });

    $('#avatar_ext_rotationThreshold').on('input', function() {
        let val = parseFloat(this.value);
        settings.rotationThreshold = val;
        $('#rotationThresholdValue').text(val.toFixed(2));
        saveSettings();
        window.AdvancedAvatarControlExtension.regenerate();
    });

    ExtensionState.cleanupFunctions.push(() => {
        $(`#${containerId}`).remove();
    });
}

function cleanup() {
    try {
        ExtensionState.cleanupFunctions.forEach(fn => {
            try { fn(); } catch (error) { 
                console.error(`[${extensionName}] Cleanup error:`, error); 
            }
        });
        ExtensionState.cleanupFunctions = [];
        ExtensionState.initialized = false;
        console.log(`[-] ${extensionName} cleaned up`);
    } catch (error) {
        console.error(`[${extensionName}] Fatal cleanup error:`, error);
    }
}

async function init() {
    if (ExtensionState.initialized) return;
    
    try {
        console.log(`[+] ${extensionName}: Loading...`);
        getSettings();
        
        createSettingsUI(); 
        initCSSGenerator();
        initAvatarControl();

        ExtensionState.initialized = true;
        console.log(`[+] ${extensionName}: Initialized successfully`);
        
    } catch (error) {
        console.error(`[${extensionName}] Error during initialization:`, error);
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