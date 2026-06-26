import { saveSettingsDebounced } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';

const extName = 'avatar-manip';

const defaultSettings = {
    enabled: true,
    zIndexMode: 'aboveUI',
    zoomSpeed: 0.1,
    ghostDragEffect: true,
    enableRotation: true,
    rotationThreshold: 0.7,
    doubleTapTimeout: 300,
    longPressDuration: 600,
    enableMultiTouchRotate: true,
    multiTouchRotateSpeed: 1.0,
    mobileMoveStep: 50,
    mobileRotateStep: 15,
    mobileZoomStep: 0.15
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
    cleanupFunctions: [],
    initialPinchDistance: 0,
    initialPinchScale: 1,
    initialPinchAngle: 0,
    initialPinchRotation: 0,
    lastPinchCenter: null,
    isPinching: false,
    touches: new Map(),
    lastTapTime: 0,
    lastTapTarget: null,
    longPressTimer: null,
    touchStartTime: 0,
    touchMoved: false,
    pinchStartTime: 0
};

let animationFrameId = null;
let mobileControlIntervals = {};

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
           || (window.innerWidth <= 768);
}

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

function getActiveAvatar() {
    const avatars = document.querySelectorAll('.zoomed_avatar');
    if (dragState.target && document.contains(dragState.target)) {
        return dragState.target;
    }
    return avatars[0] || null;
}

function readAvatar(el) {
    if (!el) return;
    
    try {
        dragState.x = parseFloat(el.dataset.x) || 0;
        dragState.y = parseFloat(el.dataset.y) || 0;
        dragState.scale = parseFloat(el.dataset.scale) || 1;
        dragState.rotation = parseFloat(el.dataset.rotation) || 0;
    } catch (error) {
        console.error('AvatarManip: readAvatar failed', error);
        dragState.x = 0;
        dragState.y = 0;
        dragState.scale = 1;
        dragState.rotation = 0;
    }
}

function writeAvatar(el) {
    if (!el) return;
    
    try {
        const x = Number(dragState.x) || 0;
        const y = Number(dragState.y) || 0;
        const scale = Number(dragState.scale) || 1;
        const rotation = Number(dragState.rotation) || 0;
        
        const safeScale = Math.max(0.1, Math.min(8, scale));
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        
        dragState.x = x;
        dragState.y = y;
        dragState.scale = safeScale;
        dragState.rotation = normalizedRotation;
        
        el.dataset.x = x;
        el.dataset.y = y;
        el.dataset.scale = safeScale;
        el.dataset.rotation = normalizedRotation;
        
        el.style.setProperty('--avatar-x', x + 'px');
        el.style.setProperty('--avatar-y', y + 'px');
        el.style.setProperty('--avatar-scale', safeScale.toString());
        el.style.setProperty('--avatar-rotate', normalizedRotation + 'deg');
        el.style.setProperty('--avatar-inverse-scale', (1 / safeScale).toString());
        
    } catch (error) {
        console.error('AvatarManip: writeAvatar failed', error);
    }
}

function resetAvatar(el) {
    if (!el) el = getActiveAvatar();
    if (!el) return;
    
    dragState.x = 0;
    dragState.y = 0;
    dragState.scale = 1;
    dragState.rotation = 0;
    writeAvatar(el);
    
    el.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => {
        el.style.transition = '';
    }, 300);
    
    if (typeof toastr !== 'undefined') {
        toastr.info('Avatar reset', '', { timeOut: 1000 });
    }
}

function moveAvatar(dx, dy) {
    const target = getActiveAvatar();
    if (!target) return;
    
    readAvatar(target);
    dragState.x += dx;
    dragState.y += dy;
    writeAvatar(target);
}

function zoomAvatar(direction) {
    const target = getActiveAvatar();
    if (!target) return;
    
    readAvatar(target);
    const step = settings.mobileZoomStep || 0.15;
    
    if (direction === 'in') {
        dragState.scale += step;
    } else {
        dragState.scale -= step;
    }
    
    dragState.scale = Math.max(0.1, Math.min(8, dragState.scale));
    writeAvatar(target);
    
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

function rotateAvatar(direction) {
    const target = getActiveAvatar();
    if (!target) return;
    
    readAvatar(target);
    const step = settings.mobileRotateStep || 15;
    
    if (direction === 'left') {
        dragState.rotation -= step;
    } else {
        dragState.rotation += step;
    }
    
    writeAvatar(target);
    
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

function startContinuousAction(action, ...args) {
    stopContinuousAction(action);
    action(...args);
    
    mobileControlIntervals[action.name] = setInterval(() => {
        action(...args);
    }, 100);
}

function stopContinuousAction(action) {
    if (mobileControlIntervals[action.name]) {
        clearInterval(mobileControlIntervals[action.name]);
        delete mobileControlIntervals[action.name];
    }
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

function getPinchDistance(touches) {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
}

function getPinchAngle(touches) {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.atan2(dy, dx);
}

function getPinchCenter(touches) {
    if (touches.length < 2) return null;
    return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
    };
}

function handleDoubleTap(e) {
    const target = getAvatar(e.target);
    if (!target) return;
    
    const currentTime = Date.now();
    const tapTimeout = settings.doubleTapTimeout || 300;
    
    if (target === dragState.lastTapTarget && 
        currentTime - dragState.lastTapTime < tapTimeout) {
        
        e.preventDefault();
        e.stopPropagation();
        resetAvatar(target);
        
        dragState.lastTapTime = 0;
        dragState.lastTapTarget = null;
        
        return true;
    }
    
    dragState.lastTapTime = currentTime;
    dragState.lastTapTarget = target;
    
    return false;
}

function startLongPress(e, target) {
    if (!target) return;
    
    if (dragState.longPressTimer) {
        clearTimeout(dragState.longPressTimer);
    }
    
    dragState.touchStartTime = Date.now();
    dragState.touchMoved = false;
    
    dragState.longPressTimer = setTimeout(() => {
        if (!dragState.touchMoved && dragState.target === target && !dragState.isPinching) {
            resetAvatar(target);
            
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }, settings.longPressDuration || 600);
}

function stopLongPress() {
    if (dragState.longPressTimer) {
        clearTimeout(dragState.longPressTimer);
        dragState.longPressTimer = null;
    }
}

function startPinchGesture(target, touches) {
    dragState.mode = 'pinch';
    dragState.initialPinchDistance = getPinchDistance(touches);
    dragState.initialPinchScale = dragState.scale;
    dragState.initialPinchAngle = getPinchAngle(touches);
    dragState.initialPinchRotation = dragState.rotation;
    dragState.isPinching = true;
    dragState.pinchStartTime = Date.now();
    
    target.classList.add('pinching');
    target.style.transition = 'none';
    
    if (settings.ghostDragEffect) {
        target.style.opacity = '0.8';
    }
}

function updatePinchGesture(touches) {
    if (!dragState.isPinching || touches.length < 2) return;
    
    const currentDistance = getPinchDistance(touches);
    const currentAngle = getPinchAngle(touches);
    
    if (dragState.initialPinchDistance > 0 && currentDistance > 0) {
        const scaleFactor = currentDistance / dragState.initialPinchDistance;
        dragState.scale = Math.max(0.1, Math.min(8, dragState.initialPinchScale * scaleFactor));
    }
    
    if (settings.enableRotation && settings.enableMultiTouchRotate !== false) {
        let angleDiff = currentAngle - dragState.initialPinchAngle;
        
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const rotationSpeed = settings.multiTouchRotateSpeed || 1.0;
        dragState.rotation = dragState.initialPinchRotation + (angleDiff * (180 / Math.PI) * rotationSpeed);
    }
}

function handlePointerDown(e) {
    if (!settings.enabled) return;
    
    const target = getAvatar(e.target);
    if (!target) return;
    
    if (e.target.closest('.dragClose, .zoom-cross, .avatar-close, .close-btn, .fa-times')) return;
    
    if (e.pointerType === 'touch') {
        dragState.touches.set(e.pointerId, e);
        
        if (dragState.touches.size === 2) {
            stopLongPress();
            dragState.touchMoved = false;
            
            const touches = Array.from(dragState.touches.values());
            e.preventDefault();
            e.stopPropagation();
            
            dragState.target = target;
            readAvatar(target);
            startPinchGesture(target, touches);
            return;
        }
        
        if (dragState.touches.size === 1) {
            e.preventDefault();
            dragState.target = target;
            readAvatar(target);
            
            startLongPress(e, target);
            
            const isDoubleTap = handleDoubleTap(e);
            if (isDoubleTap) {
                dragState.target = null;
                dragState.mode = null;
                return;
            }
            
            const rect = target.getBoundingClientRect();
            const radius = Math.min(rect.width, rect.height) / 2;
            const dist = getDistanceFromCenter(e.clientX, e.clientY, rect);
            const threshold = settings.rotationThreshold || 0.7;
            
            target.style.transition = 'none';
            
            if (settings.enableRotation && dist > radius * threshold) {
                dragState.mode = 'rotate';
                dragState.lastAngle = getAngleFromCenter(e.clientX, e.clientY, rect);
                target.classList.add('rotating');
                if (settings.ghostDragEffect) {
                    target.style.opacity = '0.9';
                }
            } else {
                dragState.mode = 'drag';
                dragState.startX = e.clientX - dragState.x;
                dragState.startY = e.clientY - dragState.y;
                target.classList.add('dragging');
                if (settings.ghostDragEffect) {
                    target.style.opacity = '0.7';
                }
            }
        }
    } else {
        e.preventDefault();
        dragState.target = target;
        readAvatar(target);
        
        const rect = target.getBoundingClientRect();
        const radius = Math.min(rect.width, rect.height) / 2;
        const dist = getDistanceFromCenter(e.clientX, e.clientY, rect);
        const threshold = settings.rotationThreshold || 0.7;
        
        target.style.transition = 'none';
        
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
}

function handlePointerMove(e) {
    if (!dragState.mode || !dragState.target) return;
    
    if (dragState.mode === 'drag' || dragState.mode === 'rotate') {
        dragState.touchMoved = true;
        stopLongPress();
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.pointerType === 'touch') {
        dragState.touches.set(e.pointerId, e);
    }
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    animationFrameId = requestAnimationFrame(() => {
        const { mode, target } = dragState;
        
        if (mode === 'drag') {
            dragState.x = e.clientX - dragState.startX;
            dragState.y = e.clientY - dragState.startY;
        } else if (mode === 'rotate') {
            const rect = target.getBoundingClientRect();
            const currentAngle = getAngleFromCenter(e.clientX, e.clientY, rect);
            
            let angleDiff = currentAngle - dragState.lastAngle;
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            dragState.rotation += angleDiff * (180 / Math.PI);
            dragState.lastAngle = currentAngle;
        } else if (mode === 'pinch') {
            const touches = Array.from(dragState.touches.values());
            updatePinchGesture(touches);
        }
        
        writeAvatar(dragState.target);
        animationFrameId = null;
    });
}

function handlePointerUp(e) {
    stopLongPress();
    
    if (e.pointerType === 'touch') {
        dragState.touches.delete(e.pointerId);
        
        if (dragState.isPinching && dragState.touches.size < 2) {
            if (dragState.target) {
                dragState.target.classList.remove('pinching');
                dragState.target.style.opacity = '1';
                dragState.target.style.transition = '';
                writeAvatar(dragState.target);
            }
            dragState.mode = null;
            dragState.target = null;
            dragState.isPinching = false;
            dragState.initialPinchDistance = 0;
            dragState.initialPinchAngle = 0;
            return;
        }
        
        if (dragState.touches.size === 0) {
            if (dragState.target) {
                dragState.target.classList.remove('dragging', 'rotating', 'pinching');
                dragState.target.style.opacity = '1';
                dragState.target.style.transition = '';
                writeAvatar(dragState.target);
            }
            dragState.mode = null;
            dragState.target = null;
            dragState.isPinching = false;
            dragState.touchMoved = false;
            return;
        }
        
        if (dragState.touches.size === 1 && dragState.isPinching) {
            const touches = Array.from(dragState.touches.values());
            dragState.initialPinchDistance = 0;
            dragState.initialPinchScale = dragState.scale;
            dragState.initialPinchAngle = getPinchAngle(touches);
            dragState.initialPinchRotation = dragState.rotation;
        }
        
        return;
    }
    
    if (!dragState.mode) return;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    if (dragState.target) {
        dragState.target.classList.remove('dragging', 'rotating', 'pinching');
        dragState.target.style.opacity = '1';
        dragState.target.style.transition = '';
        try {
            dragState.target.releasePointerCapture(e.pointerId);
        } catch (err) {}
        writeAvatar(dragState.target);
    }
    
    dragState.mode = null;
    dragState.target = null;
}

function handlePointerCancel(e) {
    stopLongPress();
    
    if (e.pointerType === 'touch') {
        dragState.touches.delete(e.pointerId);
        if (dragState.touches.size === 0 && dragState.target) {
            dragState.target.classList.remove('dragging', 'rotating', 'pinching');
            dragState.target.style.opacity = '1';
            dragState.target.style.transition = '';
            dragState.mode = null;
            dragState.target = null;
            dragState.isPinching = false;
            dragState.touchMoved = false;
        }
        return;
    }
    
    if (dragState.target) {
        dragState.target.classList.remove('dragging', 'rotating', 'pinching');
        dragState.target.style.opacity = '1';
        dragState.target.style.transition = '';
        try {
            dragState.target.releasePointerCapture(e.pointerId);
        } catch (err) {}
    }
    dragState.mode = null;
    dragState.target = null;
    dragState.isPinching = false;
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

function handleTouchStart(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
    }
}

function handleTouchMove(e) {
    if (dragState.isPinching || (e.touches && e.touches.length === 2 && dragState.target)) {
        e.preventDefault();
        e.stopPropagation();
    }
}

function handleTouchEnd(e) {
    if (dragState.isPinching && e.touches.length < 2) {
        e.preventDefault();
        e.stopPropagation();
    }
}

function handleGestureStart(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleGestureChange(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleGestureEnd(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDoubleClick(e) {
    if (!settings.enabled) return;
    
    const target = getAvatar(e.target);
    if (!target) return;
    
    e.preventDefault();
    resetAvatar(target);
}

function updateZIndexOnly(mode) {
    const zIndex = getZIndexValue(mode);
    
    document.querySelectorAll('.zoomed_avatar').forEach(el => {
        el.style.setProperty('z-index', zIndex, 'important');
    });
    
    document.documentElement.style.setProperty('--avatar-z-index', zIndex);
}

function updateGhostEffect() {
    document.querySelectorAll('.zoomed_avatar.dragging, .zoomed_avatar.rotating, .zoomed_avatar.pinching').forEach(el => {
        if (settings.ghostDragEffect) {
            if (el.classList.contains('dragging')) el.style.opacity = '0.7';
            if (el.classList.contains('rotating')) el.style.opacity = '0.9';
            if (el.classList.contains('pinching')) el.style.opacity = '0.8';
        } else {
            el.style.opacity = '1';
        }
    });
}

function createMobileControls() {
    if (!isMobileDevice()) return;
    
    const containerId = 'avatarmanip-mobile-controls';
    $(`#${containerId}`).remove();
    
    const html = `
    <div id="${containerId}" class="mobile-controls-drawer">
        <div class="mobile-controls-toggle" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--secondary-color);border-radius:8px;margin-bottom:10px;">
            <b style="font-size:var(--main-text-size);color:var(--text-color);">
                <i class="fa-solid fa-mobile-screen-button"></i> Mobile Controls
            </b>
            <div class="mobile-controls-icon fa-solid fa-chevron-up interactable" tabindex="0" style="font-size:1.2rem;transition:transform 0.3s ease;"></div>
        </div>
        <div class="mobile-controls-content" style="padding:10px;background:var(--secondary-color);border-radius:8px;display:none;grid-template-columns:repeat(2,1fr);gap:8px;">
            <button id="am-zoom-in-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;">
                <i class="fa-solid fa-magnifying-glass-plus"></i> Zoom In
            </button>
            <button id="am-zoom-out-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;">
                <i class="fa-solid fa-magnifying-glass-minus"></i> Zoom Out
            </button>
            <button id="am-rotate-left-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;">
                <i class="fa-solid fa-rotate-left"></i> Rotate Left
            </button>
            <button id="am-rotate-right-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;">
                <i class="fa-solid fa-rotate-right"></i> Rotate Right
            </button>
            <button id="am-reset-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:#ff6b6b;color:white;font-size:18px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;grid-column:span 2;">
                <i class="fa-solid fa-undo"></i> Reset Avatar
            </button>
            <button id="am-move-up-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;grid-column:span 2;">
                <i class="fa-solid fa-arrow-up"></i> Move Up
            </button>
            <button id="am-move-left-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;">
                <i class="fa-solid fa-arrow-left"></i> Left
            </button>
            <button id="am-move-right-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;">
                <i class="fa-solid fa-arrow-right"></i> Right
            </button>
            <button id="am-move-down-btn" class="mobile-control-btn" style="padding:15px;border:none;border-radius:8px;background:var(--accent-color);color:white;font-size:18px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;grid-column:span 2;">
                <i class="fa-solid fa-arrow-down"></i> Move Down
            </button>
        </div>
    </div>`;
    
    $('#extensions_settings').append(html);
    
    const $container = $(`#${containerId}`);
    const $toggle = $container.find('.mobile-controls-toggle');
    const $content = $container.find('.mobile-controls-content');
    const $icon = $container.find('.mobile-controls-icon');
    
    $toggle.on('click', function(e) {
        if (e.target.closest('button')) return;
        e.preventDefault();
        e.stopPropagation();
        
        if ($content.is(':visible')) {
            $content.slideUp(150);
            $icon.css('transform', 'rotate(0deg)');
        } else {
            $content.slideDown(150);
            $icon.css('transform', 'rotate(180deg)');
        }
    });
    
    const setupButton = (id, action, ...args) => {
        const $btn = $(`#${id}`);
        
        $btn.on('pointerdown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            startContinuousAction(action, ...args);
        });
        
        $btn.on('pointerup pointerleave pointercancel', function(e) {
            e.preventDefault();
            e.stopPropagation();
            stopContinuousAction(action);
        });
        
        $btn.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
    };
    
    setupButton('am-zoom-in-btn', zoomAvatar, 'in');
    setupButton('am-zoom-out-btn', zoomAvatar, 'out');
    setupButton('am-rotate-left-btn', rotateAvatar, 'left');
    setupButton('am-rotate-right-btn', rotateAvatar, 'right');
    setupButton('am-move-up-btn', moveAvatar, 0, -(settings.mobileMoveStep || 50));
    setupButton('am-move-down-btn', moveAvatar, 0, (settings.mobileMoveStep || 50));
    setupButton('am-move-left-btn', moveAvatar, -(settings.mobileMoveStep || 50), 0);
    setupButton('am-move-right-btn', moveAvatar, (settings.mobileMoveStep || 50), 0);
    
    $('#am-reset-btn').on('pointerdown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        resetAvatar();
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
    });
    
    return $container;
}

function createUI() {
    const containerId = 'avatarmanip-container';
    $(`#${containerId}`).remove();

    const mobileOnlySettings = isMobileDevice() ? `
        <div class="flex-container m-b-1" style="display:flex;align-items:center;margin-bottom:10px;">
            <label class="checkbox_label" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                <input type="checkbox" id="am_enableMultiTouchRotate" ${settings.enableMultiTouchRotate !== false ? 'checked' : ''}>
                Multi-Touch Rotate (Pinch + Rotate)
            </label>
        </div>

        <div class="flex-container m-b-1" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
            <label style="display:flex;justify-content:space-between;">
                <span>Multi-Touch Rotate Speed</span>
                <span id="am_multiTouchRotateSpeedValue">${settings.multiTouchRotateSpeed || 1.0}</span>
            </label>
            <input type="range" id="am_multiTouchRotateSpeed" min="0.5" max="3.0" step="0.1" value="${settings.multiTouchRotateSpeed || 1.0}" style="width:100%;">
        </div>

        <div class="flex-container m-b-1" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
            <label style="display:flex;justify-content:space-between;">
                <span>Mobile Move Step (px)</span>
                <span id="am_mobileMoveStepValue">${settings.mobileMoveStep || 50}</span>
            </label>
            <input type="range" id="am_mobileMoveStep" min="10" max="200" step="10" value="${settings.mobileMoveStep || 50}" style="width:100%;">
        </div>

        <div class="flex-container m-b-1" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
            <label style="display:flex;justify-content:space-between;">
                <span>Mobile Rotate Step (°)</span>
                <span id="am_mobileRotateStepValue">${settings.mobileRotateStep || 15}</span>
            </label>
            <input type="range" id="am_mobileRotateStep" min="5" max="90" step="5" value="${settings.mobileRotateStep || 15}" style="width:100%;">
        </div>

        <div class="flex-container m-b-1" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
            <label style="display:flex;justify-content:space-between;">
                <span>Double-Tap Timeout (ms)</span>
                <span id="am_doubleTapTimeoutValue">${settings.doubleTapTimeout || 300}</span>
            </label>
            <input type="range" id="am_doubleTapTimeout" min="200" max="500" step="50" value="${settings.doubleTapTimeout || 300}" style="width:100%;">
        </div>

        <div class="flex-container m-b-1" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
            <label style="display:flex;justify-content:space-between;">
                <span>Long Press Duration (ms)</span>
                <span id="am_longPressDurationValue">${settings.longPressDuration || 600}</span>
            </label>
            <input type="range" id="am_longPressDuration" min="400" max="1000" step="50" value="${settings.longPressDuration || 600}" style="width:100%;">
        </div>
    ` : '';

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
                    <label>Zoom Speed</label>
                    <input type="number" id="am_zoomSpeed" class="text_pole" min="0.05" max="0.5" step="0.05" value="${settings.zoomSpeed || 0.1}" style="width:100%;padding:5px;">
                </div>

                <div class="flex-container m-b-1" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
                    <label style="display:flex;justify-content:space-between;">
                        <span>Rotation Threshold</span>
                        <span id="am_rotationThresholdValue">${settings.rotationThreshold || 0.7}</span>
                    </label>
                    <input type="range" id="am_rotationThreshold" min="0.5" max="0.95" step="0.05" value="${settings.rotationThreshold || 0.7}" style="width:100%;">
                </div>

                ${mobileOnlySettings}
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

    if (isMobileDevice()) {
        $('#am_enableMultiTouchRotate').off('change').on('change', function(e) {
            e.stopPropagation();
            settings.enableMultiTouchRotate = this.checked;
            saveSettingsDebounced();
        });

        $('#am_multiTouchRotateSpeed').off('input').on('input', function(e) {
            e.stopPropagation();
            let val = parseFloat(this.value);
            settings.multiTouchRotateSpeed = val;
            $('#am_multiTouchRotateSpeedValue').text(val.toFixed(1));
            saveSettingsDebounced();
        });

        $('#am_mobileMoveStep').off('input').on('input', function(e) {
            e.stopPropagation();
            let val = parseInt(this.value);
            settings.mobileMoveStep = val;
            $('#am_mobileMoveStepValue').text(val);
            saveSettingsDebounced();
        });

        $('#am_mobileRotateStep').off('input').on('input', function(e) {
            e.stopPropagation();
            let val = parseInt(this.value);
            settings.mobileRotateStep = val;
            $('#am_mobileRotateStepValue').text(val);
            saveSettingsDebounced();
        });

        $('#am_doubleTapTimeout').off('input').on('input', function(e) {
            e.stopPropagation();
            let val = parseInt(this.value);
            settings.doubleTapTimeout = val;
            $('#am_doubleTapTimeoutValue').text(val);
            saveSettingsDebounced();
        });

        $('#am_longPressDuration').off('input').on('input', function(e) {
            e.stopPropagation();
            let val = parseInt(this.value);
            settings.longPressDuration = val;
            $('#am_longPressDurationValue').text(val);
            saveSettingsDebounced();
        });
    }

    return $container;
}

function regenerateExtension() {
    cleanup();
    init();
}

function cleanup() {
    stopLongPress();
    
    Object.keys(mobileControlIntervals).forEach(key => {
        clearInterval(mobileControlIntervals[key]);
    });
    mobileControlIntervals = {};
    
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
    document.removeEventListener('touchstart', handleTouchStart, { passive: false });
    document.removeEventListener('touchmove', handleTouchMove, { passive: false });
    document.removeEventListener('touchend', handleTouchEnd, { passive: false });
    document.removeEventListener('gesturestart', handleGestureStart);
    document.removeEventListener('gesturechange', handleGestureChange);
    document.removeEventListener('gestureend', handleGestureEnd);
    
    $('#avatarmanip-container').remove();
    $('#avatarmanip-mobile-controls').remove();
    dragState.cleanupFunctions.forEach(fn => { try { fn(); } catch(e) {} });
    dragState.cleanupFunctions = [];
    
    dragState.touches.clear();
    dragState.isPinching = false;
    dragState.lastTapTime = 0;
    dragState.lastTapTarget = null;
}

function initEventListeners() {
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('gesturestart', handleGestureStart);
    document.addEventListener('gesturechange', handleGestureChange);
    document.addEventListener('gestureend', handleGestureEnd);
}

async function init() {
    try {
        createUI();
        createMobileControls();
        initEventListeners();
        updateZIndexOnly(settings.zIndexMode || 'aboveUI');
        console.log("AvatarManip initialized successfully");
    } catch (err) {
        console.error("AvatarManip initialization failed:", err);
    }
}

jQuery(async () => {
    await init();
});

export { cleanup };

window.AvatarManip = window.AvatarManip || {};
window.AvatarManip.cleanup = cleanup;
window.AvatarManip.regenerate = regenerateExtension;