// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');

// Game state
let gameRunning = false;
let score = 0;
let lives = 3;
let player;
let aliens = [];
let bullets = [];
let alienBullets = [];
let keys = {};
let alienDirection = 1;
let alienMoveDown = false;
let lastTime = 0;

// Player class
class Player {
    constructor() {
        this.width = 50;
        this.height = 30;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 60;
        this.speed = 7;
        this.color = '#00ff00';
    }

    draw() {
        ctx.fillStyle = this.color;
        // Draw a simple ship shape
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        if (keys['ArrowLeft'] && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys['ArrowRight'] && this.x < canvas.width - this.width) {
            this.x += this.speed;
        }
    }

    shoot() {
        bullets.push(new Bullet(this.x + this.width / 2 - 2, this.y, 0, -10, '#00ff00'));
    }
}

// Alien class
class Alien {
    constructor(x, y) {
        this.width = 40;
        this.height = 30;
        this.x = x;
        this.y = y;
        this.speed = 1;
        this.color = '#ff0000';
    }

    draw() {
        ctx.fillStyle = this.color;
        // Draw a simple alien shape
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 3, this.y + this.height / 3, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 2 * this.width / 3, this.y + this.height / 3, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.x += this.speed * alienDirection;
    }

    shoot() {
        if (Math.random() < 0.001) { // Chance to shoot
            alienBullets.push(new Bullet(this.x + this.width / 2 - 2, this.y + this.height, 0, 5, '#ff0000'));
        }
    }
}

// Bullet class
class Bullet {
    constructor(x, y, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 15;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
    }
}

// Initialize game
function initGame() {
    player = new Player();
    aliens = [];
    bullets = [];
    alienBullets = [];
    score = 0;
    lives = 3;
    alienDirection = 1;
    alienMoveDown = false;

    // Create aliens in a grid
    const rows = 5;
    const cols = 10;
    const padding = 20;
    const startX = (canvas.width - (cols * (40 + padding))) / 2;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            aliens.push(new Alien(
                startX + col * (40 + padding),
                50 + row * (30 + padding)
            ));
        }
    }

    updateScore();
    updateLives();
}

// Update score display
function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
}

// Update lives display
function updateLives() {
    livesElement.textContent = `Lives: ${lives}`;
}

// Game loop
function gameLoop(timestamp) {
    if (!gameRunning) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw player
    player.update();
    player.draw();

    // Update and draw aliens
    let moveDown = false;
    
    for (let i = 0; i < aliens.length; i++) {
        const alien = aliens[i];
        alien.update();
        alien.draw();
        
        // Check if alien should move down
        if (alien.x <= 0 || alien.x + alien.width >= canvas.width) {
            moveDown = true;
        }
        
        // Random shooting
        alien.shoot();
    }

    // Move aliens down if needed
    if (moveDown) {
        alienDirection *= -1;
        for (let i = 0; i < aliens.length; i++) {
            aliens[i].y += 20;
        }
    }

    // Update and draw bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.update();
        bullet.draw();

        // Remove bullets that go off screen
        if (bullet.y < 0) {
            bullets.splice(i, 1);
            continue;
        }

        // Check collisions with aliens
        for (let j = aliens.length - 1; j >= 0; j--) {
            const alien = aliens[j];
            if (bullet.x < alien.x + alien.width &&
                bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height &&
                bullet.y + bullet.height > alien.y) {
                
                // Remove alien and bullet
                aliens.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;
                updateScore();
                break;
            }
        }
    }

    // Update and draw alien bullets
    for (let i = alienBullets.length - 1; i >= 0; i--) {
        const bullet = alienBullets[i];
        bullet.update();
        bullet.draw();

        // Remove bullets that go off screen
        if (bullet.y > canvas.height) {
            alienBullets.splice(i, 1);
            continue;
        }

        // Check collisions with player
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            
            // Remove bullet and lose a life
            alienBullets.splice(i, 1);
            lives--;
            updateLives();
            
            if (lives <= 0) {
                gameOver();
            }
            break;
        }
    }

    // Check if aliens reached the bottom
    for (let i = 0; i < aliens.length; i++) {
        if (aliens[i].y + aliens[i].height > player.y) {
            gameOver();
            break;
        }
    }

    // Check if all aliens are destroyed
    if (aliens.length === 0) {
        initGame(); // Reset for next wave
    }

    requestAnimationFrame(gameLoop);
}

// Game over function
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Start game function
function startGame() {
    startScreen.classList.add('hidden');
    initGame();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Spacebar to shoot
    if (e.key === ' ' && gameRunning) {
        player.shoot();
        e.preventDefault();
    }
    
    // Start game with spacebar
    if (e.key === ' ' && !gameRunning && !startScreen.classList.contains('hidden')) {
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

restartButton.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startGame();
});

startButton.addEventListener('click', startGame);

// Initialize game
initGame();