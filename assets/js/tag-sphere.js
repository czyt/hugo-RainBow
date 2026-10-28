(() => {
    const list = document.getElementById('tag-labels');
    const panel = document.querySelector('.tag-sphere-panel');
    const toolbar = document.querySelector('.tag-view-switch');
    if (!list || !panel || !toolbar) return;
    const stage = panel.querySelector('.tag-sphere');
    const viewSwitch = toolbar.querySelector('input');
    const prev = panel.querySelector('[data-orbit-prev]');
    const next = panel.querySelector('[data-orbit-next]');
    const pageLabel = panel.querySelector('[data-orbit-page]');
    const pause = panel.querySelector('[data-orbit-pause]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const items = Array.from(list.children).sort((a, b) => Number(b.dataset.count) - Number(a.dataset.count));
    const perPage = 6;
    const pageCount = Math.max(1, Math.ceil(items.length / perPage));
    let page = 0, phase = -Math.PI / 2, lastTime = 0, frame = 0;
    let view = 'labels', hovering = false, focused = false, visible = true;
    let paused = motion.matches || panel.dataset.effects === 'false';
    let links = [];
    function render() {
        const width = stage.clientWidth, height = stage.clientHeight;
        if (!width || !height) return;
        links.forEach((link, index) => {
            const angle = phase + index * Math.PI * 2 / Math.max(links.length, 1);
            const xRadius = Math.max(0, width / 2 - link.offsetWidth / 2 - 12);
            const yRadius = Math.max(0, height / 2 - link.offsetHeight / 2 - 20);
            const x = Math.cos(angle) * xRadius;
            const y = Math.sin(angle) * yRadius;
            link.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
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
    function showPage(index) {
        page = Math.max(0, Math.min(pageCount - 1, index));
        links.forEach(link => link.remove());
        links = items.slice(page * perPage, (page + 1) * perPage).map(item => {
            const link = item.querySelector('a').cloneNode(true);
            link.className = 'sphere-tag';
            link.style.setProperty('--tag-hue', item.style.getPropertyValue('--tag-hue'));
            stage.appendChild(link);
            return link;
        });
        pageLabel.textContent = `${page + 1} / ${pageCount}`;
        prev.disabled = page === 0;
        next.disabled = page === pageCount - 1;
        render();
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
        pause.textContent = paused ? pause.dataset.resume : pause.dataset.pause;
        pause.setAttribute('aria-pressed', String(paused));
        pause.disabled = motion.matches || panel.dataset.effects === 'false';
        schedule();
    }
    prev.addEventListener('click', () => showPage(page - 1));
    next.addEventListener('click', () => showPage(page + 1));
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
    showPage(0);
    syncPause();
    setView(motion.matches ? 'labels' : initial);
})();
