import test from 'node:test';
import assert from 'node:assert/strict';
import { createSnakeGame } from '../assets/js/snake-engine.mjs';

test('food stays off the snake; eating grows it, scores and speeds up', () => {
    const game = createSnakeGame(28, 16, () => 0);
    game.food = { x: 8, y: 8 };
    const interval = game.interval;
    game.step();
    assert.equal(game.score, 1);
    assert.equal(game.snake.length, 6);
    assert.ok(game.interval < interval);
    assert.ok(!game.snake.some(p => p.x === game.food.x && p.y === game.food.y));
    game.score = 1000;
    assert.equal(game.interval, 65);
});

test('wraps all four edges', () => {
    for (const [direction, head, expected] of [
        ['right', { x: 27, y: 5 }, { x: 0, y: 5 }],
        ['left', { x: 0, y: 5 }, { x: 27, y: 5 }],
        ['up', { x: 5, y: 0 }, { x: 5, y: 15 }],
        ['down', { x: 5, y: 15 }, { x: 5, y: 0 }],
    ]) {
        const game = createSnakeGame(28, 16);
        game.snake = [head];
        game.food = { x: 10, y: 10 };
        game.direction = direction;
        game.step();
        assert.deepEqual(game.snake[0], expected);
        assert.equal(game.ended, false);
    }
});

test('ignores reversals and preserves two rapid turns across separate steps', () => {
    const game = createSnakeGame(28, 16);
    game.turn('left');
    assert.deepEqual(game.turns, []);
    game.turn('up');
    game.turn('down');
    game.turn('left');
    game.turn('down');
    assert.deepEqual(game.turns, ['up', 'left']);
    game.step();
    assert.deepEqual(game.snake[0], { x: 7, y: 7 });
    game.step();
    assert.deepEqual(game.snake[0], { x: 6, y: 7 });
    assert.equal(game.ended, false);
});

test('self collision ends the round; reset clears score and pending turns', () => {
    const game = createSnakeGame(28, 16);
    game.snake = [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 }];
    game.step();
    assert.equal(game.ended, true);
    const snake = structuredClone(game.snake);
    game.step();
    assert.deepEqual(game.snake, snake);
    game.reset();
    assert.equal(game.ended, false);
    assert.equal(game.score, 0);
    assert.equal(game.snake.length, 5);
    assert.deepEqual(game.turns, []);
});

test('moving into the departing tail is legal', () => {
    const game = createSnakeGame(28, 16);
    game.snake = [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }];
    game.food = { x: 10, y: 10 };
    game.step();
    assert.equal(game.ended, false);
    assert.deepEqual(game.snake[0], { x: 3, y: 2 });
});

test('filling the board wins without trying to spawn food on an occupied cell', () => {
    const game = createSnakeGame(8, 2, () => 0);
    game.snake = [
        ...Array.from({ length: 7 }, (_, i) => ({ x: 6 - i, y: 0 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: i, y: 1 })),
    ];
    game.food = { x: 7, y: 0 };
    game.step();
    assert.equal(game.snake.length, 16);
    assert.equal(game.score, 1);
    assert.equal(game.won, true);
    assert.equal(game.ended, true);
    assert.equal(game.food, null);
});
