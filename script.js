document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const status = document.getElementById('status');
    const size = 15;
    let currentPlayer = 'black';
    let gameOver = false;
    const boardState = Array(size).fill(null).map(() => Array(size).fill(null));

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', () => handleCellClick(i, j));
            board.appendChild(cell);
        }
    }

    function handleCellClick(row, col) {
        if (gameOver || boardState[row][col]) return;

        boardState[row][col] = currentPlayer;
        const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
        cell.classList.add(currentPlayer);

        if (checkWin(row, col)) {
            status.textContent = `${currentPlayer === 'black' ? '黑棋' : '白棋'}获胜!`;
            gameOver = true;
        } else {
            currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
            status.textContent = `当前玩家: ${currentPlayer === 'black' ? '黑棋' : '白棋'}`;
        }
    }

    function checkWin(row, col) {
        const directions = [
            { x: 1, y: 0 }, // 水平
            { x: 0, y: 1 }, // 垂直
            { x: 1, y: 1 }, // 斜对角
            { x: 1, y: -1 } // 反斜对角
        ];

        for (const { x, y } of directions) {
            let count = 1;
            for (let i = 1; i < 5; i++) {
                const newRow = row + i * y;
                const newCol = col + i * x;
                if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size && boardState[newRow][newCol] === currentPlayer) {
                    count++;
                } else {
                    break;
                }
            }
            for (let i = 1; i < 5; i++) {
                const newRow = row - i * y;
                const newCol = col - i * x;
                if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size && boardState[newRow][newCol] === currentPlayer) {
                    count++;
                } else {
                    break;
                }
            }
            if (count >= 5) return true;
        }
        return false;
    }

    status.textContent = `当前玩家: 黑棋`;

    // 生成《黑客帝国》动态下落数字效果
    const matrix = document.createElement('div');
    matrix.classList.add('matrix');
    document.body.appendChild(matrix);

    const chars = '01';
    const createMatrixEffect = () => {
        const span = document.createElement('span');
        span.textContent = chars[Math.floor(Math.random() * chars.length)];
        span.style.left = `${Math.random() * 100}vw`;
        span.style.animationDuration = `${Math.random() * 3 + 2}s`;
        matrix.appendChild(span);

        setTimeout(() => {
            matrix.removeChild(span);
        }, 5000);
    };

    setInterval(createMatrixEffect, 100);
});