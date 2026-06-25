function initAvatarControl() {
    console.log('[+] Avatar Control: Safe Mode Loaded');

    let state = {
        x: 0,
        y: 0,
        scale: 1,
        target: null,
        dragging: false,
        startX: 0,
        startY: 0
    };

    const style = document.createElement('style');
    style.textContent = `
        .zoomed_avatar {
            cursor: grab !important;
            transform: translate(var(--avatar-x, 0px), var(--avatar-y, 0px))
                       scale(var(--avatar-scale, 1)) !important;
            transform-origin: center center !important;
            will-change: transform !important;
            user-select: none !important;
        }

        .zoomed_avatar.dragging {
            cursor: grabbing !important;
        }
    `;
    document.head.appendChild(style);

    function getAvatar(el) {
        return el?.closest?.('.zoomed_avatar');
    }

    function read(el) {
        state.x = parseFloat(el.dataset.avatarX || "0");
        state.y = parseFloat(el.dataset.avatarY || "0");
        state.scale = parseFloat(el.dataset.avatarScale || "1");
    }

    function write(el) {
        el.dataset.avatarX = state.x;
        el.dataset.avatarY = state.y;
        el.dataset.avatarScale = state.scale;

        el.style.setProperty('--avatar-x', state.x + 'px');
        el.style.setProperty('--avatar-y', state.y + 'px');
        el.style.setProperty('--avatar-scale', state.scale);
    }

    // DRAG START (SADECE avatar üstünde)
    document.addEventListener('pointerdown', (e) => {
        const target = getAvatar(e.target);
        if (!target) return;

        // UI kilitleme yok!
        state.target = target;
        state.dragging = true;

        read(target);

        state.startX = e.clientX - state.x;
        state.startY = e.clientY - state.y;

        target.classList.add('dragging');
    });

    // DRAG MOVE
    document.addEventListener('pointermove', (e) => {
        if (!state.dragging || !state.target) return;

        state.x = e.clientX - state.startX;
        state.y = e.clientY - state.startY;

        write(state.target);
    });

    // DRAG END
    document.addEventListener('pointerup', () => {
        if (!state.dragging) return;

        state.dragging = false;

        if (state.target) {
            state.target.classList.remove('dragging');
            write(state.target);
        }

        state.target = null;
    });

    // ZOOM (SADECE WHEEL + avatar üstü)
    document.addEventListener('wheel', (e) => {
        const target = getAvatar(e.target);
        if (!target) return;

        e.preventDefault();

        read(target);

        const zoomSpeed = 0.1;

        if (e.deltaY < 0) state.scale += zoomSpeed;
        else state.scale -= zoomSpeed;

        state.scale = Math.max(0.2, Math.min(8, state.scale));

        write(target);
    }, { passive: false });
}

jQuery(() => {
    initAvatarControl();
});