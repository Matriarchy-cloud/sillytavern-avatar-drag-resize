import { saveSettingsDebounced } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';

const extName = 'avatar-manip';

const defaultSettings = {
    enabled: true,
    zIndexMode: 'aboveUI',
    zoomSpeed: 0.1,
    ghostDragEffect: true,
    enableRotation: true,
    rotationThreshold: 0.7
};

if (!extension_settings[extName]) {
    extension_settings[extName] = { ...defaultSettings };
}

const settings = extension_settings[extName];

let dragState = {
    target: null,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    mode: null,
    lastAngle: 0,
    cleanupFunctions: []
};

let animationFrameId = null;

function getZIndexValue(mode) {
    switch(mode) {
        case 'background': return '10';
        case 'aboveChat': return '1000';
        case 'aboveUI': return '999999';
        default: return '999999';
    }
}

function getAvatar(el) {
    return el?.closest?.('.zoomed_avatar');
}

function readAvatar(el) {
    const { x, y, scale, rotation } = dragState;
    dragState.x = parseFloat(el.dataset.x || "0");
    dragState.y = parseFloat(el.dataset.y || "0");
    dragState.scale = parseFloat(el.dataset.scale || "1");
    dragState.rotation = parseFloat(el.dataset.rotation || "0");
}

function writeAvatar(el) {
    const { x, y, scale, rotation } = dragState;
    
    el.dataset.x = x;
    el.dataset.y = y;
    el.dataset.scale = scale;
    el.dataset.rotation = rotation;

    el.style.setProperty('--avatar-x', x + 'px');
    el.style.setProperty('--avatar-y', y + 'px');
    el.style.setProperty('--avatar-scale', scale);
    el.style.setProperty('--avatar-rotate', rotation + 'deg');
    el.style.setProperty('--avatar-inverse-scale', 1 / scale);
}

function resetAvatar(el) {
    dragState.x = 0;
    dragState.y = 0;
    dragState.scale = 1;
    dragState.rotation = 0;
    writeAvatar(el);
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

function updateZIndexOnly(mode) {
    const zIndex = getZIndexValue(mode);
    
    document.querySelectorAll('.zoomed_avatar').forEach(el => {
        el.style.setProperty('z-index', zIndex, 'important');
    });
    
    document.documentElement.style.setProperty('--avatar-z-index', zIndex);
}

function updateGhostEffect() {
    document.querySelectorAll('.zoomed_avatar.dragging, .zoomed_avatar.rotating').forEach(el => {
        if (settings.ghostDragEffect) {
            if (el.classList.contains('dragging')) el.style.opacity = '0.7';
            if (el.classList.contains('rotating')) el.style.opacity = '0.9';
        } else {
            el.style.opacity = '1';
        }
    });
}

function handlePointerDown(e) {
    if (!settings.enabled) return;
    
    const target = getAvatar(e.target);
    if (!target) return;
    
    if (e.target.closest('.dragClose, .zoom-cross, .avatar-close, .close-btn, .fa-times')) return;
    
    e.preventDefault();
    dragState.target = target;
    readAvatar(target);
    
    const rect = target.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) / 2;
    const dist = getDistanceFromCenter(e.clientX, e.clientY, rect);
    const threshold = settings.rotationThreshold || 0.7;
    
    if (settings.enableRotation && dist > radius * threshold) {
        dragState.mode = 'rotate';
        dragState.lastAngle = getAngleFromCenter(e.clientX, e.clientY, rect);
        target.classList.add('rotating');
        if (settings.ghostDragEffect) {
            target.style.opacity = '0.9';
        }
        target.setPointerCapture(e.pointerId);
    } else {
        dragState.mode = 'drag';
        dragState.startX = e.clientX - dragState.x;
        dragState.startY = e.clientY - dragState.y;
        target.classList.add('dragging');
        if (settings.ghostDragEffect) {
            target.style.opacity = '0.7';
        }
        target.setPointerCapture(e.pointerId);
    }
}

function handlePointerMove(e) {
    if (!dragState.mode || !dragState.target) return;
    
    e.preventDefault();
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    animationFrameId = requestAnimationFrame(() => {
        const { mode, target, x, y, lastAngle } = dragState;
        
        if (mode === 'drag') {
            dragState.x = e.clientX - dragState.startX;
            dragState.y = e.clientY - dragState.startY;
        } else if (mode === 'rotate') {
            const rect = target.getBoundingClientRect();
            const currentAngle = getAngleFromCenter(e.clientX, e.clientY, rect);
            
            let angleDiff = currentAngle - lastAngle;
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            dragState.rotation += angleDiff * (180 / Math.PI);
            dragState.lastAngle = currentAngle;
        }
        
        writeAvatar(dragState.target);
        animationFrameId = null;
    });
}

function handlePointerUp(e) {
    if (!dragState.mode) return;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    if (dragState.target) {
        dragState.target.classList.remove('dragging', 'rotating');
        dragState.target.style.opacity = '1';
        try {
            dragState.target.releasePointerCapture(e.pointerId);
        } catch (err) {}
        writeAvatar(dragState.target);
    }
    
    dragState.mode = null;
    dragState.target = null;
}

function handlePointerCancel(e) {
    if (dragState.target) {
        dragState.target.classList.remove('dragging', 'rotating');
        dragState.target.style.opacity = '1';
        try {
            dragState.target.releasePointerCapture(e.pointerId);
        } catch (err) {}
    }
    dragState.mode = null;
    dragState.target = null;
}

function handleWheel(e) {
    if (!settings.enabled) return;
    
    const target = getAvatar(e.target);
    if (!target) return;
    
    e.preventDefault();
    readAvatar(target);
    
    if (e.deltaY < 0) {
        dragState.scale += settings.zoomSpeed || 0.1;
    } else {
        dragState.scale -= settings.zoomSpeed || 0.1;
    }
    
    dragState.scale = Math.max(0.1, Math.min(8, dragState.scale));
    writeAvatar(target);
}

function handleDoubleClick(e) {
    if (!settings.enabled) return;
    
    const target = getAvatar(e.target);
    if (!target) return;
    
    e.preventDefault();
    resetAvatar(target);
}

function createUI() {
    const containerId = 'avatarmanip-container';
    $(`#${containerId}`).remove();

    const html = `
    <div id="${containerId}" class="extension_container">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                <b style="font-size:var(--main-text-size);color:var(--text-color);">AvatarManip Settings</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down interactable down" tabindex="0" style="font-size:1.2rem;"></div>
            </div>
            <div class="inline-drawer-content" style="display:none;padding:10px 5px;">
                <div class="flex-container m-b-1" style="display:flex;align-items:center;margin-bottom:10px;">
                    <label class="checkbox_label" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                        <input type="checkbox" id="am_enabled" ${settings.enabled ? 'checked' : ''}>
                        Enable Extension
                    </label>
                </div>

                <div class="flex-container m-b-1" style="display:flex;align-items:center;margin-bottom:10px;">
                    <label class="checkbox_label" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                        <input type="checkbox" id="am_enableRotation" ${settings.enableRotation !== false ? 'checked' : ''}>
                        Enable Rotation
                    </label>
                </div>

                <div class="m-b-1" style="margin-bottom:10px;">
                    <label><b>Layer Position (Z-Index):</b></label>
                    <select id="am_zIndexMode" class="text_pole" style="width:100%;margin-top:5px;padding:5px;">
                        <option value="background" ${settings.zIndexMode === 'background' ? 'selected' : ''}>Background</option>
                        <option value="aboveChat" ${settings.zIndexMode === 'aboveChat' ? 'selected' : ''}>Above Chat</option>
                        <option value="aboveUI" ${settings.zIndexMode === 'aboveUI' ? 'selected' : ''}>Above UI</option>
                    </select>
                </div>

                <div class="flex-container m-b-1" style="display:flex;align-items:center;margin-bottom:10px;">
                    <label class="checkbox_label" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                        <input type="checkbox" id="am_ghostDragEffect" ${settings.ghostDragEffect !== false ? 'checked' : ''}>
                        Opacity Feedback
                    </label>
                </div>

                <div class="flex-container m-b-1" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
                    <label>Wheel Zoom Speed</label>
                    <input type="number" id="am_zoomSpeed" class="text_pole" min="0.05" max="0.5" step="0.05" value="${settings.zoomSpeed || 0.1}" style="width:100%;padding:5px;">
                </div>

                <div class="flex-container m-b-1" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
                    <label style="display:flex;justify-content:space-between;">
                        <span>Rotation Threshold</span>
                        <span id="am_rotationThresholdValue">${settings.rotationThreshold || 0.7}</span>
                    </label>
                    <input type="range" id="am_rotationThreshold" min="0.5" max="0.95" step="0.05" value="${settings.rotationThreshold || 0.7}" style="width:100%;">
                </div>
            </div>
        </div>
    </div>`;

    $('#extensions_settings').append(html);

    const $container = $(`#${containerId}`);
    const $toggle = $container.find('.inline-drawer-toggle');
    const $content = $container.find('.inline-drawer-content');
    const $icon = $container.find('.inline-drawer-icon');

    $toggle.on('click', function(e) {
        if (e.target.closest('input') || e.target.closest('select') || e.target.closest('label')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        
        if ($content.is(':visible')) {
            $content.slideUp(150);
            $icon.removeClass('up fa-circle-chevron-up').addClass('down fa-circle-chevron-down');
        } else {
            $content.slideDown(150);
            $icon.removeClass('down fa-circle-chevron-down').addClass('up fa-circle-chevron-up');
        }
    });

    const $inputs = $container.find('input, select');
    $inputs.on('click mousedown pointerdown', function(e) {
        e.stopPropagation();
    });

    const $labels = $container.find('label');
    $labels.on('click mousedown pointerdown', function(e) {
        e.stopPropagation();
    });

    $('#am_enabled').off('change').on('change', function(e) {
        e.stopPropagation();
        settings.enabled = this.checked;
        saveSettingsDebounced();
    });

    $('#am_enableRotation').off('change').on('change', function(e) {
        e.stopPropagation();
        settings.enableRotation = this.checked;
        saveSettingsDebounced();
    });

    $('#am_zIndexMode').off('change').on('change', function(e) {
        e.stopPropagation();
        settings.zIndexMode = this.value;
        saveSettingsDebounced();
        updateZIndexOnly(this.value);
    });

    $('#am_ghostDragEffect').off('change').on('change', function(e) {
        e.stopPropagation();
        settings.ghostDragEffect = this.checked;
        saveSettingsDebounced();
        updateGhostEffect();
    });

    $('#am_zoomSpeed').off('change').on('change', function(e) {
        e.stopPropagation();
        let val = parseFloat(this.value);
        if (isNaN(val)) val = 0.1;
        settings.zoomSpeed = val;
        saveSettingsDebounced();
    });

    $('#am_rotationThreshold').off('input').on('input', function(e) {
        e.stopPropagation();
        let val = parseFloat(this.value);
        settings.rotationThreshold = val;
        $('#am_rotationThresholdValue').text(val.toFixed(2));
        saveSettingsDebounced();
    });

    return $container;
}

function regenerateExtension() {
    cleanup();
    init();
}

function cleanup() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    document.removeEventListener('pointerdown', handlePointerDown);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerCancel);
    document.removeEventListener('wheel', handleWheel);
    document.removeEventListener('dblclick', handleDoubleClick);
    $('#avatarmanip-container').remove();
    dragState.cleanupFunctions.forEach(fn => { try { fn(); } catch(e) {} });
    dragState.cleanupFunctions = [];
}

function initEventListeners() {
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('dblclick', handleDoubleClick);
}

async function init() {
    try {
        createUI();
        initEventListeners();
        updateZIndexOnly(settings.zIndexMode || 'aboveUI');
        console.log("AvatarManip başarıyla yüklendi.");
    } catch (err) {
        console.error("AvatarManip Yükleme Hatası:", err);
    }
}

jQuery(async () => {
    await init();
});

export { cleanup };

window.AvatarManip = window.AvatarManip || {};
window.AvatarManip.cleanup = cleanup;
window.AvatarManip.regenerate = regenerateExtension;