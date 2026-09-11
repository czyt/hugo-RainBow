import { createSnakeGame } from './snake-engine.mjs';

export function initSnake(root) {
    const board = root.querySelector('[data-snake-board]');
    const stage = root.querySelector('[data-snake-stage]');
    const score = root.querySelector('[data-snake-score]');
    const status = root.querySelector('[data-snake-status]');
    const toggle = root.querySelector('[data-snake-toggle]');
    const compact = matchMedia('(max-width: 480px)').matches;
    const game = createSnakeGame(compact ? 16 : 28, 16);
    const cells = [];
    let state = 'ready';
    let timer;
    let pointer;

    stage.style.setProperty('--snake-cols', game.cols);
    stage.style.setProperty('--snake-rows', game.rows);
    for (let i = 0; i < game.cols * game.rows; i++) {
        const cell = document.createElement('span');
        cell.className = 'snake-cell';
        stage.appendChild(cell);
        cells.push(cell);
    }

    function render() {
        const body = new Map(game.snake.map((p, i) => [p.y * game.cols + p.x, i]));
        cells.forEach((cell, index) => {
            const x = index % game.cols;
            const y = Math.floor(index / game.cols);
            const segment = body.get(index);
            let kind = '';
            let arrow = '';
            if (segment !== undefined) kind = segment === 0 ? 'head' : 'body';
            else if (game.food) {
                if (x === game.food.x && y === game.food.y) kind = 'food';
                else if (x === game.food.x) arrow = y < game.food.y ? '↓' : '↑';
                else if (y === game.food.y) arrow = x < game.food.x ? '→' : '←';
            }
            cell.className = `snake-cell${kind ? ` snake-cell--${kind}` : ''}`;
            cell.textContent = arrow;
            cell.style.setProperty('--snake-alpha', segment === undefined ? 1 : 1 - segment / game.snake.length * 0.6);
        });
        score.textContent = game.score;
    }

    function setState(next) {
        clearTimeout(timer);
        state = next;
        root.dataset.state = state;
        status.textContent = root.dataset[state];
        toggle.textContent = root.dataset[state === 'running' ? 'pause' : state === 'paused' ? 'resume' : state === 'ready' ? 'start' : 'restart'];
        if (state === 'running') timer = setTimeout(tick, game.interval);
    }

    function tick() {
        game.step();
        render();
        if (game.ended) setState(game.won ? 'won' : 'over');
        else timer = setTimeout(tick, game.interval);
    }

    function togglePlay() {
        if (state === 'running') setState('paused');
        else {
            if (state === 'over' || state === 'won') game.reset();
            render();
            setState('running');
            board.focus({ preventScroll: true });
        }
    }

    const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
    root.addEventListener('keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const direction = keys[event.key];
        if (direction && state === 'running') {
            event.preventDefault();
            game.turn(direction);
        } else if ((event.key === ' ' && event.target === board) || (event.key === 'Escape' && state === 'running')) {
            event.preventDefault();
            if (!event.repeat) togglePlay();
        }
    });
    // Keep Safari's pointer focus behavior from pausing before a button click.
    root.addEventListener('pointerdown', event => {
        const button = event.target.closest('button');
        if (!button || !event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        button.focus({ preventScroll: true });
    });
    toggle.addEventListener('click', togglePlay);
    root.querySelectorAll('[data-snake-direction]').forEach(button => {
        button.addEventListener('click', () => {
            if (state === 'running') game.turn(button.dataset.snakeDirection);
            board.focus({ preventScroll: true });
        });
    });
    board.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button !== 0) return;
        board.focus({ preventScroll: true });
        pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
        board.setPointerCapture(event.pointerId);
    });
    board.addEventListener('pointerup', event => {
        if (!pointer || pointer.id !== event.pointerId) return;
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        pointer = null;
        if (state !== 'running' || Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
        game.turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });
    board.addEventListener('pointercancel', () => { pointer = null; });
    function pause() { if (state === 'running') setState('paused'); }
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    window.addEventListener('blur', pause);
    window.addEventListener('pagehide', pause);
    root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) pause(); });
    render();
    setState('ready');
    return { pause };
}
