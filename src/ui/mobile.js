// ============================================================================
//  UI - On-screen mobile controls (zoom/rotate/move/reset).
//  Uses native listeners on the container - jQuery delegation with mixed
//  touchstart/pointerdown can miss taps on some Android browsers.
// ============================================================================

import { CSS_CLASSES } from '../shared/constants.js';
import { intervals, dragState, rotationState } from '../shared/state.js';
import { getSettings } from '../shared/settings.js';
import { getActiveAvatar, isMobileDevice } from '../shared/utils.js';
import { readAvatar, writeAvatar, resetAvatar } from '../shared/avatar.js';
import { stepZoom } from '../gestures/zoom.js';

const REPEAT_MS = 90;

const BUTTONS = [
    { key: 'zoom-in',      icon: 'fa-magnifying-glass-plus',  label: 'Zoom In' },
    { key: 'zoom-out',     icon: 'fa-magnifying-glass-minus', label: 'Zoom Out' },
    { key: 'rotate-left',  icon: 'fa-rotate-left',            label: 'Rotate Left' },
    { key: 'rotate-right', icon: 'fa-rotate-right',           label: 'Rotate Right' },
    { key: 'move-up',      icon: 'fa-arrow-up',               label: 'Up',    span: 2 },
    { key: 'move-left',    icon: 'fa-arrow-left',             label: 'Left' },
    { key: 'move-right',   icon: 'fa-arrow-right',            label: 'Right' },
    { key: 'move-down',    icon: 'fa-arrow-down',             label: 'Down', span: 2 },
    { key: 'reset',        icon: 'fa-undo',                   label: 'Reset', span: 2, danger: true },
];

function buttonHTML(b) {
    const bg = b.danger ? '#ff6b6b' : 'var(--accent-color, #4a90e2)';
    const span = b.span ? `grid-column:span ${b.span};` : '';
    return `<button type="button" data-am-btn="${b.key}" class="mobile-control-btn"
        style="padding:14px;border:none;border-radius:8px;background:${bg};color:white;
               font-size:15px;cursor:pointer;touch-action:manipulation;${span}">
        <i class="fa-solid ${b.icon}"></i> ${b.label}
    </button>`;
}

function panelHTML() {
    return `
    <div id="${CSS_CLASSES.MOBILE_CONTROLS}" class="mobile-controls-drawer"
         style="margin-top:10px;user-select:none;-webkit-user-select:none;">
        <div data-am-toggle style="cursor:pointer;display:flex;justify-content:space-between;
             align-items:center;padding:10px;background:var(--secondary-color,#333);border-radius:8px;">
            <b><i class="fa-solid fa-mobile-screen-button"></i> Mobile Controls</b>
            <div data-am-chevron class="fa-solid fa-chevron-down"
                 style="font-size:1.2rem;transition:transform 0.15s ease;"></div>
        </div>
        <div data-am-content style="display:none;padding:10px;background:var(--secondary-color,#333);
             border-radius:8px;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:6px;">
            ${BUTTONS.map(buttonHTML).join('')}
        </div>
    </div>`;
}

// -------------------- button actions --------------------

function moveStep()   { return getSettings().mobileMoveStep   || 20; }
function rotateStep() { return getSettings().mobileRotateStep || 10; }

function performAction(key, target) {
    if (!target) return;
    readAvatar(target);
    switch (key) {
        case 'zoom-in':      stepZoom(target, +1); return;
        case 'zoom-out':     stepZoom(target, -1); return;
        case 'rotate-left':  rotationState.rotation -= rotateStep(); break;
        case 'rotate-right': rotationState.rotation += rotateStep(); break;
        case 'move-up':      dragState.y -= moveStep(); break;
        case 'move-down':    dragState.y += moveStep(); break;
        case 'move-left':    dragState.x -= moveStep(); break;
        case 'move-right':   dragState.x += moveStep(); break;
        default: return;
    }
    writeAvatar(target);
}

// -------------------- interval control --------------------

function stopRepeat(key) {
    if (intervals.mobile[key]) {
        clearInterval(intervals.mobile[key]);
        delete intervals.mobile[key];
    }
}

function stopAllRepeats() {
    Object.keys(intervals.mobile).forEach(stopRepeat);
}

// -------------------- binding --------------------

function bind(container) {
    const toggle = container.querySelector('[data-am-toggle]');
    const content = container.querySelector('[data-am-content]');
    const chevron = container.querySelector('[data-am-chevron]');

    toggle.addEventListener('click', () => {
        const open = content.style.display !== 'none';
        content.style.display = open ? 'none' : 'grid';
        chevron.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // A single delegated handler for all buttons. `touchstart` gives us the
    // fastest response on mobile; `pointerdown` covers stylus & desktop test.
    const start = (e) => {
        const btn = e.target.closest('button[data-am-btn]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();

        const key = btn.dataset.amBtn;
        if (key === 'reset') {
            const t = getActiveAvatar();
            if (t) resetAvatar(t);
            return;
        }

        const target = getActiveAvatar();
        performAction(key, target);
        stopRepeat(key);
        intervals.mobile[key] = setInterval(() => performAction(key, getActiveAvatar()), REPEAT_MS);
    };

    const stop = (e) => {
        const btn = e.target.closest('button[data-am-btn]');
        if (btn) stopRepeat(btn.dataset.amBtn);
        else stopAllRepeats();
    };

    content.addEventListener('touchstart', start, { passive: false });
    content.addEventListener('pointerdown', start);
    content.addEventListener('touchend', stop);
    content.addEventListener('touchcancel', stop);
    content.addEventListener('pointerup', stop);
    content.addEventListener('pointercancel', stop);
    content.addEventListener('pointerleave', stop);
    window.addEventListener('blur', stopAllRepeats);

    // Swallow the synthetic click that follows touchstart so the button
    // action does not fire twice.
    content.addEventListener('click', (e) => {
        if (e.target.closest('button[data-am-btn]')) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

// -------------------- lifecycle --------------------

function whenPanelReady(fn, attempts = 60) {
    const panel = document.getElementById('extensions_settings');
    if (panel) { fn(panel); return; }
    if (attempts <= 0) return;
    setTimeout(() => whenPanelReady(fn, attempts - 1), 500);
}

export function createMobileControls() {
    if (!isMobileDevice()) return;
    whenPanelReady((panel) => {
        document.getElementById(CSS_CLASSES.MOBILE_CONTROLS)?.remove();
        panel.insertAdjacentHTML('beforeend', panelHTML());
        const container = document.getElementById(CSS_CLASSES.MOBILE_CONTROLS);
        if (container) bind(container);
    });
}

export function removeMobileControls() {
    stopAllRepeats();
    document.getElementById(CSS_CLASSES.MOBILE_CONTROLS)?.remove();
}
