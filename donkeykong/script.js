// Donkey Kong Game - Mestery Arcade

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game variables
let score = 0;
let lives = 3;
let gameRunning = true;

// Player object
const player = {
    x: 50,
    y: 400,
    width: 30,
    height: 30,
    speed: 5,
    jumpForce: 15,
    velocityY: 0,
    isJumping: false,
    color: '#0f0'
};

// Platforms
const platforms = [
    { x: 0, y: 550, width: 800, height: 50, color: '#ff0' },
    { x: 100, y: 450, width: 200, height: 20, color: '#ff0' },
    { x: 400, y: 350, width: 200, height: 20, color: '#ff0' },
    { x: 100, y: 250, width: 200, height: 20, color: '#ff0' },
    { x: 500, y: 150, width: 200, height: 20, color: '#ff0' }
];

// Donkey Kong (enemy)
const donkeyKong = {
    x: 700,
    y: 100,
    width: 50,
    height: 50,
    color: '#f00'
};

// Barrels (obstacles)
let barrels = [];

// Game functions
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Simple player details
    ctx.fillStyle = '#00f';
    ctx.fillRect(player.x + 5, player.y + 5, 8, 8); // Eyes
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

function drawDonkeyKong() {
    ctx.fillStyle = donkeyKong.color;
    ctx.fillRect(donkeyKong.x, donkeyKong.y, donkeyKong.width, donkeyKong.height);
    
    // Simple Donkey Kong details
    ctx.fillStyle = '#000';
    ctx.fillRect(donkeyKong.x + 10, donkeyKong.y + 10, 8, 8); // Eyes
}

function drawBarrels() {
    barrels.forEach(barrel => {
        ctx.fillStyle = '#800';
        ctx.beginPath();
        ctx.arc(barrel.x, barrel.y, barrel.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updatePlayer() {
    // Apply gravity
    if (player.isJumping) {
        player.velocityY += 0.8;
    }
    
    // Update position
    player.y += player.velocityY;
    
    // Platform collision detection
    let onPlatform = false;
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height <= platform.y &&
            player.y + player.height + player.velocityY >= platform.y) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isJumping = false;
            onPlatform = true;
        }
    });
    
    // Ground collision
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }
    
    // Keep player within bounds
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x > canvas.width - player.width) {
        player.x = canvas.width - player.width;
    }
}

function updateBarrels() {
    barrels.forEach((barrel, index) => {
        barrel.y += 3; // Fall down
        barrel.x += barrel.direction * 2; // Move horizontally
        
        // Remove barrels that go off screen
        if (barrel.y > canvas.height) {
            barrels.splice(index, 1);
        }
    });
}

function spawnBarrel() {
    if (Math.random() < 0.01) { // 1% chance per frame
        barrels.push({
            x: donkeyKong.x + 25,
            y: donkeyKong.y + 50,
            radius: 15,
            direction: Math.random() > 0.5 ? 1 : -1
        });
    }
}

function checkCollisions() {
    // Player vs Barrel collision
    barrels.forEach(barrel => {
        const dx = (player.x + player.width/2) - (barrel.x);
        const dy = (player.y + player.height/2) - (barrel.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.width/2 + barrel.radius) {
            // Player hit by barrel
            lives--;
            updateGameInfo();
            if (lives <= 0) {
                gameRunning = false;
                alert('Game Over! Final Score: ' + score);
            }
            // Remove the barrel that hit the player
            barrels = barrels.filter(b => b !== barrel);
        }
    });
    
    // Player vs Donkey Kong collision
    if (player.x < donkeyKong.x + donkeyKong.width &&
        player.x + player.width > donkeyKong.x &&
        player.y < donkeyKong.y + donkeyKong.height &&
        player.y + player.height > donkeyKong.y) {
        // Player wins by reaching Donkey Kong
        score += 100;
        updateGameInfo();
        // Reset player position
        player.x = 50;
        player.y = 400;
    }
}

function updateGameInfo() {
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameRunning) {
        // Update game state
        updatePlayer();
        updateBarrels();
        spawnBarrel();
        checkCollisions();
        
        // Update score only when game is running (not at game over)
        if (gameRunning) {
            score += 1;
        }
        updateGameInfo();
        
        // Draw everything
        drawPlatforms();
        drawDonkeyKong();
        drawBarrels();
        drawPlayer();
    }
    
    requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            player.x -= player.speed;
            break;
        case 'ArrowRight':
            player.x += player.speed;
            break;
        case 'ArrowUp':
            if (!player.isJumping) {
                player.velocityY = -player.jumpForce;
                player.isJumping = true;
            }
            break;
        case ' ':
            if (!player.isJumping) {
                player.velocityY = -player.jumpForce;
                player.isJumping = true;
            }
            break;
    }
});

// Handle key repeat for continuous movement
let keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Add continuous movement in game loop
function updatePlayer() {
    // Handle continuous key presses for smooth movement
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
    }
    
    // Apply gravity
    if (player.isJumping) {
        player.velocityY += 0.8;
    }
    
    // Update position
    player.y += player.velocityY;
    
    // Platform collision detection - Check all platforms for collisions
    let onPlatform = false;
    platforms.forEach(platform => {
        // Check if player is above the platform and falling
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height <= platform.y + 10 && // Small tolerance for falling
            player.y + player.height + player.velocityY >= platform.y) {
            // Player is landing on the platform
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isJumping = false;
            onPlatform = true;
        }
    });
    
    // Ground collision (when not on any platform)
    if (!onPlatform && player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }
    
    // Keep player within bounds
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x > canvas.width - player.width) {
        player.x = canvas.width - player.width;
    }
}

// Initialize game
updateGameInfo();
gameLoop();