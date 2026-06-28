import { dragState } from '../shared/state.js';
import { readAvatar, writeAvatar } from '../shared/avatar.js';
import { getSettings } from '../shared/settings.js';

export function startDrag(e, target) {
    dragState.mode = 'drag';
    dragState.target = target;
    readAvatar(target);
    
    dragState.startX = e.clientX - dragState.x;
    dragState.startY = e.clientY - dragState.y;
    
    target.classList.add('dragging');
    target.style.transition = 'none';
    
    if (getSettings().ghostDragEffect) {
        target.style.opacity = '0.7';
    }
}

export function updateDrag(e) {
    dragState.x = e.clientX - dragState.startX;
    dragState.y = e.clientY - dragState.startY;
}

export function endDrag(target) {
    if (!target) return;
    
    target.classList.remove('dragging', 'rotating', 'pinching');
    target.style.opacity = '1';
    target.style.transition = '';
    writeAvatar(target);
}