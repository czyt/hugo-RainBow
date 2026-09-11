const directions = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const same = (a, b) => a.x === b.x && a.y === b.y;

export function createSnakeGame(cols, rows, random = Math.random) {
    const game = {
        cols, rows, snake: [], food: null, score: 0, direction: 'right',
        turns: [], ended: false, won: false,
        get interval() { return Math.max(65, 170 - this.score * 4); },
        reset() {
            this.snake = Array.from({ length: 5 }, (_, i) => ({ x: 7 - i, y: Math.floor(rows / 2) }));
            this.score = 0;
            this.direction = 'right';
            this.turns = [];
            this.ended = this.won = false;
            this.placeFood();
        },
        placeFood() {
            const occupied = new Set(this.snake.map(p => p.y * cols + p.x));
            const empty = [];
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (!occupied.has(y * cols + x)) empty.push({ x, y });
                }
            }
            this.food = empty[Math.floor(random() * empty.length)] ?? null;
            if (!this.food) this.ended = this.won = true;
        },
        turn(direction) {
            const next = directions[direction];
            const previous = directions[this.turns.at(-1) ?? this.direction];
            if (!next || this.ended || this.turns.length >= 2) return;
            if (next.x === previous.x || next.y === previous.y) return;
            this.turns.push(direction);
        },
        step() {
            if (this.ended) return;
            this.direction = this.turns.shift() ?? this.direction;
            const delta = directions[this.direction];
            const head = {
                x: (this.snake[0].x + delta.x + cols) % cols,
                y: (this.snake[0].y + delta.y + rows) % rows,
            };
            const eating = this.food && same(head, this.food);
            // The tail vacates its cell on a move that does not grow the snake.
            const body = eating ? this.snake : this.snake.slice(0, -1);
            if (body.some(p => same(p, head))) {
                this.ended = true;
                return;
            }
            this.snake.unshift(head);
            if (eating) {
                this.score++;
                this.placeFood();
            } else this.snake.pop();
        },
    };
    game.reset();
    return game;
}
