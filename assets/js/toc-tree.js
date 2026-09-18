// The scale is decorative. Native heading links remain the navigation source.
export function initTreeToc(inner, entries, getActiveLink) {
    const toc = inner.closest('details');
    const scale = document.createElement('div');
    scale.className = 'toc-tree-scale';
    scale.setAttribute('aria-hidden', 'true');
    const dot = document.createElement('img');
    dot.src = inner.dataset.tocTreeIcon;
    dot.alt = '';
    dot.width = 16;
    dot.height = 16;
    dot.className = 'toc-tree-dot';
    scale.append(dot);
    const baseLevel = Math.min(...entries.map(({ heading }) => Number(heading.tagName[1])));
    const rows = entries.map(({ link, heading }) => {
        const depth = Math.min(Number(heading.tagName[1]) - baseLevel, 3);
        link.style.setProperty('--toc-depth', depth);
        const ticks = [-1, 0, 1].map(position => {
            const tick = document.createElement('span');
            tick.className = position === 0 ? 'toc-tree-tick is-heading' : 'toc-tree-tick';
            tick.style.width = `${position === 0 ? 34 - depth * 5 : 22}px`;
            scale.append(tick);
            return { tick, position };
        });
        return { link, ticks, y: 0 };
    });
    inner.prepend(scale);
    let previewLink;
    function paint() {
        const current = rows.find(row => row.link === (previewLink || getActiveLink())) || rows[0];
        const direction = getComputedStyle(inner).direction === 'rtl' ? -1 : 1;
        dot.style.transform = `translateY(${current.y - 8}px)`;
        rows.forEach(row => {
            const distance = (row.y - current.y) / 76;
            const shift = 56 * Math.exp(-distance * distance);
            row.link.style.transform = `translateX(${direction * shift}px)`;
            row.ticks.forEach(({ tick, position }) => {
                const tickY = row.y + position * 12;
                const tickDistance = (tickY - current.y) / 76;
                const tickShift = 56 * Math.exp(-tickDistance * tickDistance);
                const stretch = position === 0 && row === current ? 1.4 : 1;
                tick.style.transform = `translate(${direction * tickShift}px, ${tickY}px) scaleX(${stretch})`;
                tick.classList.toggle('is-active', position === 0 && row === current);
            });
        });
    }
    function measure() {
        if (!toc.open || !inner.clientWidth) return;
        const bounds = inner.getBoundingClientRect();
        rows.forEach(row => {
            const rect = row.link.getBoundingClientRect();
            // First-line alignment stays stable when long headings wrap.
            row.y = rect.top - bounds.top + inner.scrollTop + 20;
        });
        paint();
    }
    rows.forEach(({ link }) => {
        link.addEventListener('pointerenter', event => {
            if (event.pointerType !== 'mouse') return;
            previewLink = link;
            paint();
        });
    });
    inner.addEventListener('pointerleave', () => { previewLink = null; paint(); });
    // Keyboard interaction should never wait for decorative motion.
    toc.addEventListener('keydown', () => toc.classList.add('toc-keyboard'));
    toc.addEventListener('pointerdown', () => toc.classList.remove('toc-keyboard'));
    toc.addEventListener('toggle', measure);
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    rows.forEach(({ link }) => observer.observe(link));
    document.fonts?.ready.then(measure);
    measure();
    return paint;
}
