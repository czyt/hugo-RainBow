// A lightweight projected star field. The CSS sky remains the fallback.
(() => {
    const canvas = document.querySelector('.space-depth');
    const context = canvas?.getContext('2d');
    if (!context) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const stars = Array.from({ length: 72 }, (_, i) => ({
        x: ((i * 67 % 149) / 74 - 1),
        y: ((i * 43 % 137) / 68 - 1),
        z: .25 + (i * 37 % 100) / 100,
        size: i % 9 === 0 ? 1.6 : .9
    }));
    let width = 0, height = 0, frame = 0, previous = 0;
    let targetX = 0, targetY = 0, x = 0, y = 0;
    let color = getComputedStyle(document.documentElement).getPropertyValue('--rainbow-accent').trim();
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function tick(time) {
        frame = 0;
        if (document.hidden || motion.matches) { previous = 0; return; }
        const dt = previous ? Math.min(time - previous, 50) : 0;
        previous = time;
        const smoothing = 1 - Math.exp(-dt / 250);
        x += (targetX - x) * smoothing;
        y += (targetY - y) * smoothing;
        context.clearRect(0, 0, width, height);
        context.fillStyle = color;
        for (const star of stars) {
            star.z -= dt * .000006;
            if (star.z < .25) star.z = 1.25;
            const depth = 1 / star.z;
            const px = width / 2 + star.x * width * .47 * depth + x * depth * 10;
            const py = height / 2 + star.y * height * .47 * depth + y * depth * 10;
            if (px < 0 || py < 0 || px > width || py > height) continue;
            context.globalAlpha = Math.min(.32, .07 + (1.25 - star.z) * .2);
            context.beginPath();
            context.arc(px, py, star.size * Math.min(depth, 2), 0, Math.PI * 2);
            context.fill();
        }
        context.globalAlpha = 1;
        frame = requestAnimationFrame(tick);
    }
    function schedule() {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
        if (motion.matches || document.hidden) context.clearRect(0, 0, width, height);
        else frame = requestAnimationFrame(tick);
    }
    window.addEventListener('resize', () => { resize(); schedule(); }, { passive: true });
    window.addEventListener('pointermove', event => {
        if (!finePointer.matches || event.pointerType !== 'mouse') return;
        targetX = (event.clientX / width - .5) * 2;
        targetY = (event.clientY / height - .5) * 2;
    }, { passive: true });
    new MutationObserver(() => {
        color = getComputedStyle(document.documentElement).getPropertyValue('--rainbow-accent').trim();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', schedule);
    resize();
    schedule();
})();
