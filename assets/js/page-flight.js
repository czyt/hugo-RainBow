// Decorative pointer-initiated handoff between full Hugo page loads.
(() => {
    if (!Element.prototype.animate) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const key = 'rainbow-page-flight';
    let flight;
    function makeDot(x, y) {
        const dot = document.createElement('div');
        dot.className = 'page-flight-dot';
        dot.setAttribute('aria-hidden', 'true');
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        document.body.appendChild(dot);
        return dot;
    }
    let arrival;
    try {
        arrival = JSON.parse(sessionStorage.getItem(key) || 'null');
        sessionStorage.removeItem(key);
    } catch {}
    if (!motion.matches && arrival && arrival.path === location.pathname && Date.now() - arrival.time < 5000) {
        const originX = Math.max(0, Math.min(innerWidth, arrival.x * innerWidth));
        const originY = Math.max(0, Math.min(innerHeight, arrival.y * innerHeight));
        const target = document.querySelector('.page-header h1, .post-title, .first-entry h1, .first-entry h2');
        const rect = target?.getBoundingClientRect();
        const destinationX = rect ? Math.max(12, Math.min(innerWidth - 12, rect.left)) : innerWidth / 2;
        const destinationY = rect ? Math.max(12, Math.min(innerHeight - 12, rect.top + rect.height / 2)) : innerHeight / 3;
        const dot = makeDot(originX, originY);
        if (arrival.source === 'search') {
            dot.dataset.source = 'search';
            document.querySelector('main')?.animate([
                { opacity: 0, transform: 'translateY(14px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' });
        }
        const animation = dot.animate([
            { opacity: 0, transform: 'translate(-50%, -50%) scale(.8)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: .15 },
            { opacity: 0, transform: `translate(calc(-50% + ${destinationX - originX}px), calc(-50% + ${destinationY - originY}px)) scale(.8)` }
        ], { duration: 380, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' });
        animation.finished.then(() => dot.remove(), () => dot.remove());
    }
    document.addEventListener('click', event => {
        if (event.defaultPrevented || event.button !== 0 || event.detail === 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || motion.matches) return;
        const link = event.target.closest('a[href]');
        if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
        let url;
        try { url = new URL(link.href, location.href); } catch { return; }
        if (url.origin !== location.origin || !/^https?:$/.test(url.protocol) || url.pathname === location.pathname || url.hash) return;
        const article = link.closest('.rainbow-galaxy-list article');
        const archive = link.closest('.archive-entry');
        const searchResult = link.closest('#searchResults > li');
        try {
            sessionStorage.setItem(key, JSON.stringify({ path: url.pathname, x: event.clientX / innerWidth, y: event.clientY / innerHeight, time: Date.now(), source: searchResult ? 'search' : undefined }));
        } catch { return; }
        event.preventDefault();
        if (flight) { flight.animation.cancel(); flight.extras.forEach(a => a.cancel()); flight.dot.remove(); clearTimeout(flight.timer); }
        const extras = [];
        let x = event.clientX, y = event.clientY;
        if (article) {
            const rect = article.getBoundingClientRect();
            x = rect.left + (parseFloat(getComputedStyle(article).getPropertyValue('--river-point')) || 0);
            y = rect.top + 17;
        }
        const duration = archive ? 1100 : article ? 760 : searchResult ? 620 : 180;
        const scene = article ? document.querySelector('.rainbow-galaxy-list') : archive ? document.querySelector('.archive-orbits') : searchResult ? document.querySelector('#searchbox') : null;
        if (scene) {
            const rect = scene.getBoundingClientRect();
            scene.style.transformOrigin = archive ? '73% 36%' : `${x - rect.left}px ${y - rect.top}px`;
            const zoom = searchResult
                ? [{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: 'translateY(-36px) scale(.98)', opacity: 0 }]
                : archive
                ? [{ transform: 'rotate(0deg) scale(1)', opacity: 1 }, { transform: 'rotate(50deg) scale(1.8)', opacity: 1, offset: .72 }, { transform: 'rotate(70deg) scale(2.4)', opacity: 0 }]
                : [{ transform: 'rotate(0deg) scale(1)', opacity: 1 }, { transform: 'rotate(24deg) scale(1.8)', opacity: 0 }];
            extras.push(scene.animate(zoom, { duration, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' }));
            const main = archive && document.querySelector('main');
            if (main) extras.push(main.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: 'ease-in', fill: 'forwards' }));
        }
        const dot = makeDot(x, y);
        if (searchResult) dot.dataset.source = 'search';
        const destinationX = innerWidth / 2 - x, destinationY = innerHeight / 3 - y;
        const keyframes = searchResult ? [
            { opacity: 0, transform: 'translate(-50%, -50%) scale(.8)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1.2)', offset: .12 },
            { opacity: 1, transform: `translate(calc(-50% + ${destinationX * .6 + 60}px), calc(-50% + ${destinationY * .45}px)) scale(1)`, offset: .55 },
            { opacity: 0, transform: `translate(calc(-50% + ${destinationX}px), calc(-50% + ${destinationY}px)) scale(.8)` }
        ] : [
            { opacity: 0, transform: 'translate(-50%, -50%) scale(.8)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
            { opacity: 0, transform: `translate(calc(-50% + ${innerWidth / 2 - x}px), calc(-50% + ${innerHeight / 2 - y}px)) scale(2)` }
        ];
        const animation = dot.animate(keyframes, { duration, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' });
        const timer = setTimeout(() => { location.href = url.href; }, duration);
        flight = { dot, animation, timer, extras };
    });
    window.addEventListener('pageshow', () => {
        if (!flight) return;
        clearTimeout(flight.timer);
        flight.animation.cancel();
        flight.extras.forEach(a => a.cancel());
        flight.dot.remove();
        flight = null;
    });
})();
