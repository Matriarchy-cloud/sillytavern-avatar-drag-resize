import { dragState } from '../shared/state.js';
import { readAvatar, writeAvatar, resetAvatar } from '../shared/avatar.js';
import { getSettings } from '../shared/settings.js';
import { getAvatar } from '../shared/utils.js';
import { LIMITS } from '../shared/constants.js';
import { clamp } from '../shared/utils.js';

export function onWheel(e) {
    const settings = getSettings();
    if (!settings.enabled) return;
    
    const target = getAvatar(e.target);
    if (!target) return;
    
    e.preventDefault();
    readAvatar(target);
    
    const delta = e.deltaY < 0 ? (settings.zoomSpeed || 0.1) : -(settings.zoomSpeed || 0.1);
    dragState.scale = clamp(dragState.scale + delta, LIMITS.SCALE_MIN, LIMITS.SCALE_MAX);
    writeAvatar(target);
}

export function onDoubleClick(e) {
    const settings = getSettings();
    if (!settings.enabled) return;
    
    const target = getAvatar(e.target);
    if (!target) return;
    
    e.preventDefault();
    resetAvatar(target);
}