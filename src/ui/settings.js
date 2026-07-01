// Settings UI - creates the extension settings panel

import { getSettings, saveSettings } from '../shared/settings.js';
import { isMobileDevice, getZIndexValue } from '../shared/utils.js';
import { CSS_CLASSES } from '../shared/constants.js';

// Update z-index CSS variable on all avatars
export function updateZIndexOnly(mode) {
    const zIndex = getZIndexValue(mode);
    document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`).forEach(el => {
        el.style.setProperty('--avatar-z-index', zIndex, 'important');
    });
    document.documentElement.style.setProperty('--avatar-z-index', zIndex);
}

// Update ghost/opacity effect on active avatars
export function updateGhostEffect() {
    const settings = getSettings();
    const states = [CSS_CLASSES.DRAGGING, CSS_CLASSES.ROTATING, CSS_CLASSES.PINCHING];
    states.forEach(state => {
        document.querySelectorAll(`.${CSS_CLASSES.AVATAR}.${state}`).forEach(el => {
            if (!settings.ghostDragEffect) { el.style.opacity = '1'; return; }
            if (state === CSS_CLASSES.DRAGGING) el.style.opacity = '0.7';
            else if (state === CSS_CLASSES.ROTATING) el.style.opacity = '0.9';
            else el.style.opacity = '0.8';
        });
    });
}

// Create the settings UI in the extensions panel
export function createUI() {
    const containerId = CSS_CLASSES.CONTAINER;
    const existing = document.getElementById(containerId);
    if (existing) existing.remove();

    const panel = document.getElementById('extensions_settings');
    if (!panel) {
        setTimeout(createUI, 1000);
        return;
    }

    const s = getSettings();
    const isMobile = isMobileDevice();

    const html = `
    <div id="${containerId}" class="extension_container">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>AvatarManip Settings</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content" style="padding:10px 5px;">
                <div class="flex-container m-b-1">
                    <label class="checkbox_label">
                        <input type="checkbox" id="am_enabled" ${s.enabled ? 'checked' : ''}>
                        <span>Enable Extension</span>
                    </label>
                </div>
                <div class="flex-container m-b-1">
                    <label class="checkbox_label">
                        <input type="checkbox" id="am_enableRotation" ${s.enableRotation !== false ? 'checked' : ''}>
                        <span>Enable Rotation</span>
                    </label>
                </div>
                <div class="flex-container m-b-1" style="flex-direction:column; gap:5px;">
                    <label><b>Layer Position (Z-Index):</b></label>
                    <select id="am_zIndexMode" class="text_pole" style="width:100%; padding:8px;">
                        <option value="background" ${s.zIndexMode === 'background' ? 'selected' : ''}>Background</option>
                        <option value="aboveChat" ${s.zIndexMode === 'aboveChat' ? 'selected' : ''}>Above Chat</option>
                        <option value="aboveUI" ${s.zIndexMode === 'aboveUI' ? 'selected' : ''}>Above UI</option>
                    </select>
                </div>
                <div class="flex-container m-b-1">
                    <label class="checkbox_label">
                        <input type="checkbox" id="am_ghostDragEffect" ${s.ghostDragEffect !== false ? 'checked' : ''}>
                        <span>Opacity Feedback</span>
                    </label>
                </div>
                <div class="flex-container m-b-1">
                    <label class="checkbox_label">
                        <input type="checkbox" id="am_showToasts" ${s.showToasts !== false ? 'checked' : ''}>
                        <span>Show Toast Notifications</span>
                    </label>
                </div>
                <div class="flex-container m-b-1" style="flex-direction:column;gap:5px;">
                    <label>Zoom Speed</label>
                    <input type="number" id="am_zoomSpeed" class="text_pole" min="0.05" max="0.5" step="0.05" value="${s.zoomSpeed || 0.1}" style="width:100%;padding:5px;">
                </div>
                <div class="flex-container m-b-1" style="flex-direction:column;gap:5px;">
                    <label style="display:flex;justify-content:space-between;">
                        <span>Rotation Threshold</span>
                        <span id="am_rotationThresholdValue">${s.rotationThreshold || 0.7}</span>
                    </label>
                    <input type="range" id="am_rotationThreshold" min="0.5" max="0.95" step="0.05" value="${s.rotationThreshold || 0.7}" style="width:100%;">
                </div>
                ${isMobile ? getMobileSettingsHTML(s) : ''}
            </div>
        </div>
    </div>`;

    panel.insertAdjacentHTML('beforeend', html);
    
    // Small delay to ensure DOM is ready
    setTimeout(bindSettingsEvents, 50);
}

// Generate mobile-specific settings HTML
function getMobileSettingsHTML(s) {
    return `
        <div class="flex-container m-b-1">
            <label class="checkbox_label">
                <input type="checkbox" id="am_enableMultiTouchRotate" ${s.enableMultiTouchRotate !== false ? 'checked' : ''}>
                <span>Multi-Touch Rotate</span>
            </label>
        </div>
        <div class="flex-container m-b-1" style="flex-direction:column;gap:5px;">
            <label style="display:flex;justify-content:space-between;">
                <span>Double-Tap Timeout (ms)</span>
                <span id="am_doubleTapTimeoutValue">${s.doubleTapTimeout || 300}</span>
            </label>
            <input type="range" id="am_doubleTapTimeout" min="200" max="500" step="50" value="${s.doubleTapTimeout || 300}" style="width:100%;">
        </div>
        <div class="flex-container m-b-1" style="flex-direction:column;gap:5px;">
            <label style="display:flex;justify-content:space-between;">
                <span>Long Press Duration (ms)</span>
                <span id="am_longPressDurationValue">${s.longPressDuration || 600}</span>
            </label>
            <input type="range" id="am_longPressDuration" min="400" max="1000" step="50" value="${s.longPressDuration || 600}" style="width:100%;">
        </div>`;
}

// Bind jQuery events to all settings controls
function bindSettingsEvents() {
    const s = getSettings();
    
    // Enable/Disable extension
    $('#am_enabled').off('change').on('change', function() {
        s.enabled = this.checked;
        saveSettings();
    });
    
    // Enable/Disable rotation
    $('#am_enableRotation').off('change').on('change', function() {
        s.enableRotation = this.checked;
        saveSettings();
    });
    
    // Z-Index layer position
    $('#am_zIndexMode').off('change').on('change', function() {
        s.zIndexMode = this.value;
        saveSettings();
        updateZIndexOnly(this.value);
    });
    
    // Ghost drag effect
    $('#am_ghostDragEffect').off('change').on('change', function() {
        s.ghostDragEffect = this.checked;
        saveSettings();
        updateGhostEffect();
    });
    
    // Show toast notifications
    $('#am_showToasts').off('change').on('change', function() {
        s.showToasts = this.checked;
        saveSettings();
    });
    
    // Zoom speed
    $('#am_zoomSpeed').off('change').on('change', function() {
        s.zoomSpeed = parseFloat(this.value) || 0.1;
        saveSettings();
    });
    
    // Rotation threshold
    $('#am_rotationThreshold').off('input').on('input', function() {
        s.rotationThreshold = parseFloat(this.value);
        $('#am_rotationThresholdValue').text(parseFloat(this.value).toFixed(2));
        saveSettings();
    });
    
    // Mobile-only settings
    if (isMobileDevice()) {
        $('#am_enableMultiTouchRotate').off('change').on('change', function() {
            s.enableMultiTouchRotate = this.checked;
            saveSettings();
        });
        
        $('#am_doubleTapTimeout').off('input').on('input', function() {
            s.doubleTapTimeout = parseInt(this.value);
            $('#am_doubleTapTimeoutValue').text(this.value);
            saveSettings();
        });
        
        $('#am_longPressDuration').off('input').on('input', function() {
            s.longPressDuration = parseInt(this.value);
            $('#am_longPressDurationValue').text(this.value);
            saveSettings();
        });
    }
    
    console.log('AvatarManip: Settings events bound');
}