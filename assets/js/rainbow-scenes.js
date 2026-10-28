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
    let previousTime = 0;
    const dust = galaxy ? Array.from({ length: 4800 }, (_, i) => {
        const rand = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
        return { u: Math.pow(rand(i + 1), 1.35), side: (rand(i + 10001) + rand(i + 20001) + rand(i + 30001) + rand(i + 40001) - 2) / 1.15, light: rand(i + 50001) };
    }) : [];
    const riverX = (width, y) => width < 760 ? 30 + 14 * Math.sin((y + 100) / 210) : width * (.5 + .23 * Math.sin((y + 100) / 210));
    const layoutPosts = () => {
        if (!galaxy) return;
        const width = galaxy.clientWidth;
        galaxy.querySelectorAll('article').forEach((entry, index) => {
            entry.style.setProperty('--river-delay', `${Math.min(index * 100 + 800, 1650)}ms`);
            const y = entry.offsetTop + 16;
            const anchor = riverX(width, y);
            const leftSide = width >= 760 && riverX(width, y + 160) > anchor;
            const cardWidth = width < 760 ? Math.max(0, width - 75) : width * .37;
            const left = width < 760 ? 62 : Math.max(0, Math.min(width - cardWidth, leftSide ? anchor - cardWidth - 24 : anchor + 24));
            entry.style.setProperty('--river-left', `${left}px`);
            entry.style.setProperty('--river-width', `${cardWidth}px`);
            entry.style.setProperty('--river-align', leftSide ? 'right' : 'left');
            entry.style.setProperty('--river-point', `${anchor - left}px`);
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
            const reveal = Math.min(1, Math.max(0, (elapsed - 650) / 900));
            const revealY = height * (1 - Math.pow(1 - reveal, 3));
            const span = Math.max(1, galaxy.clientHeight);
            const dt = reduced.matches || !previousTime ? 0 : Math.min(.1, Math.max(0, (time - previousTime) / 1000));
            previousTime = time;
            for (const particle of dust) {
                particle.u += dt * (.006 + .02 * particle.u);
                if (particle.u > 1) particle.u -= 1;
                const documentY = particle.u * span;
                const y = documentY - offset;
                if (y < -5 || y > height + 5 || (offset === 0 && y > revealY)) continue;
                const center = riverX(width, documentY);
                const spread = (width < 760 ? 16 : 46) * Math.sqrt(particle.u) + 6;
                const x = center + particle.side * spread;
                const fade = Math.pow(1 - particle.u, 1.2);
                const alpha = fade * (.25 + .55 * particle.light);
                if (alpha < .03) continue;
                const hue = (particle.u * 300 + 15) % 360;
                ctx.fillStyle = dark ? `rgba(${color},${alpha})` : `hsla(${hue}, 80%, 48%, ${Math.min(.85, alpha * 1.25)})`;
                ctx.fillRect(Math.round(x / 3) * 3, Math.round(y / 3) * 3, 1.5, 1.5);
            }
            if (offset < 60) {
                const headColor = dark ? color : '139, 76, 210';
                const headX = riverX(width, 0), headY = 4 - offset;
                const arrival = Math.min(1, elapsed / 650);
                const eased = 1 - Math.pow(1 - arrival, 3);
                const startX = Math.min(width - 15, headX + width * .38), startY = headY + Math.min(height * .22, 170);
                const x = startX + (headX - startX) * eased, y = startY + (headY - startY) * eased;
                if (arrival < 1) {
                    const tailX = x + (startX - headX) * .14, tailY = y + (startY - headY) * .14;
                    const streak = ctx.createLinearGradient(x, y, tailX, tailY);
                    streak.addColorStop(0, `rgba(${headColor},.85)`); streak.addColorStop(1, `rgba(${headColor},0)`);
                    ctx.strokeStyle = streak; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tailX, tailY); ctx.stroke();
                }
                const glow = ctx.createRadialGradient(x, y, 0, x, y, 25);
                glow.addColorStop(0, `rgba(${headColor},.95)`); glow.addColorStop(1, `rgba(${headColor},0)`);
                ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill();
            }
        } else {
            const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
            const progress = Math.min(1, Math.max(0, scrollY / max));
            about.style.setProperty('--fall-progress', `${progress * 100}%`);
            velocity *= .92;
            const arrival = reduced.matches ? 1 : Math.min(1, Math.max(0, (time - started) / 1100));
            if (arrival < 1) {
                const title = about.querySelector('.post-title').getBoundingClientRect();
                const x = title.right, targetY = title.top + title.height * .65;
                const y = -100 + (targetY + 100) * arrival * arrival;
                const tail = ctx.createLinearGradient(x, y, x, y - 90);
                tail.addColorStop(0, `rgba(${color},.9)`); tail.addColorStop(1, `rgba(${color},0)`);
                ctx.strokeStyle = tail; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 90); ctx.stroke();
                const glow = ctx.createRadialGradient(x, y, 0, x, y, 22);
                glow.addColorStop(0, `rgba(${color},1)`); glow.addColorStop(1, `rgba(${color},0)`);
                ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
            }
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
        document.addEventListener('visibilitychange', () => { previousTime = 0; schedule(); });
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
