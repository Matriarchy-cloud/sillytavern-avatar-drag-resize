import { AVATAR_SOURCE_KINDS, MAX_CUSTOM_IMAGE_BYTES } from './constants.js';

export function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error ?? new Error('Read failed'));
        reader.readAsDataURL(file);
    });
}

export async function sourceFromLocalFile(file) {
    if (!file) throw new Error('NO_FILE');
    if (file.size > MAX_CUSTOM_IMAGE_BYTES) {
        const err = new Error('IMAGE_TOO_LARGE');
        err.code = 'IMAGE_TOO_LARGE';
        throw err;
    }
    const data = await readAsDataUrl(file);
    return { kind: AVATAR_SOURCE_KINDS.DATA_URL, data };
}

export function normaliseSource(raw) {
    if (!raw) return null;
    if (typeof raw === 'string') {
        return { kind: AVATAR_SOURCE_KINDS.DATA_URL, data: raw };
    }
    if (typeof raw === 'object' && typeof raw.kind === 'string') {
        return raw;
    }
    return null;
}

export function resolveSourceToUrl(source) {
    if (!source) return null;
    
    const s = normaliseSource(source);
    if (!s) return null;

    switch (s.kind) {
        case AVATAR_SOURCE_KINDS.DATA_URL:
            return s.data ?? null;
        default:
            return null;
    }
}