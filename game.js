const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score-value');
const newGameButton = document.getElementById('new-game');
const undoButton = document.getElementById('undo');
let board = [];
let score = 0;
let previousStates = [];
let audioContext;
let gainNode;
let newAndMergedTiles = [];

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0.1; // 控制音量
}

function initGame() {
    board = Array(4).fill().map(() => Array(4).fill(0));
    score = 0;
    previousStates = [];
    addNewTile();
    addNewTile();
    updateScore();
    renderBoard();
    initAudio();

    document.removeEventListener('keydown', handleKeyPress);
    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    console.log(`按下按鍵: ${e.key}`);
    switch(e.key) {
        case 'ArrowUp': move('up'); break;
        case 'ArrowDown': move('down'); break;
        case 'ArrowLeft': move('left'); break;
        case 'ArrowRight': move('right'); break;
    }
}

function addNewTile() {
    let emptyTiles = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) {
                emptyTiles.push({i, j});
            }
        }
    }
    if (emptyTiles.length > 0) {
        const {i, j} = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        board[i][j] = Math.random() < 0.9 ? 2 : 4;
        // 记录新添加的数字
        newAndMergedTiles.push({i, j});
    }
}

function renderBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            if (board[i][j] !== 0) {
                tile.textContent = board[i][j];
                tile.classList.add(`tile-${board[i][j]}`);
                // 检查是否是新的或合并后的数字
                if (newAndMergedTiles.some(t => t.i === i && t.j === j)) {
                    tile.classList.add('tile-new');
                }
            }
            tile.style.top = `${i * 110 + 10}px`;
            tile.style.left = `${j * 110 + 10}px`;
            gameBoard.appendChild(tile);
        }
    }
    // 清空新的和合并的数字列表
    newAndMergedTiles = [];
}

function move(direction) {
    console.log(`嘗試移動: ${direction}`);
    console.log('初始遊戲板狀態:', JSON.parse(JSON.stringify(board)));
    let moved = false;
    previousStates.push({board: JSON.parse(JSON.stringify(board)), score: score});
    let newBoard = JSON.parse(JSON.stringify(board));

    newBoard = moveBoard(newBoard, direction);

    if (JSON.stringify(board) !== JSON.stringify(newBoard)) {
        moved = true;
    }

    if (moved) {
        console.log('移動發生，更新遊戲板');
        console.log('新的遊戲板狀態:', JSON.parse(JSON.stringify(newBoard)));
        board = newBoard;
        updateScore();
        renderBoard(); // 更新渲染

        setTimeout(() => {
            addNewTile();
            renderBoard();
            if (isGameOver()) {
                alert('遊戲結束！');
            }
        }, 250); // 等待動畫完成
    } else {
        console.log('沒有移動發生');
        previousStates.pop(); // 如果沒有移動，移除最後一個狀態
    }
}

function moveBoard(board, direction) {
    if (direction === 'left') {
        return board.map(moveRow);
    } else if (direction === 'right') {
        return board.map(row => moveRow([...row].reverse()).reverse());
    } else if (direction === 'up') {
        const rotated = rotateBoard(board);
        const moved = rotated.map(moveRow);
        return rotateBoard(rotateBoard(rotateBoard(moved)));
    } else if (direction === 'down') {
        const rotated = rotateBoard(board);
        const moved = rotated.map(row => moveRow([...row].reverse()).reverse());
        return rotateBoard(rotateBoard(rotateBoard(moved)));
    }
}

function rotateBoard(board) {
    return board[0].map((_, index) => board.map(row => row[index])).reverse();
}

function moveRow(row) {
    let moved = false;
    const filteredRow = row.filter(cell => cell !== 0);
    const mergedRow = [];
    for (let i = 0; i < filteredRow.length; i++) {
        if (filteredRow[i] === filteredRow[i + 1]) {
            mergedRow.push(filteredRow[i] * 2);
            // 记录合并后的新数字
            newAndMergedTiles.push({i: row.indexOf(mergedRow), j: mergedRow.length - 1});
            score += filteredRow[i] * 2;
            i++;
            moved = true;
            playMergeSound(); // 在這裡播放音效
        } else {
            mergedRow.push(filteredRow[i]);
        }
    }
    while (mergedRow.length < 4) {
        mergedRow.push(0);
    }
    if (mergedRow.join(',') !== row.join(',')) {
        moved = true;
    }
    return mergedRow;
}

function playMergeSound() {
    if (!audioContext) {
        initAudio();
    }
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 設置頻率為 440Hz (A4音)
    oscillator.connect(gainNode);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1); // 播放 0.1 秒
}

function updateScore() {
    scoreElement.textContent = score;
    // 更新本地存儲中的最高分
    const highScore = localStorage.getItem('highScore') || 0;
    if (score > highScore) {
        localStorage.setItem('highScore', score);
    }
}

function isGameOver() {
    // 檢查是否還有空格
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) {
                return false;
            }
        }
    }
    // 檢查是否還可以合併的相鄰格子
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i][j] === board[i][j + 1]) {
                return false;
            }
        }
    }
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === board[i + 1][j]) {
                return false;
            }
        }
    }
    return true;
}

function undo() {
    if (previousStates.length > 0) {
        const previousState = previousStates.pop();
        board = previousState.board;
        score = previousState.score;
        updateScore();
        renderBoard();
    }
}

newGameButton.addEventListener('click', initGame);
undoButton.addEventListener('click', undo);

initGame();