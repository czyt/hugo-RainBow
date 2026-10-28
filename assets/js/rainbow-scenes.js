(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const galaxy = document.querySelector('[data-galaxy-list]');
    const about = document.querySelector('.rainbow-about');
    if (about) {
        const content = about.querySelector('.post-content');
        if (content) {
            let chapter = null;
            Array.from(content.children).forEach(node => {
                if (/^H[12]$/.test(node.tagName)) {
                    chapter = document.createElement('section');
                    chapter.className = 'rainbow-about-chapter';
                    content.insertBefore(chapter, node);
                }
                if (chapter) chapter.appendChild(node);
            });
            if (chapter) about.classList.add('has-journey');
        }
    }
    const canvas = galaxy?.querySelector('canvas') || about?.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0, width = 0, height = 0, lastPaint = 0, inView = true, velocity = 0, lastScroll = scrollY;
    const started = performance.now();
    const layoutPosts = () => {
        if (!galaxy) return;
        const width = galaxy.clientWidth;
        galaxy.querySelectorAll('article').forEach((entry, index) => {
            entry.style.setProperty('--river-delay', `${Math.min(index * 100 + 220, 950)}ms`);
            if (innerWidth < 800) { entry.style.removeProperty('--river-left'); return; }
            const center = .5 + .23 * Math.sin((entry.offsetTop + 100) / 440);
            const left = center >= .5 ? Math.max(0, center - .4) : Math.min(.63, center + .04);
            entry.style.setProperty('--river-left', `${left * 100}%`);
            entry.style.setProperty('--river-align', center >= .5 ? 'right' : 'left');
        });
    };
    const random = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    function draw(time = 0) {
        frame = 0;
        if (!reduced.matches && !document.hidden && inView) schedule();
        if (time && time - lastPaint < 40) return;
        lastPaint = time;
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
            const offset = Math.max(0, Math.min(galaxy.clientHeight - height, -galaxy.getBoundingClientRect().top - 150));
            canvas.style.transform = `translateY(${offset}px)`;
            const elapsed = reduced.matches ? 2000 : Math.max(0, time - started);
            const reveal = Math.min(1, Math.max(0, (elapsed - 250) / 900));
            const revealY = height * (1 - Math.pow(1 - reveal, 3));
            const shift = reduced.matches ? 0 : (time * .025) % 3;
            const start = Math.floor(offset / 3), end = Math.ceil((offset + height) / 3);
            for (let i = start; i < end; i++) {
                const y = i * 3 - offset - shift;
                if (offset === 0 && y > revealY) continue;
                const center = width * (.5 + .23 * Math.sin((i * 3 - shift + 100) / 440));
                const flow = reduced.matches ? 0 : time * .00045;
                for (let j = 0; j < 8; j++) {
                    const n = i * 8 + j, spread = (random(n) - .5) * width * .075 + Math.sin(flow + n * .7) * 2;
                    ctx.fillStyle = `rgba(${color},${.12 + random(n + 17) * .4 + (reduced.matches ? .08 : .1 * (1 + Math.sin(flow * 2 + n)) / 2)})`;
                    ctx.beginPath(); ctx.arc(center + spread, y + random(n + 51) * 3, random(n + 21) * 1.1 + .3, 0, Math.PI * 2); ctx.fill();
                }
            }
            if (offset < 60) {
                const headX = width * (.5 + .23 * Math.sin(100 / 440));
                const glow = ctx.createRadialGradient(headX, 4 - offset, 0, headX, 4 - offset, 22);
                glow.addColorStop(0, `rgba(${color},.8)`); glow.addColorStop(1, `rgba(${color},0)`);
                ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(headX, 4 - offset, 22, 0, Math.PI * 2); ctx.fill();
            }
        } else {
            const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
            const progress = Math.min(1, Math.max(0, scrollY / max));
            about.style.setProperty('--fall-progress', `${progress * 100}%`);
            velocity *= .92;
            for (let i = 0; i < 340; i++) {
                const x = random(i + 5) * width, y = (random(i + 202) * (height + 100) - (reduced.matches ? 0 : (time * (.012 + random(i) * .035) + scrollY * (.12 + random(i) * .25))) % (height + 100) + height + 100) % (height + 100) - 50;
                const radius = .4 + random(i + 60) * 1.4;
                ctx.fillStyle = `rgba(${color},${.12 + random(i + 40) * .35})`;
                ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
                const tail = Math.min(65, Math.abs(velocity) * (1 + random(i) * 2));
                if (tail > 1) { ctx.strokeStyle = `rgba(${color},${.1 + random(i + 8) * .2})`; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + Math.sign(velocity) * tail); ctx.stroke(); }
            }
        }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
    addEventListener('scroll', () => { velocity = Math.max(-30, Math.min(30, scrollY - lastScroll)); lastScroll = scrollY; schedule(); }, { passive: true });
    addEventListener('resize', () => { layoutPosts(); schedule(); }, { passive: true });
    reduced.addEventListener('change', schedule);
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (galaxy) {
        new ResizeObserver(() => { layoutPosts(); schedule(); }).observe(galaxy);
        layoutPosts();
        if (!reduced.matches) galaxy.classList.add('river-arriving');
        new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) schedule(); }).observe(galaxy);
        document.addEventListener('visibilitychange', schedule);
    }
    if (about) {
        document.addEventListener('visibilitychange', schedule);
        if (!reduced.matches && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
            about.querySelectorAll('.rainbow-about-chapter').forEach(chapter => { chapter.classList.add('will-reveal'); observer.observe(chapter); });
        }
    }
    schedule();
})();
