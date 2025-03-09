const socket = io('http://localhost:3673');

const playerNameInput = document.getElementById('player-name');
const roomIdInput = document.getElementById('room-id');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const setupScreen = document.querySelector('.setup');
const gameScreen = document.querySelector('.game');
const playerTitle = document.getElementById('player-title');
const scoreDisplay = document.getElementById('score');
const opponentScoreDisplay = document.getElementById('opponent-score');
const timeDisplay = document.getElementById('time');
const moles = document.querySelectorAll('.mole');

let score = 0;
let gameActive = false;
let roomId = null;
let playerId = null;

// 👉 Tạo phòng
createRoomBtn.addEventListener('click', () => {
    if (!playerNameInput.value) {
        alert('Vui lòng nhập tên!');
        return;
    }
    socket.emit('createRoom', playerNameInput.value);
});

// 👉 Tham gia phòng
joinRoomBtn.addEventListener('click', () => {
    if (!playerNameInput.value || !roomIdInput.value) {
        alert('Vui lòng nhập tên và mã phòng!');
        return;
    }
    socket.emit('joinRoom', roomIdInput.value, playerNameInput.value);
});

// 🎮 Khi phòng được tạo
socket.on('roomCreated', (data) => {
    roomId = data.roomId;
    playerId = socket.id;
    alert(`Mã phòng của bạn: ${roomId}`);
});

// 🎮 Khi game bắt đầu
socket.on('startGame', (data) => {
    roomId = data.roomId;
    playerId = socket.id;
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    playerTitle.textContent = playerNameInput.value;
    gameActive = true;
    score = 0;
    scoreDisplay.textContent = score;
    opponentScoreDisplay.textContent = '0';
    startGame();
});

// 🎯 Cập nhật điểm số
socket.on('updateScore', (data) => {
    console.log('Nhận updateScore:', data);

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

// ⚠️ Nhận lỗi từ server
socket.on('error', (data) => {
    alert(data.message);
    console.log('Lỗi từ server:', data.message);
});

// 🎯 Ngẫu nhiên hiển thị chuột chũi
function randomMole() {
    moles.forEach(mole => mole.classList.remove('up'));
    const randomHole = document.querySelectorAll('.hole')[Math.floor(Math.random() * 4)];
    const mole = randomHole.querySelector('.mole');
    mole.classList.add('up');
    setTimeout(() => {
        mole.classList.remove('up');
        if (gameActive) randomMole();
    }, 1000);
}

// 🏁 Bắt đầu game
function startGame() {
    let timeLeft = 30;
    randomMole();

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

// 🔨 Khi nhấn vào chuột chũi
function whack(e) {
    if (!gameActive || !roomId || !this.classList.contains('up')) return;
    this.classList.remove('up');
    socket.emit('whack', roomId);
}

moles.forEach(mole => mole.addEventListener('click', whack));
