// Desktop event handlers - pointer events, wheel, double-click

import { dragState, intervals } from '../shared/state.js';
import { getAvatar, isExcludedTarget } from '../shared/utils.js';
import { getSettings } from '../shared/settings.js';
import { readAvatar, writeAvatar, resetAvatar } from '../core/avatar.js';
import { startDrag, updateDrag, endDrag } from '../core/drag.js';
import { shouldRotate, startRotate, updateRotate, endRotate } from '../core/rotate.js';
import { zoomAt } from '../core/zoom.js';

// Handle pointer down - start drag or rotate
function onPointerDown(e) {
    if (!getSettings().enabled) return;
    
    const target = getAvatar(e.target);
    if (!target || isExcludedTarget(e.target)) return;
    
    e.preventDefault();
    dragState.target = target;
    readAvatar(target);
    target.style.transition = 'none';
    
    if (shouldRotate(e, target)) {
        startRotate(e, target);
    } else {
        startDrag(e, target);
    }
    
    try {
        target.setPointerCapture(e.pointerId);
    } catch (err) {
        // Ignore pointer capture errors
    }
}

// Handle pointer move - update drag or rotate
function onPointerMove(e) {
    if (!dragState.mode || !dragState.target) return;
    e.preventDefault();
    
    if (intervals.animation) {
        cancelAnimationFrame(intervals.animation);
    }
    
    intervals.animation = requestAnimationFrame(() => {
        if (!dragState.target) return;
        if (dragState.mode === 'drag') {
            updateDrag(e);
        } else if (dragState.mode === 'rotate') {
            updateRotate(e);
        }
        writeAvatar(dragState.target);
        intervals.animation = null;
    });
}

// Handle pointer up - end current operation
function onPointerUp(e) {
    if (!dragState.mode || !dragState.target) return;
    
    if (intervals.animation) {
        cancelAnimationFrame(intervals.animation);
        intervals.animation = null;
    }
    
    try {
        dragState.target.releasePointerCapture(e.pointerId);
    } catch (err) {
        // Ignore
    }
    
    if (dragState.mode === 'drag') {
        endDrag(dragState.target);
    } else if (dragState.mode === 'rotate') {
        endRotate(dragState.target);
    }
    
    dragState.mode = null;
    dragState.target = null;
}

// Handle double-click - reset avatar to center
function onDoubleClick(e) {
    if (!getSettings().enabled) return;
    
    const target = getAvatar(e.target);
    if (!target || isExcludedTarget(e.target)) return;
    
    e.preventDefault();
    resetAvatar(target);
}

// Handle mouse wheel - simple zoom from center
function onWheel(e) {
    const settings = getSettings();
    if (!settings.enabled) return;
    
    const target = getAvatar(e.target);
    if (!target || isExcludedTarget(e.target)) return;
    
    e.preventDefault();
    zoomAt(target, e.deltaY);
}

// Handle window resize - reset avatar if it goes off-screen
let resizeTimer;
function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const avatar = document.querySelector('.zoomed_avatar');
        if (!avatar) return;
        
        const rect = avatar.getBoundingClientRect();
        const isOffScreen = rect.right < -50 || 
                           rect.left > window.innerWidth + 50 ||
                           rect.bottom < -50 || 
                           rect.top > window.innerHeight + 50;
        
        if (isOffScreen) {
            resetAvatar(avatar);
        }
    }, 250);
}

// Register all desktop event listeners
export function registerDesktop() {
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('dblclick', onDoubleClick);
    document.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);
    
    console.log('AvatarManip: Desktop events registered');
}