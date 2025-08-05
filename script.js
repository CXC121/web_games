// 游戏常量
const GRID_SIZE = 20;
const CELL_SIZE = 20;

// 游戏状态
let snake = [{ x: 10, y: 10 }];
let food = generateFood();
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let gameInterval;
let isPaused = false;

// 获取DOM元素
const gameBoard = document.getElementById('gameBoard');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

// 初始化游戏板
function initializeGameBoard() {
    gameBoard.style.width = `${GRID_SIZE * CELL_SIZE}px`;
    gameBoard.style.height = `${GRID_SIZE * CELL_SIZE}px`;
    gameBoard.innerHTML = '';

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.x = x;
            cell.dataset.y = y;
            gameBoard.appendChild(cell);
        }
    }
}

// 生成食物位置
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

    return newFood;
}

// 绘制游戏元素
function draw() {
    // 清空游戏板
    document.querySelectorAll('.snake, .food').forEach(el => {
        el.classList.remove('snake', 'food');
    });

    // 绘制蛇
    snake.forEach(segment => {
        const cell = document.querySelector(`[data-x="${segment.x}"][data-y="${segment.y}"]`);
        if (cell) {
            cell.classList.add('snake');
        }
    });

    // 绘制食物
    const foodCell = document.querySelector(`[data-x="${food.x}"][data-y="${food.y}"]`);
    if (foodCell) {
        foodCell.classList.add('food');
    }
}

// 更新游戏状态
function update() {
    if (isPaused) return;

    // 更新方向
    direction = { ...nextDirection };

    // 如果游戏未开始（方向未设置），则不移动
    if (direction.x === 0 && direction.y === 0) return;

    // 获取蛇头
    const head = { ...snake[0] };

    // 移动蛇头
    head.x += direction.x;
    head.y += direction.y;

    // 检测碰撞
    // 1. 撞墙
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver();
        return;
    }

    // 2. 撞自己
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    // 添加新头
    snake.unshift(head);

    // 检测是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score += 10;
        scoreElement.textContent = score;

        // 生成新食物
        food = generateFood();
    } else {
        // 移除尾部
        snake.pop();
    }

    // 绘制更新后的游戏
    draw();
}

// 游戏结束
function gameOver() {
    clearInterval(gameInterval);
    alert(`游戏结束！得分: ${score}`);
    resetGame();
}

// 重置游戏
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    food = generateFood();
    direction = { x: 0, y: 0 };
    nextDirection = { x: 0, y: 0 };
    score = 0;
    scoreElement.textContent = score;
    isPaused = false;
    draw();
}

// 开始游戏
function startGame() {
    if (gameInterval) clearInterval(gameInterval);

    // 如果是第一次开始游戏，设置初始方向为向右
    if (direction.x === 0 && direction.y === 0) {
        nextDirection = { x: 1, y: 0 };
    }

    isPaused = false;
    gameInterval = setInterval(update, 150);
}

// 暂停游戏
function pauseGame() {
    isPaused = !isPaused;
    if (!isPaused) {
        // 如果从暂停状态恢复，立即更新一次
        update();
    }
}

// 处理键盘控制
function handleKeyDown(e) {
    // 防止方向反转
    const goingUp = direction.y === -1;
    const goingDown = direction.y === 1;
    const goingLeft = direction.x === -1;
    const goingRight = direction.x === 1;

    switch (e.key) {
        case 'ArrowUp':
            if (!goingDown) {
                nextDirection = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            if (!goingUp) {
                nextDirection = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            if (!goingRight) {
                nextDirection = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (!goingLeft) {
                nextDirection = { x: 1, y: 0 };
            }
            break;
        case ' ': // 空格键暂停/继续
            pauseGame();
            break;
    }
}

// 事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
window.addEventListener('keydown', handleKeyDown);

// 初始化游戏
initializeGameBoard();
draw();