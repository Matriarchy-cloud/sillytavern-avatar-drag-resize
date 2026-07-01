// ============================================================================
//  Input - unified pointer / wheel / dblclick handler.
//
//  Uses Pointer Events for a single code path that supports mouse, pen and
//  touch. For two-finger pinch we fall back to the raw touch list (kept in
//  `touchState.touches`) because Pointer Events fire once per pointer.
// ============================================================================

import { dragState, touchState, intervals } from './shared/state.js';
import { CSS_CLASSES } from './shared/constants.js';
import { getSettings } from './shared/settings.js';
import { getAvatar, isExcludedTarget } from './shared/utils.js';
import { readAvatar, writeAvatar, resetAvatar } from './shared/avatar.js';
import { startDrag, updateDrag, endDrag } from './gestures/drag.js';
import { shouldRotate, startRotate, updateRotate, endRotate } from './gestures/rotate.js';
import { wheelZoom } from './gestures/zoom.js';
import { startPinch, updatePinch, endPinch } from './gestures/pinch.js';
import { handleDoubleTap, startLongPress, clearLongPress, markTouchMoved } from './gestures/tap.js';

// -------------------- helpers --------------------

function markActive(target) {
    document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`).forEach(el => el.classList.remove(CSS_CLASSES.ACTIVE));
    target.classList.add(CSS_CLASSES.ACTIVE);
}

function startDragOrRotate(e, target) {
    if (shouldRotate(e, target)) startRotate(e, target);
    else startDrag(e, target);
}

// -------------------- pointerdown --------------------

function onPointerDown(e) {
    if (!getSettings().enabled) return;
    const target = getAvatar(e.target);
    if (!target || isExcludedTarget(e.target)) return;

    markActive(target);
    dragState.target = target;
    readAvatar(target);

    if (e.pointerType === 'touch') {
        touchState.touches.set(e.pointerId, e);
        const size = touchState.touches.size;

        // Two-finger gesture -> pinch
        if (size === 2) {
            e.preventDefault();
            e.stopPropagation();
            clearLongPress();
            startPinch(target, [...touchState.touches.values()]);
            return;
        }

        // Single-finger -> long-press timer, double-tap check, then drag/rotate.
        if (size === 1) {
            e.preventDefault();
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
        startDragOrRotate(e, target);
        if (dragState.mode) {
            try { target.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        }
    }
}

// -------------------- pointermove --------------------

function onPointerMove(e) {
    if (!dragState.mode || !dragState.target) return;

    if (dragState.mode === 'drag' || dragState.mode === 'rotate') {
        markTouchMoved();
        clearLongPress();
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.pointerType === 'touch') touchState.touches.set(e.pointerId, e);

    if (intervals.animation) cancelAnimationFrame(intervals.animation);
    intervals.animation = requestAnimationFrame(() => {
        if (!dragState.target) { intervals.animation = null; return; }
        if (dragState.mode === 'drag') updateDrag(e);
        else if (dragState.mode === 'rotate') updateRotate(e, dragState.target);
        else if (dragState.mode === 'pinch') updatePinch([...touchState.touches.values()]);
        writeAvatar(dragState.target);
        intervals.animation = null;
    });
}

// -------------------- pointerup / pointercancel --------------------

function finishGesture() {
    if (dragState.mode === 'drag') endDrag(dragState.target);
    else if (dragState.mode === 'rotate') endRotate(dragState.target);
    else if (dragState.mode === 'pinch') endPinch(dragState.target);
    dragState.mode = null;
    dragState.target = null;
}

function onPointerUp(e) {
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
            finishGesture();
            touchState.touchMoved = false;
        }
        return;
    }

    if (!dragState.mode) return;
    if (intervals.animation) { cancelAnimationFrame(intervals.animation); intervals.animation = null; }
    if (dragState.target) {
        try { dragState.target.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    finishGesture();
}

function onPointerCancel(e) {
    clearLongPress();
    if (e.pointerType === 'touch') {
        touchState.touches.delete(e.pointerId);
        if (touchState.touches.size === 0) {
            finishGesture();
            touchState.touchMoved = false;
        }
        return;
    }
    if (dragState.target) {
        try { dragState.target.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    finishGesture();
}

// -------------------- wheel + dblclick --------------------

// Only preventDefault when the wheel is actually over an avatar - otherwise
// normal page scrolling must keep working.
function onWheel(e) {
    if (!getSettings().enabled) return;
    const target = getAvatar(e.target);
    if (!target || isExcludedTarget(e.target)) return;
    e.preventDefault();
    wheelZoom(target, e.deltaY);
}

function onDoubleClick(e) {
    if (!getSettings().enabled) return;
    const target = getAvatar(e.target);
    if (!target || isExcludedTarget(e.target)) return;
    e.preventDefault();
    resetAvatar(target);
}

// Clicking outside any avatar clears the "active" marker so mobile controls
// won't accidentally act on the last-touched avatar after another element
// was tapped.
function onTapOutside(e) {
    if (e.target.closest(`.${CSS_CLASSES.MOBILE_CONTROLS}, .${CSS_CLASSES.SETTINGS_CONTAINER}`)) return;
    if (!e.target.closest(`.${CSS_CLASSES.AVATAR}`)) {
        document.querySelectorAll(`.${CSS_CLASSES.AVATAR}.${CSS_CLASSES.ACTIVE}`)
            .forEach(el => el.classList.remove(CSS_CLASSES.ACTIVE));
    }
}

// -------------------- registration --------------------

// Wheel needs `passive: false` so we can preventDefault when appropriate.
const listeners = [
    ['pointerdown', onPointerDown, undefined],
    ['pointermove', onPointerMove, undefined],
    ['pointerup', onPointerUp, undefined],
    ['pointercancel', onPointerCancel, undefined],
    ['wheel', onWheel, { passive: false }],
    ['dblclick', onDoubleClick, undefined],
    ['touchstart', onTapOutside, { passive: true }],
    ['mousedown', onTapOutside, undefined],
];

export function registerInputHandlers() {
    listeners.forEach(([name, fn, opts]) => document.addEventListener(name, fn, opts));
}

export function unregisterInputHandlers() {
    listeners.forEach(([name, fn, opts]) => document.removeEventListener(name, fn, opts));
    clearLongPress();
}
