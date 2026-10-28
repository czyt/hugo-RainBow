(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const galaxy = document.querySelector('[data-galaxy-list]');
    const about = document.querySelector('.rainbow-about');
    const canvas = galaxy?.querySelector('canvas') || about?.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0, width = 0, height = 0;
    const random = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    function draw() {
        frame = 0;
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        // A viewport-sized bitmap avoids allocating a huge canvas for long lists.
        width = rect.width; height = galaxy ? Math.min(innerHeight + 300, rect.height) : innerHeight;
        if (!width || !height) return;
        canvas.width = Math.ceil(width * dpr); canvas.height = Math.ceil(height * dpr);
        if (galaxy) canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const dark = document.documentElement.dataset.theme === 'dark';
        const color = dark ? '159,190,244' : '91,115,173';
        if (galaxy) {
            const offset = Math.max(0, Math.min(rect.height - height, -galaxy.getBoundingClientRect().top - 150));
            canvas.style.transform = `translateY(${offset}px)`;
            const start = Math.floor(offset / 9), end = Math.ceil((offset + height) / 9);
            for (let i = start; i < end; i++) {
                const y = i * 9 - offset, center = width * (.5 + .3 * Math.sin(i * .035));
                for (let j = 0; j < 4; j++) {
                    const n = i * 4 + j, spread = (random(n) - .5) * width * .3;
                    ctx.fillStyle = `rgba(${color},${.12 + random(n + 17) * .38})`;
                    ctx.beginPath(); ctx.arc(center + spread, y + random(n + 51) * 9, random(n + 21) * 1.5 + .35, 0, Math.PI * 2); ctx.fill();
                }
            }
        } else {
            const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
            const progress = Math.min(1, Math.max(0, scrollY / max));
            about.style.setProperty('--fall-progress', `${progress * 100}%`);
            for (let i = 0; i < 120; i++) {
                const x = random(i + 5) * width, y = (random(i + 202) * (height + 50) + (reduced.matches ? 0 : progress * (80 + random(i) * 180))) % (height + 50) - 25;
                const radius = .4 + random(i + 60) * 1.4;
                ctx.fillStyle = `rgba(${color},${.12 + random(i + 40) * .35})`;
                ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
                if (i % 9 === 0) { ctx.strokeStyle = `rgba(${color},.15)`; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 17); ctx.stroke(); }
            }
        }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    reduced.addEventListener('change', schedule);
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (galaxy) new ResizeObserver(schedule).observe(galaxy);
    schedule();
})();
