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
    let track;
    function render() {
        const width = stage.clientWidth;
        if (!width) return;
        const height = Math.max(420, Math.min(620, width * .8));
        const dense = links.length > 18;
        const radiusX = width / 2 - (dense ? 18 : Math.min(90, width * .23));
        const radiusY = height / 2 - (dense ? 30 : 45);
        stage.style.height = `${height}px`;
        stage.classList.toggle('dense-orbit', dense);
        if (!track) {
            track = document.createElement('div');
            track.className = 'tag-star-track';
            track.setAttribute('aria-hidden', 'true');
            stage.insertBefore(track, stage.firstChild);
        }
        track.style.cssText = `left:50%;top:50%;width:${radiusX * 2}px;height:${radiusY * 2}px`;
        stage.querySelector('.tag-orbit-planet').style.top = '50%';
        links.forEach((link, index) => {
            const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(1, links.length) + phase;
            const x = width / 2 + Math.cos(angle) * radiusX;
            link.classList.toggle('near-right', x > width * .7);
            link.style.left = `${x}px`;
            link.style.top = `${height / 2 + Math.sin(angle) * radiusY}px`;
            link.style.transform = 'translate(-50%, -50%)';
        });
    }
    function running() { return view === 'cloud' && !paused && !motion.matches && !hovering && !focused && visible && !document.hidden; }
    function tick(time) {
        frame = 0;
        if (!running()) { lastTime = 0; return; }
        if (lastTime) phase += Math.min(time - lastTime, 50) * .00012;
        lastTime = time;
        render();
        frame = requestAnimationFrame(tick);
    }
    function schedule() {
        panel.classList.toggle('orbit-paused', !running());
        if (!running()) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
        else if (!frame) frame = requestAnimationFrame(tick);
    }
    function createTags() {
        links = items.map(item => {
            const link = item.querySelector('a').cloneNode(true);
            link.className = 'sphere-tag';
            link.setAttribute('aria-label', link.textContent.trim().replace(/\s+/g, ' '));
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
    stage.addEventListener('pointerover', event => { if (event.pointerType === 'mouse' && event.target.closest('.sphere-tag')) { hovering = true; schedule(); } });
    stage.addEventListener('pointerout', event => { if (event.pointerType === 'mouse' && event.target.closest('.sphere-tag') && !event.relatedTarget?.closest?.('.sphere-tag')) { hovering = false; schedule(); } });
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
