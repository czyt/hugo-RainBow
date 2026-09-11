import { createTetrisGame } from './tetris-engine.mjs';

export function initTetris(root) {
    const game = createTetrisGame();
    const board = root.querySelector('[data-tetris-board]');
    const stage = root.querySelector('[data-tetris-stage]');
    const score = root.querySelector('[data-tetris-score]');
    const lines = root.querySelector('[data-tetris-lines]');
    const status = root.querySelector('[data-tetris-status]');
    const toggle = root.querySelector('[data-tetris-toggle]');
    const cells = Array.from({ length: 160 }, () => {
        const cell = document.createElement('span');
        cell.className = 'tetris-cell';
        stage.appendChild(cell);
        return cell;
    });
    let state = 'ready';
    let timer;

    function render() {
        const active = new Set(game.cells().map(p => p.y * game.cols + p.x));
        cells.forEach((cell, i) => {
            cell.classList.toggle('tetris-cell--filled', Boolean(game.board[Math.floor(i / 10)][i % 10]) || active.has(i));
        });
        score.textContent = game.score;
        lines.textContent = game.lines;
    }
    function setState(next) {
        clearTimeout(timer);
        state = next;
        root.dataset.state = next;
        status.textContent = root.dataset[next];
        toggle.textContent = root.dataset[next === 'running' ? 'pause' : next === 'paused' ? 'resume' : next === 'over' ? 'restart' : 'start'];
        if (state === 'running') timer = setTimeout(tick, game.interval);
    }
    function tick() {
        game.step();
        render();
        if (game.ended) setState('over');
        else timer = setTimeout(tick, game.interval);
    }
    function togglePlay() {
        if (state === 'running') setState('paused');
        else {
            if (state === 'over') game.reset();
            render();
            setState('running');
            board.focus({ preventScroll: true });
        }
    }
    function action(name) {
        if (state !== 'running') return;
        if (name === 'left') game.move(-1, 0);
        else if (name === 'right') game.move(1, 0);
        else if (name === 'rotate') game.rotate();
        else if (name === 'down') game.step(true);
        else if (name === 'drop') game.drop();
        render();
        // Manual drops start a fresh gravity interval for the next piece.
        if (game.ended) setState('over');
        else if (name === 'down' || name === 'drop') setState('running');
    }
    const keys = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'rotate', w: 'rotate', ArrowDown: 'down', s: 'down', ' ': 'drop' };
    root.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        if (event.target !== board) return;
        if (keys[event.key] && state === 'running') {
            event.preventDefault();
            if (!event.repeat || ![' ', 'ArrowUp', 'w'].includes(event.key)) action(keys[event.key]);
        } else if (event.key === 'p' || (event.key === 'Escape' && state === 'running')) {
            event.preventDefault();
            if (!event.repeat) togglePlay();
        }
    });
    root.querySelectorAll('[data-tetris-action]').forEach(button => {
        button.addEventListener('click', () => {
            action(button.dataset.tetrisAction);
            board.focus({ preventScroll: true });
        });
    });
    // Keep Safari's pointer focus behavior from pausing before a button click.
    root.addEventListener('pointerdown', event => {
        const button = event.target.closest('button');
        if (!button || !event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        button.focus({ preventScroll: true });
    });
    toggle.addEventListener('click', togglePlay);
    function pause() { if (state === 'running') setState('paused'); }
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    window.addEventListener('blur', pause);
    window.addEventListener('pagehide', pause);
    root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) pause(); });
    render();
    setState('ready');
    return { pause };
}
