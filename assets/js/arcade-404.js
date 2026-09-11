import { initSnake } from './snake-404.js';
import { initTetris } from './tetris-404.js';

(() => {
    const root = document.querySelector('[data-arcade]');
    if (!root) return;
    const panels = [...root.querySelectorAll('[data-arcade-panel]')];
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const games = [initSnake(panels[0]), initTetris(panels[1])];
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0;
    let animation;

    function select(index, animate = false) {
        if (index === current) return;
        games[current].pause();
        animation?.cancel();
        current = index;
        panels.forEach((panel, i) => {
            panel.inert = i !== current;
            panel.setAttribute('aria-hidden', String(i !== current));
            tabs[i].setAttribute('aria-selected', String(i === current));
            tabs[i].tabIndex = i === current ? 0 : -1;
        });
        if (animate && !reducedMotion.matches) {
            animation = panels[current].animate([{ opacity: .35 }, { opacity: 1 }], { duration: 140, easing: 'cubic-bezier(.23, 1, .32, 1)' });
        }
    }
    tabs.forEach((tab, i) => {
        tab.addEventListener('click', event => select(i, event.detail > 0));
        tab.addEventListener('keydown', event => {
            const index = { ArrowLeft: (i + tabs.length - 1) % tabs.length, ArrowRight: (i + 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
            if (index === undefined) return;
            event.preventDefault();
            select(index);
            tabs[index].focus({ preventScroll: true });
        });
    });
    reducedMotion.addEventListener('change', () => animation?.cancel());
    root.hidden = false;
})();
