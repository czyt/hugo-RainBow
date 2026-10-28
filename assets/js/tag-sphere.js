(() => {
    const list = document.getElementById('tag-labels');
    const panel = document.querySelector('.tag-sphere-panel');
    const toolbar = document.querySelector('.tag-view-switch');
    if (!list || !panel || !toolbar) return;
    const stage = panel.querySelector('.tag-sphere');
    const viewSwitch = toolbar.querySelector('input');
    const pause = panel.querySelector('[data-orbit-pause]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const items = Array.from(list.children).sort((a, b) => Number(b.dataset.count) - Number(a.dataset.count));
    let phase = 0, lastTime = 0, frame = 0;
    let view = 'labels', hovering = false, focused = false, visible = true;
    let paused = motion.matches || panel.dataset.effects === 'false';
    let links = [];
    function render() {
        const width = stage.clientWidth;
        if (!width) return;
        const columns = Math.max(2, Math.floor(width / 150));
        const cellWidth = width / columns;
        stage.style.setProperty('--tag-cell-width', `${cellWidth - 14}px`);
        const rowHeight = 72;
        const rows = Math.ceil(links.length / columns);
        const height = Math.max(420, rows * rowHeight + 230);
        stage.style.height = `${height}px`;
        links.forEach((link, index) => {
            const row = Math.floor(index / columns), column = index % columns;
            const drift = motion.matches || panel.dataset.effects === 'false' ? 0 : Math.sin(phase + index * 1.7) * 7;
            const x = (column + .5) * cellWidth + Math.sin(index * 2.3) * Math.min(12, cellWidth * .08);
            const y = 155 + row * rowHeight + (column % 2) * 18 + drift;
            link.style.left = `${x}px`;
            link.style.top = `${y}px`;
            link.style.transform = 'translate(-50%, -50%)';
        });
    }
    function running() { return view === 'cloud' && !paused && !motion.matches && !hovering && !focused && visible && !document.hidden; }
    function tick(time) {
        frame = 0;
        if (!running()) { lastTime = 0; return; }
        if (lastTime) phase += Math.min(time - lastTime, 50) * .00004;
        lastTime = time;
        render();
        frame = requestAnimationFrame(tick);
    }
    function schedule() {
        if (!running()) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
        else if (!frame) frame = requestAnimationFrame(tick);
    }
    function createTags() {
        links = items.map(item => {
            const link = item.querySelector('a').cloneNode(true);
            link.className = 'sphere-tag';
            link.style.setProperty('--tag-hue', item.style.getPropertyValue('--tag-hue'));
            stage.appendChild(link);
            return link;
        });
    }
    function setView(nextView, remember = false) {
        view = nextView === 'cloud' ? 'cloud' : 'labels';
        list.hidden = view === 'cloud';
        panel.hidden = view !== 'cloud';
        viewSwitch.checked = view === 'labels';
        if (remember) { try { localStorage.setItem('rainbow-tag-view', view); } catch {} }
        render(); schedule();
    }
    function syncPause() {
        panel.classList.toggle('orbit-paused', paused || motion.matches || panel.dataset.effects === 'false');
        pause.textContent = paused ? pause.dataset.resume : pause.dataset.pause;
        pause.setAttribute('aria-pressed', String(paused));
        pause.disabled = motion.matches || panel.dataset.effects === 'false';
        schedule();
    }
    pause.addEventListener('click', () => { paused = !paused; syncPause(); });
    viewSwitch.addEventListener('change', () => setView(viewSwitch.checked ? 'labels' : 'cloud', true));
    stage.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; schedule(); } });
    stage.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    stage.addEventListener('focusin', () => { focused = true; schedule(); });
    stage.addEventListener('focusout', event => { focused = stage.contains(event.relatedTarget); schedule(); });
    document.addEventListener('visibilitychange', schedule);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(stage);
    new ResizeObserver(render).observe(stage);
    document.fonts?.ready.then(render);
    motion.addEventListener('change', () => { if (motion.matches) paused = true; syncPause(); });
    let initial = panel.dataset.defaultView;
    try { initial = localStorage.getItem('rainbow-tag-view') || initial; } catch {}
    toolbar.hidden = false;
    createTags();
    syncPause();
    setView(motion.matches ? 'labels' : initial);
})();
