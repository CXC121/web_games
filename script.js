// 游戏常量
const GRID_SIZE = 20;
const CELL_SIZE = 20;

// 游戏状态
let snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
];
let food = { x: 0, y: 0, type: 'normal', score: 10, color: '#FF5252' };
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameLoopInterval = null;
let isPaused = false;
let isGameOver = false;

// 控制是否自动开始游戏
let autoStart = false; // 设置为false禁用自动开始

// 游戏难度设置
let difficulty = 'easy'; // 默认简单难度
const difficultyLevels = {
    easy: 200,    // 200ms每帧
    medium: 150,  // 150ms每帧
    hard: 100     // 100ms每帧
};

// 最高分
let highScore = localStorage.getItem('snakeHighScore') || 0;
const highScoreElement = document.getElementById('highScore');
if (highScoreElement) {
    highScoreElement.textContent = highScore;
}

// 获取DOM元素
const gameBoard = document.getElementById('gameBoard');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

// 初始化分数显示
function updateScore() {
    scoreElement.textContent = score;
}

// 初始化游戏板
function initializeGameBoard() {
    gameBoard.style.width = `${GRID_SIZE * CELL_SIZE}px`;
    gameBoard.style.height = `${GRID_SIZE * CELL_SIZE}px`;
    gameBoard.innerHTML = '';

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.style.width = `${CELL_SIZE}px`;
            cell.style.height = `${CELL_SIZE}px`;
            cell.dataset.x = x;
            cell.dataset.y = y;
            gameBoard.appendChild(cell);
        }
    }
}

// 食物类型定义
const foodTypes = [
    { type: 'normal', score: 10, color: '#FF5252' },  // 普通食物，10分，红色
    { type: 'special', score: 20, color: '#FFC107' }, // 特殊食物，20分，黄色
    { type: 'bonus', score: 30, color: '#2196F3' }    // 奖励食物，30分，蓝色
];

// 生成食物位置和类型
function generateFood() {
    let newFood;
    do {
        // 随机位置
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        
        // 随机类型（概率不同）
        let typeIndex;
        const rand = Math.random();
        if (rand < 0.7) {
            typeIndex = 0;  // 70% 概率普通食物
        } else if (rand < 0.9) {
            typeIndex = 1;  // 20% 概率特殊食物
        } else {
            typeIndex = 2;  // 10% 概率奖励食物
        }
        
        newFood = {
            x: x,
            y: y,
            type: foodTypes[typeIndex].type,
            score: foodTypes[typeIndex].score,
            color: foodTypes[typeIndex].color
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

    return newFood;
}

// 方向转换为坐标
function getDirectionVector(dir) {
    switch (dir) {
        case 'up':
            return { x: 0, y: -1 };
        case 'down':
            return { x: 0, y: 1 };
        case 'left':
            return { x: -1, y: 0 };
        case 'right':
            return { x: 1, y: 0 };
        default:
            return { x: 0, y: 0 };
    }
}

// 绘制游戏元素
function draw() {
    // 获取调试信息元素
    const debugInfo = document.getElementById('debugInfo');
    let debugText = '调试信息:\n';

    debugText += '蛇的位置: ' + JSON.stringify(snake) + '\n';
    debugText += '食物的位置: ' + JSON.stringify(food) + '\n';
    debugText += '当前方向: ' + direction + '\n';
    debugText += '下一个方向: ' + nextDirection + '\n';
    debugText += '游戏循环状态: ' + (gameLoopInterval ? '运行中' : '已停止') + '\n';

    // 清空游戏板
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('snake', 'food', 'food-normal', 'food-special', 'food-bonus');
        cell.style.backgroundColor = '';  // 重置背景色
    });

    // 绘制蛇
    snake.forEach(segment => {
        const cell = document.querySelector(`.cell[data-x="${segment.x}"][data-y="${segment.y}"]`);
        if (cell) {
            cell.classList.add('snake');
            debugText += '成功绘制蛇段: ' + JSON.stringify(segment) + '\n';
        } else {
            debugText += '无法找到蛇段单元格: ' + JSON.stringify(segment) + '\n';
        }
    });

    // 绘制食物
    const foodCell = document.querySelector(`.cell[data-x="${food.x}"][data-y="${food.y}"]`);
    if (foodCell) {
        foodCell.classList.add('food');
        foodCell.classList.add(`food-${food.type}`);
        foodCell.style.backgroundColor = food.color;
        debugText += '成功绘制食物: ' + JSON.stringify(food) + '\n';
    } else {
        debugText += '无法找到食物单元格: ' + JSON.stringify(food) + '\n';
    }

    // 更新调试信息
    if (debugInfo) {
        debugInfo.textContent = debugText;
    }
}

// 更新游戏状态
function update() {
    if (isPaused || isGameOver) return;

    // 更新方向
    direction = nextDirection;

    // 获取方向向量
    const dirVector = getDirectionVector(direction);

    // 获取蛇头
    const head = { ...snake[0] };

    // 移动蛇头
    head.x += dirVector.x;
    head.y += dirVector.y;

    // 检测碰撞
    // 1. 撞墙
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver();
        return;
    }

    // 2. 撞自己 - 排除蛇头本身
    if (snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    // 添加新头
    snake.unshift(head);

    // 检测是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score += food.score;
        scoreElement.textContent = score;

        // 显示得分提示
        const scorePopup = document.createElement('div');
        scorePopup.classList.add('score-popup');
        scorePopup.textContent = `+${food.score}`;
        scorePopup.style.position = 'absolute';
        scorePopup.style.left = `${(food.x * CELL_SIZE) + gameBoard.offsetLeft}px`;
        scorePopup.style.top = `${(food.y * CELL_SIZE) + gameBoard.offsetTop}px`;
        scorePopup.style.color = food.color;
        scorePopup.style.fontWeight = 'bold';
        scorePopup.style.fontSize = '16px';
        scorePopup.style.pointerEvents = 'none';
        scorePopup.style.zIndex = '100';
        document.body.appendChild(scorePopup);

        // 动画效果
        setTimeout(() => {
            scorePopup.style.opacity = '0';
            scorePopup.style.transform = 'translateY(-20px)';
            scorePopup.style.transition = 'opacity 0.5s, transform 0.5s';
            setTimeout(() => {
                document.body.removeChild(scorePopup);
            }, 500);
        }, 100);

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
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    isGameOver = true;
    
    // 检查是否打破最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        if (highScoreElement) {
            highScoreElement.textContent = highScore;
        }
        alert(`恭喜！新纪录: ${highScore}`);
    } else {
        alert(`游戏结束！得分: ${score}`);
    }
}

// 重置游戏
function resetGame() {
    initGame();
}

// 开始游戏
function startGame() {
    if (isGameOver) {
        // 游戏结束后重新开始
        initGame();
        // 启动游戏循环
        startGameLoop();
    } else {
        // 从暂停状态恢复
        isPaused = false;
        // 确保游戏循环正在运行
        if (!gameLoopInterval) {
            startGameLoop();
        }
        // 立即更新一次
        update();
    }
}

// 设置难度
function setDifficulty(level) {
    difficulty = level;
    // 更新按钮样式
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${level}Btn`).classList.add('active');
    
    // 如果游戏正在进行，立即应用新难度
    if (gameLoopInterval) {
        startGame();
    }
}

// 添加难度按钮事件监听
const easyBtn = document.getElementById('easyBtn');
const mediumBtn = document.getElementById('mediumBtn');
const hardBtn = document.getElementById('hardBtn');

easyBtn.addEventListener('click', () => setDifficulty('easy'));
mediumBtn.addEventListener('click', () => setDifficulty('medium'));
hardBtn.addEventListener('click', () => setDifficulty('hard'));

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
    const goingUp = direction === 'up';
    const goingDown = direction === 'down';
    const goingLeft = direction === 'left';
    const goingRight = direction === 'right';

    switch (e.key) {
        case 'ArrowUp':
            if (!goingDown) {
                nextDirection = 'up';
            }
            break;
        case 'ArrowDown':
            if (!goingUp) {
                nextDirection = 'down';
            }
            break;
        case 'ArrowLeft':
            if (!goingRight) {
                nextDirection = 'left';
            }
            break;
        case 'ArrowRight':
            if (!goingLeft) {
                nextDirection = 'right';
            }
            break;
        case ' ':  // 空格键暂停
            pauseGame();
            break;
    }
}

// 事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
window.addEventListener('keydown', handleKeyDown);

// 添加触摸控制
let touchStartX = 0;
let touchStartY = 0;

// 触摸开始时记录坐标
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

// 触摸结束时计算滑动方向
function handleTouchEnd(e) {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // 防止方向反转
    const goingUp = direction === 'up';
    const goingDown = direction === 'down';
    const goingLeft = direction === 'left';
    const goingRight = direction === 'right';

    // 根据滑动距离判断方向
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // 水平滑动
        if (diffX > 50 && !goingLeft) {
            nextDirection = 'right';
        } else if (diffX < -50 && !goingRight) {
            nextDirection = 'left';
        }
    } else {
        // 垂直滑动
        if (diffY > 50 && !goingUp) {
            nextDirection = 'down';
        } else if (diffY < -50 && !goingDown) {
            nextDirection = 'up';
        }
    }

    // 重置触摸起始坐标
    touchStartX = 0;
    touchStartY = 0;
}

// 为游戏板添加触摸事件监听
gameBoard.addEventListener('touchstart', handleTouchStart, false);
gameBoard.addEventListener('touchend', handleTouchEnd, false);

// 防止触摸事件被浏览器默认行为干扰
gameBoard.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, false);
gameBoard.addEventListener('touchstart', function(e) {
    e.preventDefault();
}, false);
gameBoard.addEventListener('touchend', function(e) {
    e.preventDefault();
}, false);

// 初始化游戏
function initGame() {
    // 确保游戏板已清空
    gameBoard.innerHTML = '';
    
    // 重新初始化游戏板
    initializeGameBoard();
    
    // 重置蛇位置
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    
    // 生成新食物
    food = generateFood();
    
    // 重置方向
    direction = 'right';
    nextDirection = 'right';
    
    // 重置分数
    score = 0;
    updateScore();
    
    // 重置游戏状态
    isGameOver = false;
    isPaused = false;
    
    // 立即绘制游戏元素
    draw();
    
    // 根据autoStart标志决定是否启动游戏循环
    if (autoStart) {
        startGameLoop();
    } else {
        // 如果不自动开始，显示提示信息
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.textContent += '\n游戏已准备就绪，请点击开始按钮开始游戏';
        }
    }
}

// 开始游戏循环
function startGameLoop() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
    }
    // 根据难度设置游戏速度
    const difficultySpeed = difficultyLevels[difficulty];
    gameLoopInterval = setInterval(update, difficultySpeed);
}

// 初始化食物
food = generateFood();

// 启动游戏初始化
initGame();