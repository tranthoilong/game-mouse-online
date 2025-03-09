const socket = io('http://localhost:3673');

const playerNameInput = document.getElementById('player-name');
const roomIdInput = document.getElementById('room-id');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const setupScreen = document.querySelector('.setup');
const gameScreen = document.querySelector('.game');
const resultScreen = document.querySelector('.result');
const playerTitle = document.getElementById('player-title');
const scoreDisplay = document.getElementById('score');
const opponentScoreDisplay = document.getElementById('opponent-score');
const timeDisplay = document.getElementById('time');
const moles = document.querySelectorAll('.mole');
const resultText = document.getElementById('result-text');
const restartBtn = document.getElementById('restart-btn');
const exitBtn = document.getElementById('exit-btn');

let score = 0;
let gameActive = false;
let roomId = null;
let playerId = null;
let moleSequence = [];
let moleIndex = 0;

createRoomBtn.addEventListener('click', () => {
    if (!playerNameInput.value) {
        alert('Vui lòng nhập tên!');
        return;
    }
    socket.emit('createRoom', playerNameInput.value);
});

joinRoomBtn.addEventListener('click', () => {
    if (!playerNameInput.value || !roomIdInput.value) {
        alert('Vui lòng nhập tên và mã phòng!');
        return;
    }
    socket.emit('joinRoom', roomIdInput.value, playerNameInput.value);
});

socket.on('roomCreated', (data) => {
    roomId = data.roomId;
    playerId = socket.id;
    alert(`Mã phòng của bạn: ${roomId}`);
});

socket.on('startGame', (data) => {
    roomId = data.roomId;
    playerId = socket.id;
    moleSequence = data.moleSequence;
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    resultScreen.style.display = 'none';
    playerTitle.textContent = playerNameInput.value;
    gameActive = true;
    score = 0;
    scoreDisplay.textContent = score;
    opponentScoreDisplay.textContent = '0';
    startGame();
});

socket.on('updateScore', (data) => {
    const self = data.players.find(p => p.id === playerId);
    const opponent = data.players.find(p => p.id !== playerId);

    if (self) {
        score = self.score;
        scoreDisplay.textContent = score;
    }

    if (opponent) {
        opponentScoreDisplay.textContent = opponent.score;
    } else {
        opponentScoreDisplay.textContent = '0';
    }
});

socket.on('gameOver', (data) => {
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'block';

    const ranking = data.players.map(p => `${p.name}: ${p.score} điểm`).join('<br>');
    resultText.innerHTML = `<h2>Kết quả</h2>${ranking}`;
});

restartBtn.addEventListener('click', () => {
    socket.emit('restartGame', roomId);
});

exitBtn.addEventListener('click', () => {
    location.reload();
});

moles.forEach(mole => mole.addEventListener('click', function () {
    if (!gameActive || !roomId || !this.classList.contains('up')) return;
    this.classList.remove('up');
    socket.emit('whack', roomId);
}));

function startGame() {
    let timeLeft = 30;
    moleIndex = 0;
    showNextMole(); 

    const countdown = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            gameActive = false;
            setupScreen.style.display = 'block';
            gameScreen.style.display = 'none';
            socket.emit('endGame', roomId);
        }
    }, 1000);
}

function showNextMole() {
    if (moleIndex >= moleSequence.length || !gameActive) return;

    const holes = document.querySelectorAll('.hole');
    if (holes.length < 4) {
        console.error("⚠️ Không đủ số lượng lỗ chuột!");
        return;
    }

    moles.forEach(mole => mole.classList.remove('up'));

    const randomHole = holes[moleSequence[moleIndex]];
    if (!randomHole) {
        console.error(`⚠️ Không tìm thấy hole tại index: ${moleSequence[moleIndex]}`);
        return;
    }

    const mole = randomHole.querySelector('.mole');
    mole.classList.add('up');

    moleIndex++;
    setTimeout(() => {
        mole.classList.remove('up');
        showNextMole();
    }, 1000);
}
