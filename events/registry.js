import { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } from './pointer.js';
import { onTouchStart, onTouchMove } from './touch.js';
import { onWheel, onDoubleClick } from './wheel.js';
import { clearLongPress } from '../mobile/gestures.js';

export function registerAll() {
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('dblclick', onDoubleClick);
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
}

export function unregisterAll() {
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
    document.removeEventListener('wheel', onWheel);
    document.removeEventListener('dblclick', onDoubleClick);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    
    clearLongPress();
}