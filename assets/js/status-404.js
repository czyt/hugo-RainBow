// A short, decorative text reveal; the accessible heading is always stable.
(() => {
    const chars = Array.from(document.querySelectorAll('[data-status-char]'));
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!chars.length || motion.matches) return;
    const glyphs = ['#', '/', '?', '<', '>', '_'];
    let frame = 0;
    let start;
    let lastStep = -1;
    function finish() {
        cancelAnimationFrame(frame);
        chars.forEach(char => { char.textContent = char.dataset.statusChar; });
        motion.removeEventListener('change', finish);
        document.removeEventListener('visibilitychange', onVisibility);
    }
    function onVisibility() { if (document.hidden) finish(); }
    function reveal(time) {
        start ??= time;
        const elapsed = time - start;
        const step = Math.floor(elapsed / 80);
        if (step !== lastStep) {
            chars.forEach((char, index) => {
                char.textContent = elapsed >= 320 + index * 160
                    ? char.dataset.statusChar
                    : glyphs[(step + index * 2) % glyphs.length];
            });
            lastStep = step;
        }
        if (elapsed >= 640) finish();
        else frame = requestAnimationFrame(reveal);
    }
    motion.addEventListener('change', finish);
    document.addEventListener('visibilitychange', onVisibility);
    frame = requestAnimationFrame(reveal);
})();
