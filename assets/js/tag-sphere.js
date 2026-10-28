(() => {
    const list = document.getElementById('tag-labels');
    const panel = document.querySelector('.tag-sphere-panel');
    const toolbar = document.querySelector('.tag-view-switch');
    if (!list || !panel || !toolbar) return;
    const stage = panel.querySelector('.tag-sphere');
    const viewSwitch = toolbar.querySelector('input');
    const pause = panel.querySelector('[data-orbit-pause]');
    const zoomOut = panel.querySelector('[data-orbit-zoom="out"]');
    const zoomIn = panel.querySelector('[data-orbit-zoom="in"]');
    const zoomReset = panel.querySelector('[data-orbit-zoom="reset"]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const items = Array.from(list.children).sort((a, b) => Number(b.dataset.count) - Number(a.dataset.count));
    let phase = 0, lastTime = 0, frame = 0;
    let view = 'labels', hovering = false, focused = false, visible = true;
    let paused = motion.matches || panel.dataset.effects === 'false';
    let links = [];
    let positions = [], layoutWidth = 0, layoutHeight = 0;
    let fieldWidth = 0, fieldHeight = 0, planetRadius = 0;
    let zoom = 1, fit = 1, panX = 0, panY = 0, drag = null;
    const field = document.createElement('div');
    field.className = 'tag-orbit-field';
    field.appendChild(stage.querySelector('.tag-orbit-planet'));
    stage.appendChild(field);
    const track = document.createElement('div');
    track.className = 'tag-star-track';
    track.setAttribute('aria-hidden', 'true');
    const satellite = document.createElement('span');
    track.appendChild(satellite);
    field.prepend(track);
    const counts = items.map(item => Number(item.dataset.count) || 1);
    const highestCount = Math.max(1, ...counts);
    const lowestCount = Math.min(highestCount, ...counts);
    function randomFor(name) {
        let seed = 2166136261;
        for (const character of name) seed = Math.imul(seed ^ character.codePointAt(0), 16777619);
        return () => {
            seed = Math.imul(seed, 1664525) + 1013904223 | 0;
            return (seed >>> 0) / 4294967296;
        };
    }
    function separateTags(passes) {
        for (let pass = 0; pass < passes; pass++) {
            let largestOverlap = 0;
            for (let i = 0; i < positions.length; i++) {
                const a = positions[i];
                for (let j = i + 1; j < positions.length; j++) {
                    const b = positions[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const overlapX = (a.width + b.width) / 2 + 6 - Math.abs(dx);
                    const overlapY = (a.height + b.height) / 2 + 4 - Math.abs(dy);
                    if (overlapX <= 0 || overlapY <= 0) continue;
                    largestOverlap = Math.max(largestOverlap, Math.min(overlapX, overlapY));
                    if (overlapX < overlapY) {
                        const shift = (dx < 0 ? -1 : 1) * overlapX / 2;
                        a.x += shift; b.x -= shift;
                    } else {
                        const shift = (dy < 0 ? -1 : 1) * overlapY / 2;
                        a.y += shift; b.y -= shift;
                    }
                }
            }
            for (const position of positions) {
                const dx = position.x - fieldWidth / 2, dy = position.y - fieldHeight / 2;
                const nx = Math.max(0, Math.abs(dx) - position.width / 2);
                const ny = Math.max(0, Math.abs(dy) - position.height / 2);
                const distance = Math.hypot(nx, ny);
                if (distance < planetRadius) {
                    const length = Math.hypot(dx, dy) || 1;
                    const push = planetRadius - distance + 1;
                    position.x += dx / length * push;
                    position.y += dy / length * push;
                }
                position.x = Math.max(position.width / 2 + 8, Math.min(fieldWidth - position.width / 2 - 8, position.x));
                position.y = Math.max(position.height / 2 + 8, Math.min(fieldHeight - position.height / 2 - 8, position.y));
            }
            if (largestOverlap < .1) break;
        }
    }
    function transformField() {
        const scale = fit * zoom;
        const limitX = Math.max(0, (fieldWidth * scale - stage.clientWidth) / 2);
        const limitY = Math.max(0, (fieldHeight * scale - stage.clientHeight) / 2);
        panX = Math.max(-limitX, Math.min(limitX, panX));
        panY = Math.max(-limitY, Math.min(limitY, panY));
        field.style.transform = `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${scale})`;
        stage.classList.toggle('is-zoomed', zoom > 1);
        zoomOut.disabled = zoom <= 1;
        zoomIn.disabled = zoom >= Math.max(3, 1 / fit);
        zoomReset.textContent = `${Math.round(zoom * 100)}%`;
    }
    function layout() {
        const width = stage.clientWidth;
        if (!width) return;
        const footer = document.querySelector('.footer');
        const main = stage.closest('.main');
        const bottomSpace = panel.querySelector('.tag-orbit-controls').offsetHeight +
            (footer?.offsetHeight || 0) + parseFloat(getComputedStyle(main).paddingBottom) + 20;
        let height = Math.max(220, Math.min(680, innerHeight - stage.getBoundingClientRect().top - scrollY - bottomSpace));
        stage.style.height = `${height}px`;
        height = Math.max(220, height - Math.max(0, document.documentElement.scrollHeight - innerHeight));
        stage.style.height = `${height}px`;
        layoutWidth = width;
        layoutHeight = innerHeight;
        const sizes = links.map((link, index) => ({ index, width: link.offsetWidth, height: link.offsetHeight }));
        const area = sizes.reduce((total, size) => total + (size.width + 6) * (size.height + 4), 0);
        const expansion = Math.max(1, Math.sqrt(area / (width * height * .38)));
        fieldWidth = width * expansion;
        fieldHeight = height * expansion;
        field.style.width = `${fieldWidth}px`;
        field.style.height = `${fieldHeight}px`;
        fit = 1 / expansion;
        const planet = field.querySelector('.tag-orbit-planet');
        planet.style.width = `${Math.min(fieldWidth, fieldHeight) * .17}px`;
        planetRadius = planet.offsetWidth / 2 + 12;
        positions = sizes.map(size => {
            const random = randomFor(links[size.index].textContent);
            const importance = highestCount === lowestCount ? .5 :
                (Math.log1p(counts[size.index]) - Math.log1p(lowestCount)) /
                (Math.log1p(highestCount) - Math.log1p(lowestCount));
            const rank = size.index / Math.max(1, sizes.length - 1);
            const radius = .24 + .67 * Math.sqrt(.7 * rank + .3 * (1 - importance)) + (random() - .5) * .06;
            const angle = random() * Math.PI * 2;
            return { ...size, radius, angle, x: 0, y: 0 };
        });
        zoom = 1; panX = 0; panY = 0;
        render(true);
        transformField();
    }
    function render(reset = false) {
        if (!positions.length) return;
        const radiusX = fieldWidth * .45, radiusY = fieldHeight * .43;
        positions.forEach(position => {
            const angle = phase + position.angle;
            const targetX = fieldWidth / 2 + Math.cos(angle) * radiusX * position.radius;
            const targetY = fieldHeight / 2 + Math.sin(angle) * radiusY * position.radius;
            position.x = reset ? targetX : position.x + (targetX - position.targetX);
            position.y = reset ? targetY : position.y + (targetY - position.targetY);
            position.targetX = targetX; position.targetY = targetY;
            if (!reset) {
                position.x += (targetX - position.x) * .025;
                position.y += (targetY - position.y) * .025;
            }
        });
        separateTags(reset ? 200 : 12);
        positions.forEach((position, index) => {
            links[index].style.transform = `translate(${position.x - position.width / 2}px, ${position.y - position.height / 2}px)`;
        });
        satellite.style.transform = `translate(${Math.cos(phase) * fieldWidth * .39}px, ${Math.sin(phase) * fieldHeight * .36}px)`;
    }
    function running() { return view === 'cloud' && !paused && !motion.matches && !hovering && !focused && !drag && visible && !document.hidden; }
    function tick(time) {
        frame = 0;
        if (!running()) { lastTime = 0; return; }
        if (lastTime) phase += Math.min(time - lastTime, 50) * .000045;
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
            field.appendChild(link);
            return link;
        });
    }
    function setView(nextView, remember = false) {
        view = nextView === 'cloud' ? 'cloud' : 'labels';
        list.hidden = view === 'cloud';
        panel.hidden = view !== 'cloud';
        viewSwitch.checked = view === 'labels';
        if (remember) { try { localStorage.setItem('rainbow-tag-view', view); } catch {} }
        layout(); schedule();
    }
    function syncPause() {
        panel.classList.toggle('orbit-paused', paused || motion.matches || panel.dataset.effects === 'false');
        pause.textContent = paused ? pause.dataset.resume : pause.dataset.pause;
        pause.setAttribute('aria-pressed', String(paused));
        pause.disabled = motion.matches || panel.dataset.effects === 'false';
        schedule();
    }
    pause.addEventListener('click', () => { paused = !paused; syncPause(); });
    for (const button of [zoomOut, zoomIn, zoomReset]) button.addEventListener('click', () => {
        zoom = button === zoomReset ? 1 : Math.max(1, Math.min(Math.max(3, 1 / fit), zoom * (button === zoomIn ? 1.25 : .8)));
        transformField();
    });
    viewSwitch.addEventListener('change', () => setView(viewSwitch.checked ? 'labels' : 'cloud', true));
    stage.addEventListener('pointerover', event => { if (event.pointerType === 'mouse' && event.target.closest('.sphere-tag')) { hovering = true; schedule(); } });
    stage.addEventListener('pointerout', event => { if (event.pointerType === 'mouse' && event.target.closest('.sphere-tag') && !event.relatedTarget?.closest?.('.sphere-tag')) { hovering = false; schedule(); } });
    stage.addEventListener('focusin', event => {
        focused = true;
        const index = links.indexOf(event.target);
        if (index >= 0 && event.target.matches(':focus-visible')) {
            zoom = Math.max(zoom, 1 / fit);
            panX = (fieldWidth / 2 - positions[index].x) * fit * zoom;
            panY = (fieldHeight / 2 - positions[index].y) * fit * zoom;
            transformField();
        }
        schedule();
    });
    stage.addEventListener('focusout', event => { focused = stage.contains(event.relatedTarget); schedule(); });
    document.addEventListener('visibilitychange', schedule);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(stage);
    stage.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.target.closest('.sphere-tag')) return;
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, panX, panY, phase };
        stage.setPointerCapture(event.pointerId);
        stage.classList.add('is-dragging');
        schedule();
    });
    stage.addEventListener('pointermove', event => {
        if (!drag || event.pointerId !== drag.id) return;
        if (zoom > 1) {
            panX = drag.panX + event.clientX - drag.x;
            panY = drag.panY + event.clientY - drag.y;
            transformField();
        } else if (!motion.matches) {
            phase = drag.phase + (event.clientX - drag.x) * .006;
            render();
        }
    });
    const release = event => {
        if (!drag || event.pointerId !== drag.id) return;
        drag = null;
        stage.classList.remove('is-dragging');
        schedule();
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('lostpointercapture', release);
    new ResizeObserver(() => { if (stage.clientWidth !== layoutWidth) layout(); }).observe(stage);
    window.addEventListener('resize', () => { if (innerHeight !== layoutHeight) layout(); });
    document.fonts?.ready.then(layout);
    motion.addEventListener('change', () => { if (motion.matches) paused = true; syncPause(); });
    let initial = panel.dataset.defaultView;
    try { initial = localStorage.getItem('rainbow-tag-view') || initial; } catch {}
    toolbar.hidden = false;
    createTags();
    syncPause();
    setView(motion.matches ? 'labels' : initial);
})();
