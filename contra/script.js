// CONTRA Game - Mestery Arcade

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let score = 0;
let lives = 3;
let level = 1;
let frameCount = 0;

// DOM elements
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const gameOverScreen = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const finalScoreElement = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    z: false,
    Z: false,
    x: false,
    X: false
};

// Game objects
let player;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let backgroundObjects = [];

// Score display
function updateScore() {
    scoreElement.textContent = `SCORE: ${score}`;
}

// Lives display
function updateLives() {
    livesElement.textContent = `LIVES: ${lives}`;
}

// Level display
function updateLevel() {
    levelElement.textContent = `LEVEL: ${level}`;
}

// Retro color palette
const COLORS = {
    playerGreen: '#00cc00',      // Classic Contra green
    playerSkin: '#ffcc80',
    bulletPlayer: '#ffff00',     // Yellow bullets
    bulletEnemy: '#ff3300',      // Red enemy bullets
    enemy1: '#cc0000',           // Red soldier
    enemy2: '#8b4513',           // Brown alien
    enemy3: '#00ff99',           // Green bug
    backgroundDark: '#1a1a2e',
    backgroundMid: '#16213e',
    backgroundLight: '#0f3460'
};

// Player class
class Player {
    constructor() {
        this.width = 28;
        this.height = 36;
        this.x = 50;
        this.y = canvas.height - 120;
        this.speedX = 4;
        this.speedY = 5;
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = 0.8;
        this.jumpForce = 15;
        this.onGround = false;
        this.facingRight = true;
        this.shootCooldown = 0;
        this.color = COLORS.playerGreen;
    }

    update() {
        // Horizontal movement
        if (keys.ArrowLeft) {
            this.velocityX = -this.speedX;
            this.facingRight = false;
        } else if (keys.ArrowRight) {
            this.velocityX = this.speedX;
            this.facingRight = true;
        } else {
            this.velocityX *= 0.8; // Friction
        }

        // Jumping
        if (keys.z && this.onGround) {
            this.velocityY = -this.jumpForce;
            this.onGround = false;
        }

        // Apply physics
        this.velocityY += this.gravity;

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Ground collision (floor)
        if (this.y >= canvas.height - 50) {
            this.y = canvas.height - 50;
            this.velocityY = 0;
            this.onGround = true;
        }

        // Platform collision
        platforms.forEach(platform => {
            if (this.y < platform.y &&
                this.y + this.height > platform.y - 10 &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.velocityY >= 0) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
            }
        });

        // Screen boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
        if (this.y > canvas.height) {
            // Fall off screen
            loseLife();
        }

        // Shooting cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // Shooting
        if (keys.x && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 15; // Frames between shots
        }

        // Camera scrolling (player stays left, world moves)
        if (this.x > 200 && cameraOffset < 1500) {
            const scrollSpeed = this.x - 200;
            cameraOffset += scrollSpeed * 1.5;
            this.x = 200;

            // Move enemies with camera
            enemies.forEach(enemy => {
                enemy.x -= scrollSpeed * 1.5;
            });
            bullets.forEach(bullet => {
                bullet.x -= scrollSpeed * 1.5;
            });
            enemyBullets.forEach(bullet => {
                bullet.x -= scrollSpeed * 1.5;
            });
            backgroundObjects.forEach(obj => {
                obj.x -= scrollSpeed * 0.3; // Parallax
            });
        }
    }

    shoot() {
        const bulletX = this.x + (this.facingRight ? this.width : 0);
        const bulletY = this.y + this.height / 2 - 2;
        const bulletSpeed = this.facingRight ? 10 : -10;

        bullets.push(new Bullet(bulletX, bulletY, bulletSpeed, 0));
    }

    draw() {
        const x = this.x;
        const y = this.y;

        // Draw body
        ctx.fillStyle = this.color;
        ctx.fillRect(x + 4, y + 10, this.width - 8, this.height - 16);

        // Draw head
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(x + 6, y, this.width - 12, 10);

        // Draw helmet
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(x + 5, y - 2, this.width - 10, 4);

        // Draw eyes
        ctx.fillStyle = '#000';
        if (this.facingRight) {
            ctx.fillRect(x + this.width - 10, y + 3, 2, 4);
            ctx.fillRect(x + this.width - 6, y + 3, 2, 4);
        } else {
            ctx.fillRect(x + 6, y + 3, 2, 4);
            ctx.fillRect(x + 10, y + 3, 2, 4);
        }

        // Draw arm/gun
        ctx.fillStyle = '#ff3300';
        if (this.facingRight) {
            ctx.fillRect(x + this.width - 2, y + 14, 8, 6);
        } else {
            ctx.fillRect(x - 6, y + 14, 8, 6);
        }

        // Draw leg animation
        ctx.fillStyle = '#003300'; // Darker green pants
        if (frameCount % 10 < 5 && this.velocityX !== 0) {
            ctx.fillRect(x + 4, y + this.height - 8, 10, 8);
            ctx.fillRect(x + 14, y + this.height - 6, 10, 6);
        } else if (this.velocityX !== 0) {
            ctx.fillRect(x + 4, y + this.height - 6, 10, 6);
            ctx.fillRect(x + 14, y + this.height - 8, 10, 8);
        } else {
            ctx.fillRect(x + 4, y + this.height - 6, 10, 8);
            ctx.fillRect(x + 14, y + this.height - 6, 10, 8);
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x + 4, y + this.height - 2, this.width - 8, 2);
    }

    takeDamage() {
        createExplosion(this.x + this.width / 2, this.y + this.height / 2, COLORS.playerGreen);
        loseLife();
    }
}

class Bullet {
    constructor(x, y, vx, vy, color = COLORS.bulletPlayer) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 8;
        this.height = 4;
        this.color = color;
        this.markedForDeletion = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -50 || this.x > canvas.width + 1500 || this.y < -50 || this.y > canvas.height + 50) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = this.color;

        // Main bullet
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Bullet glow trail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(this.x - (this.vx > 0 ? this.width : 0), this.y + 1, 4, 2);

        ctx.shadowBlur = 0;
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 36;
        this.type = type; // 0: Soldier, 1: Alien, 2: Bug
        this.markedForDeletion = false;
        this.moveTimer = 0;

        if (type === 0) {
            this.color = COLORS.enemy1; // Red
            this.speed = 2;
            this.scoreValue = 100;
            this.health = 3;
        } else if (type === 1) {
            this.color = COLORS.enemy2; // Brown
            this.speed = 1.5;
            this.scoreValue = 200;
            this.health = 4;
        } else {
            this.color = COLORS.enemy3; // Green
            this.speed = 2.5;
            this.scoreValue = 300;
            this.health = 2;
        }
    }

    update() {
        // Move towards player
        if (this.x > player.x + 50) {
            this.x -= this.speed;
        } else if (this.x < player.x - 50) {
            this.x += this.speed;
        }

        // Shoot randomly (but not immediately on spawn - give player a grace period)
        const distToPlayer = Math.abs(this.x - player.x);
        if (distToPlayer < 150) {
            // Very close enemies shoot more often
            if (Math.random() < 0.03 + level * 0.01) {
                this.shoot();
            }
        } else if (distToPlayer < 300) {
            // Medium distance
            if (Math.random() < 0.01 + level * 0.005) {
                this.shoot();
            }
        } else {
            // Far away enemies rarely shoot (they can't hit anyway)
            if (Math.random() < 0.002) {
                this.shoot();
            }
        }

        // Platform collision for ground enemies
        if (this.y > canvas.height - 50) {
            this.y = canvas.height - 50;
        }
    }

    shoot() {
        const angle = Math.atan2((player.y + player.height / 2) - (this.y + this.height / 2),
                                  (player.x + player.width / 2) - (this.x + this.width / 2));
        const bulletSpeed = 5;
        const vx = Math.cos(angle) * bulletSpeed;
        const vy = Math.sin(angle) * bulletSpeed;

        enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, vx, vy, COLORS.bulletEnemy));
    }

    draw() {
        const x = this.x;
        const y = this.y;

        // Draw enemy based on type
        if (this.type === 0) {
            // Soldier (red uniform)
            ctx.fillStyle = this.color;
            ctx.fillRect(x + 4, y + 10, this.width - 8, this.height - 16);

            // Head
            ctx.fillStyle = '#ffcc80';
            ctx.fillRect(x + 6, y, this.width - 12, 10);

            // Helmet
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(x + 5, y - 2, this.width - 10, 4);

            // Gun
            ctx.fillStyle = '#888';
            if (this.x > player.x) {
                ctx.fillRect(x + this.width - 2, y + 14, 8, 6);
            } else {
                ctx.fillRect(x - 6, y + 14, 8, 6);
            }
        } else if (this.type === 1) {
            // Alien (brown/green)
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(x + 6, y + 8, this.width - 12, this.height - 14);

            // Alien head
            ctx.fillStyle = '#3d2b1f';
            ctx.fillRect(x + 5, y, this.width - 10, 8);

            // Eyes
            ctx.fillStyle = '#ff0000';
            if (this.x > player.x) {
                ctx.fillRect(x + this.width - 10, y + 2, 4, 4);
                ctx.fillRect(x + this.width - 6, y + 2, 4, 4);
            } else {
                ctx.fillRect(x + 6, y + 2, 4, 4);
                ctx.fillRect(x + 10, y + 2, 4, 4);
            }
        } else {
            // Bug (green beetle)
            ctx.fillStyle = '#006400';
            ctx.fillRect(x + 6, y + 12, this.width - 12, this.height - 18);

            // Head
            ctx.fillStyle = '#00ff99';
            ctx.fillRect(x + 5, y + 2, this.width - 10, 6);

            // Eyes
            ctx.fillStyle = '#ff0000';
            if (this.x > player.x) {
                ctx.fillRect(x + this.width - 9, y + 3, 2, 3);
                ctx.fillRect(x + this.width - 5, y + 3, 2, 3);
            } else {
                ctx.fillRect(x + 6, y + 3, 2, 3);
                ctx.fillRect(x + 10, y + 3, 2, 3);
            }

            // Legs
            ctx.fillStyle = '#004400';
            if (frameCount % 10 < 5) {
                ctx.fillRect(x - 4, y + 8, 3, 2);
                ctx.fillRect(x + this.width + 1, y + 8, 3, 2);
            } else {
                ctx.fillRect(x - 4, y + 16, 3, 2);
                ctx.fillRect(x + this.width + 1, y + 16, 3, 2);
            }
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x + 4, y + this.height - 2, this.width - 8, 2);
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            createExplosion(this.x + this.width / 2, this.y + this.height / 2, '#ff6600');
            score += this.scoreValue;
            updateScore();
            this.markedForDeletion = true;
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 12;
        this.vy = (Math.random() - 0.5) * 12;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.color = color;
        this.size = Math.random() * 6 + 3;
        this.rotation = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

class BackgroundObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 0: Tree, 1: Rock, 2: Cloud
    }

    draw() {
        if (this.type === 0) {
            // Tree
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(this.x + 10, this.y - 40, 12, 40);
            ctx.fillStyle = '#006400';
            ctx.beginPath();
            ctx.arc(this.x + 16, this.y - 40, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#008000';
            ctx.beginPath();
            ctx.arc(this.x + 16, this.y - 45, 15, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 1) {
            // Rock
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y - 20, 25, Math.PI, 0);
            ctx.fill();
        } else {
            // Cloud
            ctx.fillStyle = 'rgba(173, 216, 230, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.arc(this.x + 15, this.y - 5, 25, 0, Math.PI * 2);
            ctx.arc(this.x + 30, this.y, 18, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Boss {
    constructor() {
        this.x = canvas.width + 100;
        this.y = canvas.height - 200;
        this.width = 80;
        this.height = 60;
        this.health = 30 + level * 10;
        this.maxHealth = this.health;
        this.moveDirection = 1;
        this.shootTimer = 0;
    }

    update() {
        // Boss movement
        if (this.x > player.x + 200 || this.x < canvas.width - 150) {
            this.x += this.moveDirection * 2;
        }

        // Boss shoots
        this.shootTimer++;
        if (this.shootTimer > 40) {
            this.shoot();
            this.shootTimer = 0;
        }
    }

    shoot() {
        // Shoot at player
        const angle = Math.atan2((player.y + player.height / 2) - (this.y + this.height / 2),
                                  (player.x + player.width / 2) - (this.x + this.width / 2));
        const bulletSpeed = 6;
        enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2,
            Math.cos(angle) * bulletSpeed, Math.sin(angle) * bulletSpeed, '#ff00ff'));
    }

    draw() {
        // Boss body (green alien)
        ctx.fillStyle = '#00ff99';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Boss head
        ctx.fillStyle = '#00cc66';
        ctx.fillRect(this.x + 15, this.y - 20, 50, 30);

        // Boss eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 25, this.y - 15, 8, 8);
        ctx.fillRect(this.x + 47, this.y - 15, 8, 8);

        // Boss arms
        ctx.fillStyle = '#00cc66';
        if (frameCount % 20 < 10) {
            ctx.fillRect(this.x - 20, this.y + 10, 20, 15);
        } else {
            ctx.fillRect(this.x + this.width, this.y + 10, 20, 15);
        }

        // Boss health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 20, this.y - 45, this.width + 40, 10);
        ctx.fillStyle = '#ff0000';
        const healthPercent = this.health / this.maxHealth;
        ctx.fillRect(this.x - 20, this.y - 45, (this.width + 40) * healthPercent, 10);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.x - 20, this.y - 45, this.width + 40, 10);
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            createExplosion(this.x + this.width / 2, this.y + this.height / 2, '#ff00ff');
            createExplosion(this.x + this.width / 2, this.y + this.height / 2, '#ffffff');
            score += 5000;
            updateScore();
            // Boss defeated - end level
            setTimeout(() => {
                nextLevel();
            }, 1000);
        }
    }
}

let cameraOffset = 0;
let platforms = [];
let boss = null;

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(x, y, '#ffff00'));
    }
}

function drawBackground() {
    // Sky gradient changes based on camera position (time of day effect)
    const timeOfDay = (cameraOffset / 1000) % 1;
    const skyTop = lerpColor('#0a0a1e', '#ff6b35', timeOfDay); // Dark to orange
    const skyBottom = lerpColor('#1a1a2e', '#ff9f43', timeOfDay);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, skyTop);
    gradient.addColorStop(1, skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun/Moon position based on camera
    const sunX = 100 + (cameraOffset * 0.05) % (canvas.width + 200);
    const sunY = 80 + Math.sin(cameraOffset * 0.002) * 40;
    ctx.fillStyle = timeOfDay > 0.5 ? '#ffffcc' : '#ffcc00'; // White at day, yellow at night
    ctx.shadowBlur = 30;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Background mountains (far parallax layer)
    const mountainColor1 = lerpColor('#0f2b4d', '#ff8c42', timeOfDay);
    const mountainColor2 = lerpColor('#16213e', '#ffa057', timeOfDay);
    ctx.fillStyle = mountainColor1;
    for (let i = -1; i < 6; i++) {
        const mx = cameraOffset * 0.1 + i * 300;
        ctx.beginPath();
        ctx.moveTo(mx, canvas.height);
        ctx.lineTo(mx + 125, canvas.height - 250);
        ctx.lineTo(mx + 250, canvas.height);
        ctx.fill();
    }
    
    // Second layer of mountains
    ctx.fillStyle = mountainColor2;
    for (let i = -1; i < 6; i++) {
        const mx = cameraOffset * 0.15 + i * 400;
        ctx.beginPath();
        ctx.moveTo(mx, canvas.height);
        ctx.lineTo(mx + 150, canvas.height - 200);
        ctx.lineTo(mx + 300, canvas.height);
        ctx.fill();
    }

    // Ground based on camera position
    const groundColor = getGroundColor(cameraOffset);
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Ground details
    const detailColor = getGroundDetailColor(cameraOffset);
    ctx.fillStyle = detailColor;
    for (let i = 0; i < canvas.width + 200; i += 60) {
        if ((i + cameraOffset / 15) % 137 < 20) {
            ctx.fillRect((i + cameraOffset / 15) % (canvas.width + 300), canvas.height - 45, 12, 5);
        }
    }

    // Platforms
    platforms.forEach(platform => {
        const platformTopColor = (Math.floor(platform.x / 500) % 2 === 0) ? '#a0522d' : '#c18e62';
        ctx.fillStyle = groundColor;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.fillStyle = platformTopColor;
        ctx.fillRect(platform.x, platform.y, platform.width, 6);
    });

    // Background objects (trees, rocks, clouds) - positioned based on camera
    backgroundObjects.forEach(obj => {
        if (obj.x > cameraOffset - 100 && obj.x < cameraOffset + canvas.width) {
            obj.draw();
        }
    });
    
    // Draw clouds moving independently
    drawClouds();
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.fillStyle = platform.topColor;
        ctx.fillRect(platform.x, platform.y, platform.width, 5);

        // Platform details
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(platform.x + 5, platform.y + 5, 3, platform.height - 10);
        ctx.fillRect(platform.x + platform.width - 8, platform.y + 5, 3, platform.height - 10);
    });
}

function initLevel() {
    platforms = [];
    backgroundObjects = [];

    // Ground level
    platforms.push({ x: 0, y: canvas.height - 50, width: 2000, height: 50, color: '#8b4513', topColor: '#a0522d' });

    // Create platforms
    const platformCount = 10 + level * 2;
    for (let i = 0; i < platformCount; i++) {
        const x = 200 + i * (150 + Math.random() * 100);
        const y = canvas.height - 150 - Math.random() * 200;
        platforms.push({
            x: x,
            y: y,
            width: 120 + Math.random() * 80,
            height: 20,
            color: '#8b4513',
            topColor: '#a0522d'
        });
    }

    // Create background objects spread across the entire level
    backgroundObjects = [];
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * 2000;
        const y = canvas.height - (Math.random() > 0.3 ? Math.random() * 40 : Math.random() * 100);
        const type = Math.floor(Math.random() * 3);
        backgroundObjects.push(new BackgroundObject(x, y, type));
    }

    // Spawn enemies
    const enemyCount = 8 + level * 3;
    for (let i = 0; i < enemyCount; i++) {
        spawnEnemy();
    }

    // Boss level
    if (level % 5 === 0) {
        boss = new Boss();
    } else {
        boss = null;
    }
}

function spawnEnemy() {
    const x = canvas.width + 200 + Math.random() * 300;
    const y = canvas.height - 150 - Math.random() * 150;
    const type = Math.floor(Math.random() * 3);
    enemies.push(new Enemy(x, y, type));
}

function loseLife() {
    lives--;
    updateLives();
    if (lives <= 0) {
        gameOver();
    } else {
        // Respawn
        player.x = 50;
        player.y = canvas.height - 120;
    }
}

function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';
}

function nextLevel() {
    level++;
    updateLevel();
    initLevel();
}

function startGame() {
    score = 0;
    lives = 3;
    level = 1;
    cameraOffset = 0;
    updateScore();
    updateLives();
    updateLevel();

    player = new Player();
    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];

    initLevel();

    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'none';

    if (!gameRunning) {
        gameRunning = true;
        gameLoop();
    }
}

function gameLoop() {
    if (!gameRunning) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();

    // Update and draw player
    player.update();
    player.draw();

    // Draw platforms
    drawPlatforms();

    // Update and draw boss if level is boss level
    if (boss) {
        boss.update();
        boss.draw();

        // Check collision with boss
        bullets.forEach(bullet => {
            if (!bullet.markedForDeletion &&
                bullet.x < boss.x + boss.width &&
                bullet.x + bullet.width > boss.x &&
                bullet.y < boss.y + boss.height &&
                bullet.y + bullet.height > boss.y) {
                boss.takeDamage();
                bullet.markedForDeletion = true;
                createExplosion(bullet.x, bullet.y, '#ff00ff');
            }
        });
    }

    // Update and draw enemies
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();

        // Check collision with player
        if (enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y) {
            player.takeDamage();
        }

        // Check collision with bullets
        bullets.forEach(bullet => {
            if (!bullet.markedForDeletion &&
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                enemy.takeDamage();
                bullet.markedForDeletion = true;
                createExplosion(bullet.x, bullet.y, '#ffff00');
            }
        });
    });

    // Update and draw bullets
    bullets.forEach(bullet => {
        bullet.update();
        bullet.draw();
    });
    bullets = bullets.filter(b => !b.markedForDeletion);

    // Update and draw enemy bullets
    enemyBullets.forEach(bullet => {
        bullet.update();
        bullet.draw();

        // Check collision with player
        if (!bullet.markedForDeletion &&
            bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            player.takeDamage();
            bullet.markedForDeletion = true;
        }
    });
    enemyBullets = enemyBullets.filter(b => !b.markedForDeletion);

    // Update and draw particles
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    particles = particles.filter(p => p.life > 0);

    // Spawn enemies
    if (frameCount % 120 === 0 && enemies.length < 8 + level) {
        spawnEnemy();
    }

    // Check if player reached boss
    if (level % 5 === 0 && player.x > canvas.width - 100 && !boss) {
        // Spawn boss
        spawnEnemy();
    }

    frameCount++;

    requestAnimationFrame(gameLoop);
}

// Event listeners
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Helper functions for background generation
function lerpColor(a, b, amount) {
    const aHex = hexToRgb(a);
    const bHex = hexToRgb(b);
    const r = Math.round(lerp(aHex.r, bHex.r, amount));
    const g = Math.round(lerp(aHex.g, bHex.g, amount));
    const bVal = Math.round(lerp(aHex.b, bHex.b, amount));
    return `rgb(${r}, ${g}, ${bVal})`;
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getGroundColor(offset) {
    // Ground color changes based on camera position
    const zone = Math.floor(offset / 500);
    const colors = ['#3d2b1f', '#4a3c31', '#5e4b38', '#3d2b1f', '#6b5a45'];
    return colors[zone % colors.length];
}

function getGroundDetailColor(offset) {
    // Ground detail color changes based on camera position
    const zone = Math.floor(offset / 500);
    const colors = ['#2e1f14', '#3d2e21', '#4a3b2c', '#2e1f14', '#564635'];
    return colors[zone % colors.length];
}

// Cloud data for parallax scrolling
let clouds = [];
function initClouds() {
    clouds = [];
    for (let i = 0; i < 15; i++) {
        clouds.push({
            x: Math.random() * 2000,
            y: Math.random() * 150 + 20,
            speed: 0.3 + Math.random() * 0.5,
            scale: 0.8 + Math.random() * 1.2
        });
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(173, 216, 230, 0.9)';
    clouds.forEach(cloud => {
        // Parallax effect: clouds move slower than camera
        const screenX = (cloud.x - cameraOffset * cloud.speed) % (canvas.width + 300);
        const drawX = screenX < -100 ? screenX + canvas.width + 300 : screenX;
        
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(drawX, cloud.y, 25 * cloud.scale, 0, Math.PI * 2);
        ctx.arc(drawX + 20, cloud.y - 10, 35 * cloud.scale, 0, Math.PI * 2);
        ctx.arc(drawX + 45, cloud.y, 28 * cloud.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
}

// Initialize clouds on game load
initClouds();

// Initial render
drawBackground();
