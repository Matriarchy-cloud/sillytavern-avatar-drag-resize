import { getSettings } from '../shared/settings.js';
import { intervals } from '../shared/state.js';
import { readAvatar, writeAvatar, resetAvatar } from '../shared/avatar.js';
import { isMobileDevice, getActiveAvatar, clamp } from '../shared/utils.js';
import { LIMITS, CSS_CLASSES } from '../shared/constants.js';

export function createMobileControls() {
    if (!isMobileDevice()) return;
    
    const containerId = CSS_CLASSES.MOBILE_CONTROLS;
    document.getElementById(containerId)?.remove();

    const html = `
    <div id="${containerId}" class="mobile-controls-drawer" style="margin-top:10px;">
        <div class="mobile-controls-toggle" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--secondary-color);border-radius:8px;">
            <b><i class="fa-solid fa-mobile-screen-button"></i> Mobile Controls</b>
            <div class="mobile-controls-icon fa-solid fa-chevron-up interactable" style="font-size:1.2rem;"></div>
        </div>
        <div class="mobile-controls-content" style="display:none;padding:10px;background:var(--secondary-color);border-radius:8px;grid-template-columns:repeat(2,1fr);gap:8px;">
            <button id="am-zoom-in-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;">
                <i class="fa-solid fa-magnifying-glass-plus"></i> Zoom In
            </button>
            <button id="am-zoom-out-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;">
                <i class="fa-solid fa-magnifying-glass-minus"></i> Zoom Out
            </button>
            <button id="am-rotate-left-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;">
                <i class="fa-solid fa-rotate-left"></i> Rotate Left
            </button>
            <button id="am-rotate-right-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;">
                <i class="fa-solid fa-rotate-right"></i> Rotate Right
            </button>
            <button id="am-reset-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:#ff6b6b;color:white;font-size:18px;cursor:pointer;grid-column:span 2;">
                <i class="fa-solid fa-undo"></i> Reset Avatar
            </button>
            <button id="am-move-up-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;grid-column:span 2;">
                <i class="fa-solid fa-arrow-up"></i> Move Up
            </button>
            <button id="am-move-left-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;">
                <i class="fa-solid fa-arrow-left"></i> Left
            </button>
            <button id="am-move-right-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;">
                <i class="fa-solid fa-arrow-right"></i> Right
            </button>
            <button id="am-move-down-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;grid-column:span 2;">
                <i class="fa-solid fa-arrow-down"></i> Move Down
            </button>
        </div>
    </div>`;

    document.getElementById('extensions_settings')?.insertAdjacentHTML('beforeend', html);
    bindMobileEvents(containerId);
}

function bindMobileEvents(containerId) {
    const $container = $(`#${containerId}`);
    
    $container.find('.mobile-controls-toggle').on('click', function(e) {
        if (e.target.closest('button')) return;
        const $content = $container.find('.mobile-controls-content');
        const $icon = $container.find('.mobile-controls-icon');
        
        if ($content.is(':visible')) {
            $content.slideUp(150);
            $icon.css('transform', 'rotate(0deg)');
        } else {
            $content.slideDown(150);
            $content.css('display', 'grid');
            $icon.css('transform', 'rotate(180deg)');
        }
    });
    
    setupRepeatingButton('am-zoom-in-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); dragState.scale = clamp(dragState.scale + 0.15, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX); writeAvatar(t); }
    });
    setupRepeatingButton('am-zoom-out-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); dragState.scale = clamp(dragState.scale - 0.15, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX); writeAvatar(t); }
    });
    setupRepeatingButton('am-rotate-left-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); rotationState.rotation -= 15; writeAvatar(t); }
    });
    setupRepeatingButton('am-rotate-right-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); rotationState.rotation += 15; writeAvatar(t); }
    });
    setupRepeatingButton('am-move-up-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); dragState.y -= (settings.mobileMoveStep || 50); writeAvatar(t); }
    });
    setupRepeatingButton('am-move-down-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); dragState.y += (settings.mobileMoveStep || 50); writeAvatar(t); }
    });
    setupRepeatingButton('am-move-left-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); dragState.x -= (settings.mobileMoveStep || 50); writeAvatar(t); }
    });
    setupRepeatingButton('am-move-right-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); dragState.x += (settings.mobileMoveStep || 50); writeAvatar(t); }
    });
    
    $('#am-reset-btn').on('pointerdown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        resetAvatar();
    });
}

function setupRepeatingButton(id, action) {
    $('#' + id)
        .on('pointerdown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            action();
            intervals.mobile[id] = setInterval(action, 100);
        })
        .on('pointerup pointerleave pointercancel', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (intervals.mobile[id]) {
                clearInterval(intervals.mobile[id]);
                delete intervals.mobile[id];
            }
        })
        .on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
}

const settings = getSettings();