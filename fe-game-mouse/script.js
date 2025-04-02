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
const resultText = document.getElementById('result-text');
const restartBtn = document.getElementById('restart-btn');
const exitBtn = document.getElementById('exit-btn');
const moles = document.querySelectorAll('.mole');
const numHolesInput = document.getElementById('num-holes');
const gameDurationInput = document.getElementById('game-duration');
const difficultySelect = document.getElementById('difficulty');
const idRoom = document.getElementById('id-room');

let score = 0;
let gameActive = false;
let roomId = null;
let playerId = null;
let moleSequence = [];
let moleIndex = 0;

function showPopup(message) {
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popup-message');
    popupMessage.textContent = message;
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

createRoomBtn.addEventListener('click', () => {
    if (!playerNameInput.value) {
        showPopup('Vui lòng nhập tên!');
        return;
    }
    const numHoles = parseInt(numHolesInput.value) || 4;
    const gameDuration = parseInt(gameDurationInput.value) || 30;
    const difficulty = difficultySelect.value;
    socket.emit('createRoom', playerNameInput.value, numHoles, gameDuration, difficulty);
});

joinRoomBtn.addEventListener('click', () => {
    if (!playerNameInput.value || !roomIdInput.value) {
        showPopup('Vui lòng nhập tên và mã phòng!');
        return;
    }
    socket.emit('joinRoom', roomIdInput.value, playerNameInput.value);
});

socket.on('roomCreated', (data) => {
    roomId = data.roomId;
    playerId = socket.id;
    showPopup(`Mã phòng của bạn: ${roomId}`);
    idRoom.textContent = '🔑 Mã phòng: ' + roomId;
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
    createHoles(data.numHoles);
    startGame(data.gameDuration, data.difficulty);
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

function showToast(message, onAccept, onDecline) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const acceptBtn = document.getElementById('toast-accept');
    const declineBtn = document.getElementById('toast-decline');

    toastMessage.textContent = message;
    toast.classList.add('show');

    acceptBtn.onclick = () => {
        toast.classList.remove('show');
        onAccept();
    };

    declineBtn.onclick = () => {
        toast.classList.remove('show');
        onDecline();
    };
}

socket.on('waitingForRestart', (data) => {
    if (data.initiator !== playerId) {
        showToast(
            `Người chơi khác muốn chơi lại với ${data.numHoles} ô và thời gian ${data.gameDuration} giây. Bạn có đồng ý không?`,
            () => socket.emit('confirmRestart', roomId, true),
            () => socket.emit('confirmRestart', roomId, false)
        );
    } else {
        showPopup(`Đang chờ người chơi khác... (${data.waitingCount}/2 đã sẵn sàng)`);
    }
});

restartBtn.addEventListener('click', () => {
    const numHoles = parseInt(numHolesInput.value) || 4;
    const gameDuration = parseInt(gameDurationInput.value) || 30;
    const difficulty = difficultySelect.value;
    socket.emit('requestRestart', roomId, numHoles, gameDuration, difficulty);
    showPopup('Bạn đã sẵn sàng! Chờ người chơi khác...');
});

exitBtn.addEventListener('click', () => {
    location.reload();
});

moles.forEach(mole => mole.addEventListener('click', function () {
    if (!gameActive || !roomId || !this.classList.contains('up')) return;
    this.classList.remove('up');
    socket.emit('whack', roomId);
}));

function startGame(duration, difficulty) {
    let timeLeft = duration;
    moleIndex = 0;
    showNextMole(difficulty);

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

function showNextMole(difficulty) {
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
    let delay = 1000;
    if (difficulty === 'hard') {
        delay = Math.random() * 500 + 500; 
    } else if (difficulty === 'expert') {
        delay = Math.random() * 200 + 300; 
    }

    setTimeout(() => {
        mole.classList.remove('up');
        showNextMole(difficulty);
    }, delay);
}

function createHoles(numHoles) {
    const grid = document.querySelector('.grid');
    grid.innerHTML = '';
    for (let i = 0; i < numHoles; i++) {
        const hole = document.createElement('div');
        hole.classList.add('hole');
        const mole = document.createElement('div');
        mole.classList.add('mole');
        mole.addEventListener('click', function () {
            if (!gameActive || !roomId || !this.classList.contains('up')) return;
            this.classList.remove('up');
            socket.emit('whack', roomId);
        });
        hole.appendChild(mole);
        grid.appendChild(hole);
    }
}
