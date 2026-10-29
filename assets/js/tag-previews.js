export function initTagPreviews() {
    const tags = document.querySelector('.post-header-tags');
    if (!tags || !('showPopover' in HTMLElement.prototype)) return;

    const hover = matchMedia('(hover: hover) and (pointer: fine)');
    let active;
    let openTimer;
    let closeTimer;
    let warmUntil = 0;

    function cancelTimers() {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
    }

    function close() {
        cancelTimers();
        if (active) active.preview.hidePopover();
    }

    function position({ link, preview }) {
        const trigger = link.getBoundingClientRect();
        const gutter = 12;
        const gap = 8;
        preview.style.maxHeight = '';
        const width = preview.offsetWidth;
        const below = innerHeight - trigger.bottom - gap - gutter;
        const above = trigger.top - gap - gutter;
        const opensAbove = preview.offsetHeight > below && above > below;
        preview.style.maxHeight = `${Math.max(0, Math.min(420, opensAbove ? above : below))}px`;
        const left = Math.max(gutter, Math.min(trigger.left, document.documentElement.clientWidth - width - gutter));
        preview.style.left = `${left}px`;
        preview.style.top = `${opensAbove ? trigger.top - gap - preview.offsetHeight : trigger.bottom + gap}px`;
        preview.style.transformOrigin = `${Math.max(0, Math.min(width, trigger.left + trigger.width / 2 - left))}px ${opensAbove ? 'bottom' : 'top'}`;
    }

    function open(item, keyboard = false) {
        cancelTimers();
        if (active === item) {
            if (keyboard) item.preview.dataset.instant = '';
            return;
        }
        const instant = keyboard || Boolean(active) || Date.now() < warmUntil;
        close();
        item.preview.toggleAttribute('data-instant', instant);
        item.preview.showPopover({ source: item.link });
        position(item);
        active = item;
    }

    tags.querySelectorAll('.post-tag-link').forEach(link => {
        const preview = document.getElementById(link.dataset.tagPreview);
        if (!preview) return;
        const item = { link, preview };
        const owner = link.parentElement;
        link.setAttribute('aria-controls', preview.id);
        link.setAttribute('aria-expanded', 'false');

        preview.addEventListener('beforetoggle', event => {
            link.setAttribute('aria-expanded', String(event.newState === 'open'));
            if (event.newState === 'closed' && active === item) {
                active = undefined;
                warmUntil = Date.now() + 300;
            }
        });
        owner.addEventListener('pointerenter', event => {
            if (!hover.matches || event.pointerType === 'touch') return;
            cancelTimers();
            if (active === item) return;
            const delay = active || Date.now() < warmUntil ? 0 : 160;
            openTimer = setTimeout(() => open(item), delay);
        });
        const leave = event => {
            if (owner.contains(event.relatedTarget)) return;
            clearTimeout(openTimer);
            clearTimeout(closeTimer);
            if (owner.contains(document.activeElement)) return;
            closeTimer = setTimeout(() => {
                if (active === item) close();
            }, 160);
        };
        owner.addEventListener('pointerleave', leave);
        preview.addEventListener('pointerenter', cancelTimers);
        preview.addEventListener('pointerleave', leave);
        owner.addEventListener('focusin', event => {
            if (event.target.matches(':focus-visible')) open(item, true);
        });
        owner.addEventListener('focusout', event => {
            if (owner.contains(event.relatedTarget)) return;
            preview.dataset.instant = '';
            if (active === item) close();
        });
    });

    // The browser handles Escape and outside clicks; keep keyboard dismissal instant.
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' && event.key !== 'Tab') return;
        cancelTimers();
        if (active) active.preview.dataset.instant = '';
    });
    window.addEventListener('resize', () => { if (active) position(active); }, { passive: true });
    window.addEventListener('scroll', event => {
        if (active && !active.preview.contains(event.target)) close();
    }, { passive: true, capture: true });
    hover.addEventListener('change', close);
}
