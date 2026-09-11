import test from 'node:test';
import assert from 'node:assert/strict';
import { createTetrisGame } from '../assets/js/tetris-engine.mjs';

test('each bag contains all seven pieces and reset clears the round', () => {
    const game = createTetrisGame(() => .5);
    const pieces = new Set();
    for (let i = 0; i < 7; i++) {
        pieces.add(JSON.stringify(game.active.matrix));
        assert.equal(game.cells().length, 4);
        assert.ok(game.fits(game.active));
        if (i < 6) game.spawn();
    }
    assert.equal(pieces.size, 7);
    game.drop();
    game.reset();
    assert.equal(game.score, 0);
    assert.equal(game.lines, 0);
    assert.equal(game.ended, false);
    assert.ok(game.board.flat().every(value => value === 0));
});

test('moves and rotations respect walls and occupied cells', () => {
    const game = createTetrisGame();
    game.active = { matrix: [[1], [1], [1], [1]], x: 9, y: 2 };
    assert.equal(game.move(1, 0), false);
    assert.equal(game.rotate(), false); // Two-cell wall kicks cannot fit four cells here.
    game.move(-1, 0);
    assert.equal(game.rotate(), true);
    assert.equal(game.active.x, 6);
    assert.ok(game.fits(game.active));
    game.board[3][6] = 1;
    assert.equal(game.move(0, 1), false);
    const before = structuredClone(game.active);
    assert.equal(game.move(-20, 0), false);
    assert.deepEqual(game.active, before);
});

test('rotation at the floor does not cross the board boundary', () => {
    const game = createTetrisGame();
    game.active = { matrix: [[1, 1, 1, 1]], x: 3, y: 15 };
    assert.equal(game.rotate(), false);
    assert.equal(game.active.y, 15);
    assert.equal(game.cells().length, 4);
});

test('clears adjacent lines together and shifts upper blocks correctly', () => {
    const game = createTetrisGame();
    game.board[14] = game.board[15] = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0];
    game.board[13][0] = 1;
    game.active = { matrix: [[1, 1], [1, 1]], x: 8, y: 14 };
    game.lock();
    assert.equal(game.lines, 2);
    assert.equal(game.score, 300);
    assert.equal(game.board[15][0], 1);
    assert.equal(game.board.flat().reduce((sum, value) => sum + value), 1);
});

test('four-line clear scores 800 and preserves the board dimensions', () => {
    const game = createTetrisGame();
    for (let y = 12; y < 16; y++) game.board[y] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
    game.active = { matrix: [[1], [1], [1], [1]], x: 9, y: 12 };
    game.lock();
    assert.equal(game.lines, 4);
    assert.equal(game.score, 800);
    assert.equal(game.board.length, 16);
    assert.ok(game.board.every(row => row.length === 10 && row.every(value => !value)));
});

test('soft and hard drops score distance, lock and spawn another piece', () => {
    const game = createTetrisGame();
    game.active = { matrix: [[1, 1], [1, 1]], x: 4, y: 0 };
    game.step(true);
    assert.equal(game.score, 1);
    assert.equal(game.active.y, 1);
    game.drop();
    assert.equal(game.score, 27);
    assert.equal(game.board[15][4], 1);
    assert.equal(game.board[14][5], 1);
    assert.equal(game.active.y, 0);
});

test('blocked spawn ends the game and further input does not alter it', () => {
    const game = createTetrisGame();
    game.board[0][3] = 1;
    game.bag = [0];
    game.spawn();
    assert.equal(game.ended, true);
    const before = JSON.stringify({ board: game.board, active: game.active, score: game.score });
    game.drop();
    game.step(true);
    game.rotate();
    game.move(1, 0);
    assert.equal(JSON.stringify({ board: game.board, active: game.active, score: game.score }), before);
});

test('every ten lines increases gravity speed, with a playable lower bound', () => {
    const game = createTetrisGame();
    const interval = game.interval;
    game.lines = 10;
    assert.equal(game.level, 2);
    assert.ok(game.interval < interval);
    game.lines = 1000;
    assert.equal(game.interval, 100);
});
