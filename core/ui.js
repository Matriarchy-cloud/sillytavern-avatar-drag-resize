import { getSettings, saveSettings } from '../shared/settings.js';
import { isMobileDevice, getZIndexValue } from '../shared/utils.js';
import { CSS_CLASSES } from '../shared/constants.js';

export function updateZIndexOnly(mode) {
    const zIndex = getZIndexValue(mode);
    
    document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`).forEach(el => {
        el.style.setProperty('--avatar-z-index', zIndex, 'important');
    });
    
    document.documentElement.style.setProperty('--avatar-z-index', zIndex);
}

export function updateGhostEffect() {
    const settings = getSettings();
    const selector = [
        `.${CSS_CLASSES.AVATAR}.${CSS_CLASSES.DRAGGING}`,
        `.${CSS_CLASSES.AVATAR}.${CSS_CLASSES.ROTATING}`,
        `.${CSS_CLASSES.AVATAR}.${CSS_CLASSES.PINCHING}`
    ].join(', ');
    
    document.querySelectorAll(selector).forEach(el => {
        if (!settings.ghostDragEffect) {
            el.style.opacity = '1';
            return;
        }
        if (el.classList.contains(CSS_CLASSES.DRAGGING)) el.style.opacity = '0.7';
        if (el.classList.contains(CSS_CLASSES.ROTATING)) el.style.opacity = '0.9';
        if (el.classList.contains(CSS_CLASSES.PINCHING)) el.style.opacity = '0.8';
    });
}

export function createUI() {
    const containerId = CSS_CLASSES.CONTAINER;
    document.getElementById(containerId)?.remove();
    
    const settings = getSettings();
    const mobileSections = isMobileDevice() ? getMobileSettingsHTML(settings) : '';

    const html = `
    <div id="${containerId}" class="extension_container">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>AvatarManip Settings</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content" style="padding:10px 5px;">
                ${getGeneralSettingsHTML(settings)}
                ${mobileSections}
            </div>
        </div>
    </div>`;

    document.getElementById('extensions_settings')?.insertAdjacentHTML('beforeend', html);
    bindSettingsEvents();
}

function getGeneralSettingsHTML(s) {
    return `
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
        <div class="flex-container m-b-1" style="flex-direction:column;gap:5px;">
            <label><b>Layer Position (Z-Index):</b></label>
            <select id="am_zIndexMode" class="text_pole" style="width:100%;padding:5px;">
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
        </div>`;
}

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

function bindSettingsEvents() {
    const settings = getSettings();
    
    $('#am_enabled').on('change', function() { settings.enabled = this.checked; saveSettings(); });
    $('#am_enableRotation').on('change', function() { settings.enableRotation = this.checked; saveSettings(); });
    $('#am_zIndexMode').on('change', function() { settings.zIndexMode = this.value; saveSettings(); updateZIndexOnly(this.value); });
    $('#am_ghostDragEffect').on('change', function() { settings.ghostDragEffect = this.checked; saveSettings(); updateGhostEffect(); });
    $('#am_zoomSpeed').on('change', function() { settings.zoomSpeed = parseFloat(this.value) || 0.1; saveSettings(); });
    $('#am_rotationThreshold').on('input', function() { 
        settings.rotationThreshold = parseFloat(this.value); 
        $('#am_rotationThresholdValue').text(parseFloat(this.value).toFixed(2)); 
        saveSettings(); 
    });
    
    if (isMobileDevice()) {
        $('#am_enableMultiTouchRotate').on('change', function() { settings.enableMultiTouchRotate = this.checked; saveSettings(); });
        $('#am_doubleTapTimeout').on('input', function() { settings.doubleTapTimeout = parseInt(this.value); $('#am_doubleTapTimeoutValue').text(this.value); saveSettings(); });
        $('#am_longPressDuration').on('input', function() { settings.longPressDuration = parseInt(this.value); $('#am_longPressDurationValue').text(this.value); saveSettings(); });
    }
}