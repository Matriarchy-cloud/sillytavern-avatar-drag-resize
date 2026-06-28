import { dragState, rotationState, touchState, intervals } from '../shared/state.js';
import { getAvatar, isExcludedTarget } from '../shared/utils.js';
import { getSettings } from '../shared/settings.js';
import { readAvatar, writeAvatar } from '../shared/avatar.js';
import { startDrag, updateDrag, endDrag } from '../core/drag.js';
import { shouldRotate, startRotate, updateRotate } from '../core/rotate.js';
import { startPinch, updatePinch, endPinch } from '../mobile/pinch.js';
import { handleDoubleTap, startLongPress, clearLongPress, markTouchMoved } from '../mobile/gestures.js';

export function onPointerDown(e) {
    if (!getSettings().enabled) return;
    
    const target = getAvatar(e.target);
    if (!target || isExcludedTarget(e.target)) return;
    
    if (e.pointerType === 'touch') {
        touchState.touches.set(e.pointerId, e);
        const size = touchState.touches.size;
        
        if (size === 2) {
            clearLongPress();
            touchState.touchMoved = false;
            e.preventDefault();
            e.stopPropagation();
            
            dragState.target = target;
            startPinch(target, Array.from(touchState.touches.values()));
            return;
        }
        
        if (size === 1) {
            e.preventDefault();
            dragState.target = target;
            readAvatar(target);
            startLongPress(target);
            
            if (handleDoubleTap(e, target)) {
                dragState.target = null;
                dragState.mode = null;
                return;
            }
            
            startDragOrRotate(e, target);
        }
    } else {
        e.preventDefault();
        dragState.target = target;
        readAvatar(target);
        target.style.transition = 'none';
        
        startDragOrRotate(e, target);
        
        if (dragState.mode) {
            target.setPointerCapture(e.pointerId);
        }
    }
}

function startDragOrRotate(e, target) {
    if (shouldRotate(e, target)) {
        startRotate(e, target);
    } else {
        startDrag(e, target);
    }
}

export function onPointerMove(e) {
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

export function onPointerUp(e) {
    clearLongPress();
    
    if (e.pointerType === 'touch') {
        touchState.touches.delete(e.pointerId);
        const size = touchState.touches.size;
        
        if (touchState.isPinching && size < 2) {
            endPinch(dragState.target);
            dragState.mode = null;
            dragState.target = null;
            return;
        }
        
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

export function onPointerCancel(e) {
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