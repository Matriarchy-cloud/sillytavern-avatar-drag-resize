// Mobile controls UI - on-screen buttons for touch devices

import { getSettings } from '../shared/settings.js';
import { intervals, dragState, rotationState } from '../shared/state.js';
import { readAvatar, writeAvatar, resetAvatar } from '../core/avatar.js';
import { isMobileDevice, getActiveAvatar, clamp } from '../shared/utils.js';
import { LIMITS, CSS_CLASSES } from '../shared/constants.js';

// Create mobile control buttons in the extensions panel
export function createMobileControls() {
    if (!isMobileDevice()) return;
    
    const containerId = CSS_CLASSES.MOBILE_CONTROLS;
    document.getElementById(containerId)?.remove();

    const html = `
    <div id="${containerId}" class="mobile-controls-drawer" style="margin-top:10px; user-select:none; -webkit-user-select:none;">
        <div class="mobile-controls-toggle" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--secondary-color);border-radius:8px;">
            <b><i class="fa-solid fa-mobile-screen-button"></i> Mobile Controls</b>
            <div class="mobile-controls-icon fa-solid fa-chevron-up interactable" style="font-size:1.2rem;"></div>
        </div>
        <div class="mobile-controls-content" style="display:none;padding:10px;background:var(--secondary-color);border-radius:8px;grid-template-columns:repeat(2,1fr);gap:8px;">
            <button id="am-zoom-in-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:none;">
                <i class="fa-solid fa-magnifying-glass-plus"></i> Zoom In
            </button>
            <button id="am-zoom-out-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:none;">
                <i class="fa-solid fa-magnifying-glass-minus"></i> Zoom Out
            </button>
            <button id="am-rotate-left-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:none;">
                <i class="fa-solid fa-rotate-left"></i> Rotate Left
            </button>
            <button id="am-rotate-right-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:none;">
                <i class="fa-solid fa-rotate-right"></i> Rotate Right
            </button>
            <button id="am-reset-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:#ff6b6b;color:white;font-size:18px;cursor:pointer;grid-column:span 2;touch-action:none;">
                <i class="fa-solid fa-undo"></i> Reset Avatar
            </button>
            <button id="am-move-up-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;grid-column:span 2;touch-action:none;">
                <i class="fa-solid fa-arrow-up"></i> Move Up
            </button>
            <button id="am-move-left-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:none;">
                <i class="fa-solid fa-arrow-left"></i> Left
            </button>
            <button id="am-move-right-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:none;">
                <i class="fa-solid fa-arrow-right"></i> Right
            </button>
            <button id="am-move-down-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;grid-column:span 2;touch-action:none;">
                <i class="fa-solid fa-arrow-down"></i> Move Down
            </button>
        </div>
    </div>`;

    document.getElementById('extensions_settings')?.insertAdjacentHTML('beforeend', html);
    bindMobileEvents(containerId);
}

function bindMobileEvents(containerId) {
    const $container = $(`#${containerId}`);
    const settings = getSettings();
    
    // Toggle açılış kapanış paneli
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
    
    // Event Delegation kullanarak butonları bağladık (DOM gecikmelerinden etkilenmez)
    setupRepeatingButton($container, 'am-zoom-in-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); dragState.scale = clamp(dragState.scale + 0.05, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX); writeAvatar(t); }
    });
    
    setupRepeatingButton($container, 'am-zoom-out-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); dragState.scale = clamp(dragState.scale - 0.05, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX); writeAvatar(t); }
    });
    
    setupRepeatingButton($container, 'am-rotate-left-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); rotationState.rotation -= 5; writeAvatar(t); }
    });
    
    setupRepeatingButton($container, 'am-rotate-right-btn', () => {
        const t = getActiveAvatar();
        if (t) { readAvatar(t); rotationState.rotation += 5; writeAvatar(t); }
    });
    
    setupRepeatingButton($container, 'am-move-up-btn', () => {
        const t = getActiveAvatar();
        const step = settings.mobileMoveStep || 15; // Değerler daha akıcı olması için düşürüldü
        if (t) { readAvatar(t); dragState.y -= step; writeAvatar(t); }
    });
    
    setupRepeatingButton($container, 'am-move-down-btn', () => {
        const t = getActiveAvatar();
        const step = settings.mobileMoveStep || 15;
        if (t) { readAvatar(t); dragState.y += step; writeAvatar(t); }
    });
    
    setupRepeatingButton($container, 'am-move-left-btn', () => {
        const t = getActiveAvatar();
        const step = settings.mobileMoveStep || 15;
        if (t) { readAvatar(t); dragState.x -= step; writeAvatar(t); }
    });
    
    setupRepeatingButton($container, 'am-move-right-btn', () => {
        const t = getActiveAvatar();
        const step = settings.mobileMoveStep || 15;
        if (t) { readAvatar(t); dragState.x += step; writeAvatar(t); }
    });
    
    $container.on('pointerdown', '#am-reset-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const t = getActiveAvatar();
        if (t) {
            resetAvatar(t); 
        } else {
            resetAvatar();
        }
    }).on('click', '#am-reset-btn', function(e) {
        e.preventDefault();
    });
}

function setupRepeatingButton($container, id, action) {
    const selector = '#' + id;
    
    $container.on('pointerdown', selector, function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        action();
        
        if (intervals.mobile) {
            clearInterval(intervals.mobile[id]);
            intervals.mobile[id] = setInterval(action, 75);
        }
    });

    $container.on('pointerup pointerleave pointercancel', selector, function(e) {
        if (intervals.mobile && intervals.mobile[id]) {
            clearInterval(intervals.mobile[id]);
            delete intervals.mobile[id];
        }
    });

    $container.on('click', selector, function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
}