(() => {
    const list = document.getElementById('tag-labels');
    const panel = document.querySelector('.tag-sphere-panel');
    const toolbar = document.querySelector('.tag-view-switch');
    if (!list || !panel || !toolbar) return;
    const stage = panel.querySelector('.tag-sphere');
    const pauseButton = panel.querySelector('.sphere-pause');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const effectsButton = panel.querySelector('.sphere-effects');
    const canvas = document.createElement('canvas');
    canvas.className = 'sphere-weather';
    canvas.setAttribute('aria-hidden', 'true');
    stage.appendChild(canvas);
    const context = canvas.getContext('2d');
    let effects = !motion.matches && panel.dataset.effects !== 'false';
    try {
        const preference = localStorage.getItem('rainbow-tag-effects');
        if (preference === 'on' || preference === 'off') effects = !motion.matches && preference === 'on';
    } catch {}
    let weatherWidth = 0, weatherHeight = 0, weatherTime = 0;
    let lightningAt = 7000 + Math.random() * 6000;
    let lightningStart = -1000;
    let bolt = [];
    const rain = Array.from({length: 36}, () => ({x:Math.random(), y:Math.random(), speed:.025 + Math.random() * .04, length:8 + Math.random() * 16}));
    function drawWeather() {
        if (!context) return;
        context.clearRect(0, 0, weatherWidth, weatherHeight);
        if (!effects) return;
        const dark = document.documentElement.dataset.theme === 'dark';
        context.lineWidth = 1;
        context.strokeStyle = dark ? 'rgba(153,203,237,.22)' : 'rgba(56,107,145,.16)';
        for (const drop of rain) {
            const y = (drop.y * weatherHeight + weatherTime * drop.speed) % (weatherHeight + 40) - 20;
            const x = drop.x * weatherWidth - y * .08;
            context.beginPath(); context.moveTo(x, y); context.lineTo(x - 2, y + drop.length); context.stroke();
        }
        if (weatherTime >= lightningAt) {
            lightningStart = weatherTime;
            lightningAt = weatherTime + 9000 + Math.random() * 9000;
            const x = weatherWidth * (.15 + Math.random() * .7);
            bolt = Array.from({length: 7}, (_, i) => ({x:x + (Math.random() - .5) * 50, y:20 + i * weatherHeight * .055}));
        }
        const age = weatherTime - lightningStart;
        if (age >= 0 && age < 420 && bolt.length) {
            context.save();
            context.globalAlpha = Math.sin(Math.PI * age / 420) * .6;
            context.strokeStyle = dark ? '#bedfff' : '#5b85aa';
            context.shadowColor = '#83baff'; context.shadowBlur = 10; context.lineWidth = 1.4;
            context.beginPath(); bolt.forEach((p, i) => i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y)); context.stroke();
            context.restore();
        }
    }
    function setEffects(value) {
        effects = Boolean(value && context);
        effectsButton.setAttribute('aria-pressed', String(effects));
        effectsButton.textContent = effects ? effectsButton.dataset.on : effectsButton.dataset.off;
        stage.classList.toggle('has-atmosphere', effects);
        canvas.hidden = !effects;
        drawWeather();
    }
    effectsButton.addEventListener('click', () => {
        setEffects(!effects);
        try { localStorage.setItem('rainbow-tag-effects', effects ? 'on' : 'off'); } catch {}
    });
    const buttons = Array.from(toolbar.querySelectorAll('button'));
    const items = Array.from(list.children).sort((a, b) => Number(b.dataset.count) - Number(a.dataset.count));
    // Limit density in the sphere; the complete, alphabetic list always remains available.
    const featured = items.slice(0, 60).sort((a, b) => a.textContent.localeCompare(b.textContent));
    panel.querySelector('.tag-sphere-limit').hidden = items.length <= featured.length;
    const points = featured.map((item, index) => {
        const link = item.querySelector('a').cloneNode(true);
        link.className = 'sphere-tag';
        link.style.setProperty('--tag-hue', item.style.getPropertyValue('--tag-hue'));
        link.style.setProperty('--tag-size', item.style.getPropertyValue('--tag-size'));
        stage.appendChild(link);
        const y = 1 - 2 * (index + .5) / featured.length;
        const radial = Math.sqrt(1 - y * y);
        const angle = index * Math.PI * (3 - Math.sqrt(5));
        return { link, x: Math.cos(angle) * radial, y, z: Math.sin(angle) * radial };
    });
    let view = 'labels';
    let paused = motion.matches;
    let hovered = false;
    let focused = null;
    let pointer = null;
    let moved = false;
    let visible = true;
    let yaw = 0;
    let pitch = -.12;
    let frame = 0;
    let lastTime = 0;
    let radius = 1;
    function render() {
        const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        for (const point of points) {
            const x = point.x * cy + point.z * sy;
            const z0 = point.z * cy - point.x * sy;
            const y = point.y * cp - z0 * sp;
            const z = z0 * cp + point.y * sp;
            const depth = (z + 1) / 2;
            const selected = focused === point.link;
            const scale = selected ? 1.12 : .64 + depth * .38;
            point.link.style.transform = `translate(-50%, -50%) translate3d(${selected ? 0 : x * radius}px, ${selected ? 0 : y * radius}px, 0) scale(${scale})`;
            point.link.style.opacity = selected ? '1' : focused ? '.18' : String(.94 + depth * .06);
            point.link.style.zIndex = selected ? '101' : String(Math.round(depth * 100));
        }
    }
    const spinning = () => view === 'cloud' && !paused && !hovered && !focused && !pointer && visible && !document.hidden;
    function tick(time) {
        frame = 0;
        if (!spinning()) { lastTime = 0; return; }
        if (lastTime) {
            const elapsed = Math.min(time - lastTime, 50);
            yaw += elapsed * .00009;
            weatherTime += elapsed;
        }
        lastTime = time;
        render();
        drawWeather();
        frame = requestAnimationFrame(tick);
    }
    function schedule() {
        if (!spinning()) {
            cancelAnimationFrame(frame); frame = 0; lastTime = 0;
        } else if (!frame) frame = requestAnimationFrame(tick);
    }
    function resize() {
        weatherWidth = stage.clientWidth; weatherHeight = stage.clientHeight;
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(weatherWidth * dpr); canvas.height = Math.round(weatherHeight * dpr);
        context?.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawWeather();
        radius = Math.max(40, Math.min(stage.clientWidth * .36, stage.clientHeight * .39));
        render();
    }
    function setView(next, remember = false) {
        view = next === 'cloud' ? 'cloud' : 'labels';
        list.hidden = view === 'cloud';
        panel.hidden = view !== 'cloud';
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tagView === view)));
        if (remember) { try { localStorage.setItem('rainbow-tag-view', view); } catch {} }
        resize(); schedule();
    }
    function setPaused(value) {
        paused = value;
        pauseButton.setAttribute('aria-pressed', String(paused));
        pauseButton.textContent = paused ? pauseButton.dataset.resume : pauseButton.dataset.pause;
        schedule();
    }
    buttons.forEach(button => button.addEventListener('click', () => setView(button.dataset.tagView, true)));
    pauseButton.addEventListener('click', () => setPaused(!paused));
    stage.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
    stage.addEventListener('pointerleave', () => { hovered = false; schedule(); });
    stage.addEventListener('focusin', event => { focused = event.target.matches(':focus-visible') ? event.target.closest('a') : null; render(); schedule(); });
    stage.addEventListener('focusout', event => {
        focused = stage.contains(event.relatedTarget) ? event.relatedTarget.closest('a') : null;
        render(); schedule();
    });
    stage.addEventListener('pointerdown', event => {
        if (event.button !== 0 || pointer) return;
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
        moved = false;
        schedule();
    });
    stage.addEventListener('pointermove', event => {
        if (!pointer || pointer.id !== event.pointerId) return;
        const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
        if (!moved && Math.hypot(dx, dy) < 4) return;
        moved = true;
        stage.setPointerCapture(event.pointerId);
        yaw += dx * .006;
        pitch = Math.max(-1.25, Math.min(1.25, pitch + dy * .006));
        pointer.x = event.clientX; pointer.y = event.clientY;
        render();
    });
    const endDrag = event => {
        if (!pointer || pointer.id !== event.pointerId) return;
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
        if (event.type === 'pointercancel') moved = false;
        pointer = null; schedule();
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    stage.addEventListener('click', event => { if (moved && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); moved = false; } }, true);
    document.addEventListener('visibilitychange', schedule);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(stage);
    new ResizeObserver(resize).observe(stage);
    motion.addEventListener('change', () => { if (motion.matches) { setPaused(true); setEffects(false); setView('labels'); } });
    let initial = panel.dataset.defaultView;
    try { initial = localStorage.getItem('rainbow-tag-view') || initial; } catch {}
    toolbar.hidden = false;
    setEffects(effects);
    setPaused(paused);
    setView(motion.matches ? 'labels' : initial);
})();
