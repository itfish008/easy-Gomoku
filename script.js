document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const status = document.getElementById('status');
    const size = 15;
    let currentPlayer = 'black';
    let gameOver = false;
    const boardState = Array(size).fill(null).map(() => Array(size).fill(null));

    // Create the game board
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

    // Handle cell click events
    function handleCellClick(row, col) {
        if (gameOver || boardState[row][col]) return;

        boardState[row][col] = currentPlayer;
        const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
        cell.classList.add(currentPlayer);

        if (checkWin(row, col)) {
            status.textContent = `${currentPlayer === 'black' ? 'Black' : 'White'} Wins!`;
            gameOver = true;
        } else {
            currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
            status.textContent = `Current Player: ${currentPlayer === 'black' ? 'Black' : 'White'}`;
        }
    }

    // Check if the current move wins the game
    function checkWin(row, col) {
        const directions = [
            [1, 0],  // horizontal
            [0, 1],  // vertical
            [1, 1],  // diagonal
            [1, -1]  // anti-diagonal
        ];

        return directions.some(([dx, dy]) => {
            return checkDirection(row, col, dx, dy) + checkDirection(row, col, -dx, -dy) >= 4;
        });
    }

    // Check consecutive pieces in a direction
    function checkDirection(row, col, dx, dy) {
        const player = boardState[row][col];
        let count = 0;
        let x = row + dx;
        let y = col + dy;

        while (x >= 0 && x < size && y >= 0 && y < size && boardState[x][y] === player) {
            count++;
            x += dx;
            y += dy;
        }

        return count;
    }

    // Initialize game status
    status.textContent = `Current Player: Black`;

    // Generate Matrix-style falling digits effect
    function createMatrixEffect() {
        const matrix = document.createElement('div');
        matrix.className = 'matrix';
        document.body.appendChild(matrix);

        setInterval(() => {
            const span = document.createElement('span');
            span.textContent = Math.random() > 0.5 ? '1' : '0';
            span.style.left = Math.random() * 100 + 'vw';
            span.style.animationDuration = Math.random() * 2 + 1 + 's';
            matrix.appendChild(span);

            setTimeout(() => {
                span.remove();
            }, 3000);
        }, 50);
    }

    createMatrixEffect();
});