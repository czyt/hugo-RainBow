const shapes = [
    [[1, 1, 1, 1]], [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]],
];

export function createTetrisGame(random = Math.random) {
    const game = {
        cols: 10, rows: 16, board: [], active: null, bag: [], score: 0, lines: 0, ended: false,
        get level() { return Math.floor(this.lines / 10) + 1; },
        get interval() { return Math.max(100, 800 - (this.level - 1) * 60); },
        reset() {
            this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
            this.bag = [];
            this.score = this.lines = 0;
            this.ended = false;
            this.spawn();
        },
        spawn() {
            if (!this.bag.length) {
                this.bag = shapes.map((_, i) => i);
                for (let i = this.bag.length - 1; i > 0; i--) {
                    const j = Math.floor(random() * (i + 1));
                    [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
                }
            }
            const matrix = shapes[this.bag.pop()].map(row => [...row]);
            this.active = { matrix, x: Math.floor((this.cols - matrix[0].length) / 2), y: 0 };
            if (!this.fits(this.active)) this.ended = true;
        },
        cells(piece = this.active) {
            return piece.matrix.flatMap((row, y) => row.flatMap((filled, x) => filled ? [{ x: piece.x + x, y: piece.y + y }] : []));
        },
        fits(piece) {
            return this.cells(piece).every(({ x, y }) => x >= 0 && x < this.cols && y >= 0 && y < this.rows && !this.board[y][x]);
        },
        move(dx, dy) {
            if (this.ended) return false;
            const next = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
            if (!this.fits(next)) return false;
            this.active = next;
            return true;
        },
        rotate() {
            if (this.ended) return false;
            const old = this.active.matrix;
            const matrix = old[0].map((_, x) => old.map(row => row[x]).reverse());
            for (const dx of [0, -1, 1, -2, 2]) {
                const next = { ...this.active, matrix, x: this.active.x + dx };
                if (this.fits(next)) { this.active = next; return true; }
            }
            return false;
        },
        lock() {
            if (this.ended) return;
            this.cells().forEach(({ x, y }) => { this.board[y][x] = 1; });
            const remaining = this.board.filter(row => !row.every(Boolean));
            const cleared = this.rows - remaining.length;
            this.score += [0, 100, 300, 500, 800][cleared] * this.level;
            this.lines += cleared;
            this.board = [...Array.from({ length: cleared }, () => Array(this.cols).fill(0)), ...remaining];
            this.spawn();
        },
        step(soft = false) {
            if (this.ended) return;
            if (this.move(0, 1)) { if (soft) this.score++; }
            else this.lock();
        },
        drop() {
            if (this.ended) return;
            while (this.move(0, 1)) this.score += 2;
            this.lock();
        },
    };
    game.reset();
    return game;
}
