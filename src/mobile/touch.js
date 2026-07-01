// Mobile touch event handlers - unified pointer events for touch devices

import { dragState, rotationState, touchState, intervals } from '../shared/state.js';
import { getAvatar, isExcludedTarget } from '../shared/utils.js';
import { getSettings } from '../shared/settings.js';
import { readAvatar, writeAvatar } from '../core/avatar.js';
import { startDrag, updateDrag, endDrag } from '../core/drag.js';
import { shouldRotate, startRotate, updateRotate } from '../core/rotate.js';
import { startPinch, updatePinch, endPinch } from './pinch.js';
import { handleDoubleTap, startLongPress, clearLongPress, markTouchMoved } from './gestures.js';

// Handle pointer down - start drag, rotate, or pinch
function onPointerDown(e) {
    // MOBİL DÜZELTME: Kapatma butonları VEYA mobil kontrol panelindeki butonlara dokunulduysa dokunmatik sürüklemeyi tetikleme!
    if (e.target.closest('.dragClose, .zoom-cross, .avatar-close, .fa-times, .close-btn, .mobile-control-btn, .mobile-controls-toggle')) return;
    
    if (!getSettings().enabled) return;
    
    const target = getAvatar(e.target);
    if (!target || isExcludedTarget(e.target)) return;
    
    // Show close button on the tapped avatar
    document.querySelectorAll('.zoomed_avatar').forEach(el => el.classList.remove('active'));
    target.classList.add('active');
    
    if (e.pointerType === 'touch') {
        touchState.touches.set(e.pointerId, e);
        const size = touchState.touches.size;
        
        // Two fingers = pinch gesture
        if (size === 2) {
            clearLongPress();
            touchState.touchMoved = false;
            e.preventDefault();
            e.stopPropagation();
            dragState.target = target;
            startPinch(target, Array.from(touchState.touches.values()));
            return;
        }
        
        // One finger = drag or tap
        if (size === 1) {
            e.preventDefault();
            dragState.target = target;
            readAvatar(target);
            startLongPress(target);
            
            // Check for double-tap to reset
            if (handleDoubleTap(e, target)) {
                dragState.target = null;
                dragState.mode = null;
                return;
            }
            
            startDragOrRotate(e, target);
        }
    } else {
        // Non-touch pointer (stylus, etc.)
        e.preventDefault();
        dragState.target = target;
        readAvatar(target);
        target.style.transition = 'none';
        startDragOrRotate(e, target);
        if (dragState.mode) target.setPointerCapture(e.pointerId);
    }
}

// Decide between drag and rotate based on pointer position
function startDragOrRotate(e, target) {
    if (shouldRotate(e, target)) {
        startRotate(e, target);
    } else {
        startDrag(e, target);
    }
}

// Handle pointer move - update drag, rotate, or pinch
function onPointerMove(e) {
    if (!dragState.mode || !dragState.target) return;
    
    if (dragState.mode === 'drag' || dragState.mode === 'rotate') {
        markTouchMoved();
        clearLongPress();
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.pointerType === 'touch') {
        touchState.touches.set(e.pointerId, e);
    }
    
    if (intervals.animation) cancelAnimationFrame(intervals.animation);
    
    intervals.animation = requestAnimationFrame(() => {
        if (dragState.mode === 'drag') {
            updateDrag(e);
        } else if (dragState.mode === 'rotate') {
            updateRotate(e, dragState.target);
        } else if (dragState.mode === 'pinch') {
            updatePinch(Array.from(touchState.touches.values()));
        }
        
        if (dragState.target) writeAvatar(dragState.target);
        intervals.animation = null;
    });
}

// Handle pointer up - end current gesture
function onPointerUp(e) {
    clearLongPress();
    
    if (e.pointerType === 'touch') {
        touchState.touches.delete(e.pointerId);
        const size = touchState.touches.size;
        
        // End pinch when one finger lifts
        if (touchState.isPinching && size < 2) {
            endPinch(dragState.target);
            dragState.mode = null;
            dragState.target = null;
            return;
        }
        
        // End drag when all fingers lift
        if (size === 0) {
            endDrag(dragState.target);
            dragState.mode = null;
            dragState.target = null;
            touchState.touchMoved = false;
            return;
        }
        return;
    }
    
    if (!dragState.mode) return;
    
    if (intervals.animation) {
        cancelAnimationFrame(intervals.animation);
        intervals.animation = null;
    }
    
    if (dragState.target) {
        try { dragState.target.releasePointerCapture(e.pointerId); } catch (err) {}
        endDrag(dragState.target);
    }
    
    dragState.mode = null;
    dragState.target = null;
}

// Handle pointer cancel - clean up
function onPointerCancel(e) {
    clearLongPress();
    
    if (e.pointerType === 'touch') {
        touchState.touches.delete(e.pointerId);
        if (touchState.touches.size === 0 && dragState.target) {
            endDrag(dragState.target);
            dragState.mode = null;
            dragState.target = null;
            touchState.touchMoved = false;
        }
        return;
    }
    
    if (dragState.target) {
        try { dragState.target.releasePointerCapture(e.pointerId); } catch (err) {}
        endDrag(dragState.target);
    }
    dragState.mode = null;
    dragState.target = null;
}

// Hide close button when tapping outside the avatar
document.addEventListener('touchstart', function(e) {
    // MOBİL DÜZELTME: Menüye veya butonlara tıklandığında avatarın aktifliğini (.active class'ını) silme!
    if (e.target.closest('.mobile-controls-drawer, .mobile-control-btn, .mobile-controls-toggle')) return;

    if (!e.target.closest('.zoomed_avatar')) {
        document.querySelectorAll('.zoomed_avatar').forEach(el => el.classList.remove('active'));
    }
}, { passive: true });

// Register all mobile event listeners
export function registerMobile() {
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
    console.log('AvatarManip: Mobile ready');
}