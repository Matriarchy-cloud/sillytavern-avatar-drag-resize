// ============================================================================
//  Multiple avatars - retain already-open native avatar nodes when another
//  chat avatar is selected. SillyTavern normally removes those nodes unless
//  its global Moving UI setting is enabled; this keeps the feature local to
//  Avatar Manipulator instead of changing that unrelated global preference.
// ============================================================================

import { CSS_CLASSES } from './shared/constants.js';
import { getSettings } from './shared/settings.js';

let registered = false;
let generation = 0;

function getClickedCharacterName(target) {
    const avatar = target.closest?.('.mes .avatar');
    const image = Array.from(avatar?.children ?? []).find((el) => el.tagName === 'IMG');
    const source = image?.getAttribute('src');
    if (!source) return null;

    // This intentionally mirrors SillyTavern's `charname` calculation so the
    // avatar being clicked still keeps its normal click-to-close behaviour.
    const avatarFile = source.slice(source.lastIndexOf('=') + 1);
    return avatarFile.replace('.png', '');
}

function onChatAvatarClick(e) {
    if (!getSettings().enabled || !getSettings().allowMultipleAvatars) return;
    if (!(e.target instanceof Element)) return;

    const characterName = getClickedCharacterName(e.target);
    if (characterName === null) return;

    const avatarsToRestore = Array.from(document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`))
        .filter((avatar) => avatar.getAttribute('forChar') !== characterName);
    if (avatarsToRestore.length === 0) return;

    const currentGeneration = generation;
    queueMicrotask(() => {
        if (currentGeneration !== generation || !getSettings().allowMultipleAvatars) return;

        avatarsToRestore.forEach((avatar) => {
            // SillyTavern removed this node while handling the click. Reattach
            // the original node so its transform and extension state survive.
            if (!avatar.isConnected) document.body.append(avatar);
        });
    });
}

export function registerMultipleAvatarSupport() {
    if (registered) return;
    registered = true;
    // Capture phase runs before SillyTavern's delegated document click handler.
    document.addEventListener('click', onChatAvatarClick, true);
}

export function unregisterMultipleAvatarSupport() {
    generation += 1;
    document.removeEventListener('click', onChatAvatarClick, true);
    registered = false;
}
