// ============================================================================
//  UI - Settings panel injected into #extensions_settings.
//  Uses vanilla DOM APIs (no jQuery event delegation) for reliability.
// ============================================================================

import { CSS_CLASSES } from '../shared/constants.js';
import { getSettings, saveSettings } from '../shared/settings.js';
import { isMobileDevice } from '../shared/utils.js';
import { applyZIndexEverywhere } from '../observer.js';
import { readAvatar, writeAvatar } from '../shared/avatar.js';

// Poll until SillyTavern's extension settings panel exists, then run `fn`.
function whenPanelReady(fn, attempts = 60) {
    const panel = document.getElementById('extensions_settings');
    if (panel) { fn(panel); return; }
    if (attempts <= 0) return;
    setTimeout(() => whenPanelReady(fn, attempts - 1), 500);
}

function html(s) {
    return `
    <div id="${CSS_CLASSES.SETTINGS_CONTAINER}" class="extension_container">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Avatar Manipulator</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content" style="padding:10px 5px;">
                <label class="checkbox_label m-b-1">
                    <input type="checkbox" data-am-key="enabled" ${s.enabled ? 'checked' : ''}>
                    <span>Enable Extension</span>
                </label>
                <label class="checkbox_label m-b-1">
                    <input type="checkbox" data-am-key="enableRotation" ${s.enableRotation ? 'checked' : ''}>
                    <span>Enable Rotation</span>
                </label>
                <div class="flex-container m-b-1" style="flex-direction:column;gap:5px;">
                    <label><b>Layer Position (Z-Index)</b></label>
                    <select data-am-key="zIndexMode" class="text_pole" style="width:100%;padding:6px;">
                        <option value="background"${s.zIndexMode === 'background' ? ' selected' : ''}>Background</option>
                        <option value="aboveChat"${s.zIndexMode === 'aboveChat' ? ' selected' : ''}>Above Chat</option>
                        <option value="aboveUI"${s.zIndexMode === 'aboveUI' ? ' selected' : ''}>Above UI</option>
                    </select>
                </div>
                <label class="checkbox_label m-b-1">
                    <input type="checkbox" data-am-key="ghostDragEffect" ${s.ghostDragEffect ? 'checked' : ''}>
                    <span>Opacity Feedback</span>
                </label>
                <label class="checkbox_label m-b-1">
                    <input type="checkbox" data-am-key="showToasts" ${s.showToasts ? 'checked' : ''}>
                    <span>Show Toast Notifications</span>
                </label>

                ${range('Zoom Speed (wheel)',       'zoomSpeed',         s.zoomSpeed,         0.05, 0.5,  0.05)}
                ${range('Rotation Threshold',      'rotationThreshold', s.rotationThreshold, 0.1,  0.95, 0.05)}

                ${isMobileDevice() ? `
                <hr style="margin:10px 0;opacity:0.3;">
                <div style="font-weight:bold;margin:6px 0 8px 0;">Mobile</div>
                <label class="checkbox_label m-b-1">
                    <input type="checkbox" data-am-key="enableMultiTouchRotate" ${s.enableMultiTouchRotate ? 'checked' : ''}>
                    <span>Two-Finger Rotate</span>
                </label>
                ${range('Two-Finger Rotate Speed', 'multiTouchRotateSpeed', s.multiTouchRotateSpeed, 0.25, 2, 0.05)}
                ${range('Zoom Step (buttons)',    'mobileZoomStep',        s.mobileZoomStep,        0.05, 0.5, 0.05)}
                ${range('Move Step (buttons, px)','mobileMoveStep',        s.mobileMoveStep,        5,    60,  5, true)}
                ${range('Rotate Step (buttons, °)','mobileRotateStep',     s.mobileRotateStep,      1,    45,  1, true)}
                ${range('Reset Y Bias (px, +=lower)','mobileYBias',        s.mobileYBias,           150, 500, 5, true)}
                ${range('Double-Tap Timeout (ms)','doubleTapTimeout',      s.doubleTapTimeout,      150,  600, 50, true)}
                ${range('Long-Press Duration (ms)','longPressDuration',    s.longPressDuration,     300, 1500, 50, true)}
                ` : ''}
            </div>
        </div>
    </div>`;
}

function range(label, key, value, min, max, step, integer = false) {
    return `
        <div class="flex-container m-b-1" style="flex-direction:column;gap:5px;">
            <label style="display:flex;justify-content:space-between;">
                <span>${label}</span>
                <span data-am-value="${key}">${integer ? value : Number(value).toFixed(2)}</span>
            </label>
            <input type="range" data-am-key="${key}" data-am-int="${integer ? 1 : 0}"
                   min="${min}" max="${max}" step="${step}" value="${value}" style="width:100%;">
        </div>`;
}

// Wire every input inside the settings panel back to `extension_settings`.
function bind(root) {
    const settings = getSettings();
    root.querySelectorAll('[data-am-key]').forEach((el) => {
        const key = el.dataset.amKey;
        const readValue = () => {
            if (el.type === 'checkbox') return el.checked;
            if (el.type === 'range' || el.type === 'number') {
                const num = el.dataset.amInt === '1' ? parseInt(el.value, 10) : parseFloat(el.value);
                return Number.isFinite(num) ? num : settings[key];
            }
            return el.value;
        };
        const eventName = el.type === 'range' ? 'input' : 'change';
        el.addEventListener(eventName, () => {
            settings[key] = readValue();
            // Live label for range inputs
            const label = root.querySelector(`[data-am-value="${key}"]`);
            if (label) label.textContent = el.dataset.amInt === '1' ? settings[key] : Number(settings[key]).toFixed(2);
            // Live side-effects
            if (key === 'zIndexMode') applyZIndexEverywhere();
            if (key === 'mobileYBias') {
                // Re-apply transform to every mounted avatar so the new bias
                // takes effect immediately.
                document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`).forEach((av) => {
                    readAvatar(av);
                    writeAvatar(av, { persist: false });
                });
            }
            saveSettings();
        });
    });
}

export function createSettingsUI() {
    whenPanelReady((panel) => {
        document.getElementById(CSS_CLASSES.SETTINGS_CONTAINER)?.remove();
        panel.insertAdjacentHTML('beforeend', html(getSettings()));
        const root = document.getElementById(CSS_CLASSES.SETTINGS_CONTAINER);
        if (root) bind(root);
    });
}

export function removeSettingsUI() {
    document.getElementById(CSS_CLASSES.SETTINGS_CONTAINER)?.remove();
}
