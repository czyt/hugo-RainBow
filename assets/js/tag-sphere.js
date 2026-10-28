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
    let tracks = [], trackCount = -1;
    function render() {
        const width = stage.clientWidth;
        if (!width) return;
        const perOrbit = width < 500 ? 4 : 8;
        const orbitHeight = width < 500 ? 290 : 360;
        const count = Math.ceil(links.length / perOrbit);
        const radiusX = Math.max(30, width / 2 - Math.min(90, width * .23));
        const radiusY = orbitHeight / 2 - 45;
        stage.style.setProperty('--tag-cell-width', `${Math.min(160, width * .38)}px`);
        stage.style.height = `${Math.max(420, count * orbitHeight)}px`;
        if (trackCount !== count) {
            tracks.forEach(track => track.remove());
            tracks = Array.from({ length: count }, () => {
                const track = document.createElement('div');
                track.className = 'tag-star-track';
                track.setAttribute('aria-hidden', 'true');
                stage.insertBefore(track, stage.firstChild);
                return track;
            });
            trackCount = count;
        }
        tracks.forEach((track, index) => {
            track.style.cssText = `left:50%;top:${index * orbitHeight + orbitHeight / 2}px;width:${radiusX * 2}px;height:${radiusY * 2}px`;
        });
        const planet = stage.querySelector('.tag-orbit-planet');
        planet.style.top = `${orbitHeight / 2}px`;
        links.forEach((link, index) => {
            const group = Math.floor(index / perOrbit);
            const inGroup = Math.min(perOrbit, links.length - group * perOrbit);
            const angle = -Math.PI / 2 + (index % perOrbit) * Math.PI * 2 / inGroup + phase * (group % 2 ? -1 : 1);
            link.style.left = `${width / 2 + Math.cos(angle) * radiusX}px`;
            link.style.top = `${group * orbitHeight + orbitHeight / 2 + Math.sin(angle) * radiusY}px`;
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
