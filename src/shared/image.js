import { toast } from './utils.js';
import { CSS_CLASSES } from './constants.js';
import {
    getCustomImageSource,
    setCustomImageSource,
    clearCustomImageSource,
    getSettings,
} from './settings.js';
import {
    resolveSourceToUrl,
    sourceFromLocalFile,
} from './avatar-source.js';

const ORIGINAL_SRC_KEY = 'amOriginalSrc';
const IMAGE_OBSERVER_KEY = 'amImageObserver';
const IMAGE_RESETTING_KEY = 'amImageResetting';

const originalSourcesCache = new Map();

function getAvatarImageElements(el) {
    if (!el) return [];
    const imgs = Array.from(el.querySelectorAll('img'));
    const wrappers = Array.from(el.querySelectorAll('.zoomed_avatar_img'));
    return [...imgs, ...wrappers].filter(Boolean);
}

function getImageSourceValue(imageEl) {
    if (!imageEl) return null;
    if (imageEl.tagName === 'IMG') return imageEl.src || null;
    if (imageEl.hasAttribute('src')) return imageEl.getAttribute('src');
    const bg = imageEl.style.backgroundImage || getComputedStyle(imageEl).backgroundImage;
    return (bg && bg !== 'none') ? bg.slice(5, -2) : null;
}

function setImageSourceValue(imageEl, url) {
    if (!imageEl) return;
    if (imageEl.tagName === 'IMG') {
        imageEl.src = url;
        return;
    }
    if (imageEl.hasAttribute('src')) {
        imageEl.setAttribute('src', url);
        return;
    }
    imageEl.style.backgroundImage = `url("${url}")`;
}

function getCharacterKey(el) {
    return el ? (el.getAttribute('data-character-key') || el.id || 'default_avatar') : 'default_avatar';
}

function getOriginalSource(el) {
    const cacheKey = getCharacterKey(el);
    if (originalSourcesCache.has(cacheKey)) {
        return originalSourcesCache.get(cacheKey);
    }
    return (el && el.dataset && el.dataset[ORIGINAL_SRC_KEY]) ? el.dataset[ORIGINAL_SRC_KEY] : null;
}

function setOriginalSource(el, value) {
    if (!el || !value) return;
    el.dataset[ORIGINAL_SRC_KEY] = value;
    const cacheKey = getCharacterKey(el);
    if (!originalSourcesCache.has(cacheKey)) {
        originalSourcesCache.set(cacheKey, value);
    }
}

function forceLayoutRecalculation(imageEl) {
    if (!imageEl) return;
    window.dispatchEvent(new Event('resize'));
    if (imageEl.tagName === 'IMG') {
        const width = imageEl.clientWidth;
        imageEl.style.display = 'none';
        imageEl.offsetHeight;
        imageEl.style.display = 'block';
    }
}

function rememberOriginal(imageEl, el, customUrl) {
    if (!imageEl || !el) return;

    const existingOriginal = getOriginalSource(el) || imageEl.dataset[ORIGINAL_SRC_KEY];
    if (existingOriginal) {
        if (!imageEl.dataset[ORIGINAL_SRC_KEY]) {
            imageEl.dataset[ORIGINAL_SRC_KEY] = existingOriginal;
        }
        return;
    }

    const current = getImageSourceValue(imageEl);
    if (!current || current === customUrl) return;

    setOriginalSource(el, current);
    imageEl.dataset[ORIGINAL_SRC_KEY] = current;
}

function informIfEnabled(message) {
    if (getSettings().showToasts !== false) toast(message);
}

export function applyCustomImage(el) {
    if (!el) return;
    const source = getCustomImageSource(el);
    if (!source) return;
    const url = resolveSourceToUrl(source);
    if (!url) return;

    const imageEls = getAvatarImageElements(el);
    if (imageEls.length === 0) return;

    imageEls.forEach((imageEl) => {
        rememberOriginal(imageEl, el, url);
        const current = getImageSourceValue(imageEl);
        if (current !== url) {
            setImageSourceValue(imageEl, url);
            if (imageEl.tagName === 'IMG') {
                imageEl.addEventListener('load', () => forceLayoutRecalculation(imageEl), { once: true });
            }
        }
    });

    if (!el.dataset[IMAGE_OBSERVER_KEY]) {
        const observer = new MutationObserver(() => {
            requestAnimationFrame(() => {
                if (el.dataset[IMAGE_RESETTING_KEY]) return;

                const source = getCustomImageSource(el);
                if (!source) return;
                const currentUrl = resolveSourceToUrl(source);
                if (!currentUrl) return;
                getAvatarImageElements(el).forEach((latestEl) => {
                    const latest = getImageSourceValue(latestEl);
                    if (latest !== currentUrl) {
                        rememberOriginal(latestEl, el);
                        setImageSourceValue(latestEl, currentUrl);
                        if (latestEl.tagName === 'IMG') {
                            latestEl.addEventListener('load', () => forceLayoutRecalculation(latestEl), { once: true });
                        }
                    }
                });
            });
        });
        observer.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'style'] });
        el.dataset[IMAGE_OBSERVER_KEY] = '1';
    }
}

export function resetCustomImage(el) {
    if (!el) return;

    el.dataset[IMAGE_RESETTING_KEY] = '1';

    const originalSource = getOriginalSource(el);
    if (originalSource) {
        getAvatarImageElements(el).forEach((imageEl) => {
            setImageSourceValue(imageEl, originalSource);
            if (imageEl.tagName === 'IMG') {
                imageEl.addEventListener('load', () => forceLayoutRecalculation(imageEl), { once: true });
            }
        });
    }

    clearCustomImageSource(el);

    document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`).forEach((avatarEl) => {
        if (avatarEl !== el) {
            const extraOriginal = getOriginalSource(avatarEl);
            if (extraOriginal) {
                getAvatarImageElements(avatarEl).forEach((img) => {
                    setImageSourceValue(img, extraOriginal);
                    if (img.tagName === 'IMG') {
                        img.addEventListener('load', () => forceLayoutRecalculation(img), { once: true });
                    }
                });
            }
        }
    });

    setTimeout(() => {
        delete el.dataset[IMAGE_RESETTING_KEY];
    }, 200);

    informIfEnabled('Avatar image reset');
}

export async function pickAndApplyLocalImage(el) {
    if (!el) {
        toast('Open an avatar first');
        return;
    }

    const file = await pickImageFile();
    if (!file) return;

    try {
        const source = await sourceFromLocalFile(file);
        setCustomImageSource(el, source);
        applyCustomImage(el);
        requestAnimationFrame(() => applyCustomImage(el));
        setTimeout(() => applyCustomImage(el), 100);
        setTimeout(() => applyCustomImage(el), 300);
        document.querySelectorAll(`.${CSS_CLASSES.AVATAR}`).forEach(applyCustomImage);
        informIfEnabled('Avatar image updated');
    } catch (err) {
        if (err && err.code === 'IMAGE_TOO_LARGE') {
            toast('Image is too large (max 6 MB)');
        } else {
            toast('Could not read image');
        }
    }
}

function pickImageFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.position = 'fixed';
        input.style.top = '-10000px';
        input.style.left = '-10000px';
        document.body.appendChild(input);

        let settled = false;
        const done = (value) => {
            if (settled) return;
            settled = true;
            input.remove();
            resolve(value);
        };

        input.addEventListener('change', () => done(input.files ? input.files[0] : null), { once: true });
        input.addEventListener('cancel', () => done(null), { once: true });

        input.click();
    });
}