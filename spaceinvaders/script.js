// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const highScoreElement = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('spaceinvaders_highscore') || 0;
let lives = 3;
let player;

// Initialize high score display
highScoreElement.textContent = `HIGH SCORE: ${highScore}`;
let aliens = [];
let bullets = [];
let alienBullets = [];
let particles = [];
let stars = [];
let keys = {};
let alienDirection = 1;
let alienMoveDown = false;
let lastTime = 0;
let alienAnimationFrame = 0;
let wave = 1;
let mysteryShip = null; // Bonus alien
let mysteryTimer = 0;
let screenShake = 0;
let gameSpeedMultiplier = 1;

// Update high score display on load
highScoreElement.textContent = `HIGH SCORE: ${highScore}`;

// Enhanced retro color palette with CRT glow effects
const COLORS = {
    player: '#00ffaa', // Bright cyan-green (classic arcade)
    alien1Top: '#ff44ff', // Pink-purple (squid-like)
    alien2Middle: '#00ffff', // Cyan (crab-like)
    alien3Bottom: '#ffcc00', // Amber/orange (octopus-like)
    bulletPlayer: '#ffffaa', // Warm yellow
    bulletAlien: '#ff6666', // Reddish-orange
    mysteryShip: '#ff0000', // Bright red for bonus alien
    star: ['#ffffff', '#ffffcc', '#ccccff', '#ccffff'],
    nebulagreen: '#00aa55',
    nebulablue: '#0066cc',
    nebulapurple: '#8822cc'
};

// Starfield background with parallax
function initStars() {
    stars = [];

    // Near stars (faster, larger)
    for (let i = 0; i < 40; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - 60),
            size: Math.random() > 0.9 ? 2 : 1,
            brightness: Math.random(),
            twinkleSpeed: Math.random() * 0.08 + 0.02,
            speed: 0.5,
            color: Math.random() > 0.8 ? '#ffaaaa' : '#ffffff'
        });
    }

    // Far stars (slower, smaller)
    for (let i = 0; i < 120; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - 60),
            size: Math.random(),
            brightness: Math.random(),
            twinkleSpeed: Math.random() * 0.03 + 0.01,
            speed: 0.2,
            color: Math.random() > 0.5 ? '#ccffff' : (Math.random() > 0.5 ? '#ccccff' : '#ffffff')
        });
    }
}

function drawStars() {
    stars.forEach(star => {
        star.brightness += star.twinkleSpeed;
        if (star.brightness > 1 || star.brightness < 0.2) {
            star.twinkleSpeed = -star.twinkleSpeed;
        }

        // Parallax effect based on wave
        if (gameRunning) {
            star.x -= star.speed * alienDirection;
            if (star.x < 0) star.x = canvas.width;
            if (star.x > canvas.width) star.x = 0;
        }

        const alpha = Math.max(0.2, Math.min(1, star.brightness));

        // Draw star with glow
        ctx.fillStyle = typeof star.color === 'string' ? star.color : star.color[0];

        // Multi-color stars for retro feel
        if (!Array.isArray(star.color)) {
            ctx.shadowBlur = star.size * 4;
            ctx.shadowColor = star.color;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw a retro moon with enhanced detail
    drawMoon();
}

function drawMoon() {
    const moonX = canvas.width * 0.85;
    const moonY = 70;
    const moonRadius = 32;

    // Outer glow
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ffffcc';

    // Moon gradient
    const moonGradient = ctx.createRadialGradient(moonX, moonY, 5, moonX, moonY, moonRadius);
    moonGradient.addColorStop(0, '#fffff0');
    moonGradient.addColorStop(0.3, '#eeeeee');
    moonGradient.addColorStop(1, '#ccccbb');

    ctx.fillStyle = moonGradient;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // Moon craters (pixel art style with better detail)
    ctx.shadowBlur = 0;

    // Crater pattern using multiple craters
    const craterColors = ['#bbbbbb', '#aaaaaa', '#999999'];

    // Crater 1: Large central crater
    drawCrater(moonX - 10, moonY - 8, 6, craterColors[0]);
    drawCrater(moonX + 12, moonY - 6, 5, craterColors[1]);
    drawCrater(moonX + 5, moonY + 12, 7, craterColors[0]);
    drawCrater(moonX - 14, moonY + 3, 4, craterColors[2]);
    drawCrater(moonX + 2, moonY - 15, 4, craterColors[1]);
}

function drawCrater(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Add crater highlight for retro feel
    if (Math.random() > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - size/4, y - size/4, 1, 1);
    }
}

// Nebula clouds with better gradients
function drawNebula() {
    const centerX = canvas.width / 2;

    // Draw colorful nebulas in the background
    const gradient = ctx.createRadialGradient(centerX, 100, 30, centerX, 80, 200);
    gradient.addColorStop(0, 'rgba(150, 50, 150, 0.25)');
    gradient.addColorStop(0.3, 'rgba(0, 150, 200, 0.18)');
    gradient.addColorStop(0.6, 'rgba(0, 50, 180, 0.12)');
    gradient.addColorStop(1, 'rgba(0, 20, 100, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 160);

    // Add additional nebulas on sides
    const sideGradient = ctx.createRadialGradient(100, 80, 20, 100, 60, 150);
    sideGradient.addColorStop(0, 'rgba(255, 0, 150, 0.15)');
    sideGradient.addColorStop(1, 'rgba(255, 0, 150, 0)');

    ctx.fillStyle = sideGradient;
    ctx.beginPath();
    ctx.arc(120, 90, 140, -0.5, Math.PI + 0.5);
    ctx.fill();

    const rightGradient = ctx.createRadialGradient(canvas.width - 100, 90, 25, canvas.width - 100, 70, 140);
    rightGradient.addColorStop(0, 'rgba(100, 50, 255, 0.15)');
    rightGradient.addColorStop(1, 'rgba(100, 50, 255, 0)');

    ctx.fillStyle = rightGradient;
    ctx.beginPath();
    ctx.arc(canvas.width - 120, 95, 130, Math.PI - 0.5, 0.5);
    ctx.fill();
}

// Particle system for explosions with enhanced effects
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 15;
        this.vy = (Math.random() - 0.5) * 15;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.015;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.4;
        this.trail = [];
    }

    update() {
        // Store trail positions
        if (this.life > 0.6) {
            this.trail.push({ x: this.x, y: this.y, life: this.life });
            if (this.trail.length > 4) {
                this.trail.shift();
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;

        // Gravity effect on particles
        this.vy += 0.25;

        // Update velocity (slow down over time)
        this.vx *= 0.98;
    }

    draw() {
        ctx.save();

        // Draw trail first
        this.trail.forEach((pos, index) => {
            const alpha = pos.life * 0.5;
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.fillStyle = this.color;
            ctx.fillRect(pos.x - 1, pos.y - 1, this.size * (index + 1) / 4, this.size * (index + 1) / 4);
        });

        ctx.globalAlpha = Math.max(0, this.life);

        // Add glow effect
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;

        // Draw particle with rotation
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw particle as rotated rectangle with glow
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

        // Add spark effect for high-life particles
        if (this.life > 0.7) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -1, 2, 2);
        }

        ctx.restore();
    }
}

function createExplosion(x, y, color) {
    // Create main particles
    for (let i = 0; i < 25; i++) {
        particles.push(new Particle(x, y, color));
    }

    // Add some spark particles (yellow/white)
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(x, y, '#ffffff'));
    }

    // Add special colored sparks
    for (let i = 0; i < 8; i++) {
        const specialColors = ['#ffff00', '#ff00ff', '#00ffff'];
        particles.push(new Particle(x, y, specialColors[Math.floor(Math.random() * specialColors.length)]));
    }
}

// Extended pixel art sprite definitions with better detail
// Each alien has two animation frames (frame 0 and frame 1)

const PLAYER_SPRITE = {
    frame0: [
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 2, 1, 0, 0],
        [0, 1, 2, 3, 2, 1, 0],
        [1, 2, 3, 4, 3, 2, 1],
        [1, 3, 4, 5, 4, 3, 1],
        [1, 3, 4, 5, 4, 3, 1],
        [1, 2, 3, 0, 3, 2, 1],
        [1, 1, 1, 0, 1, 1, 1]
    ],
    frame1: [
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 2, 1, 0, 0],
        [0, 1, 2, 3, 2, 1, 0],
        [1, 2, 3, 4, 3, 2, 1],
        [1, 3, 4, 5, 4, 3, 1],
        [1, 3, 4, 5, 4, 3, 1],
        [0, 2, 3, 0, 3, 2, 0],
        [0, 1, 2, 0, 2, 1, 0]
    ],
    colors: ['#00ffaa', '#00cccc', '#00aaaa', '#008888', '#006666']
};

// Alien 1: Squid-like (top row) - Enhanced purple/pink
const ALIEN_SPRITE_1 = {
    frame0: [
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 2, 1, 2, 0, 0],
        [0, 2, 3, 4, 3, 2, 0],
        [1, 1, 4, 5, 4, 1, 1],
        [2, 3, 4, 5, 4, 3, 2],
        [0, 1, 2, 3, 2, 1, 0],
        [1, 2, 3, 4, 3, 2, 1],
        [0, 3, 0, 4, 0, 3, 0]
    ],
    frame1: [
        [0, 0, 2, 0, 2, 0, 0],
        [0, 1, 3, 4, 3, 1, 0],
        [1, 2, 4, 5, 4, 2, 1],
        [2, 3, 4, 5, 4, 3, 2],
        [0, 1, 2, 3, 2, 1, 0],
        [1, 2, 4, 5, 4, 2, 1],
        [0, 3, 2, 3, 2, 3, 0],
        [0, 0, 1, 4, 1, 0, 0]
    ],
    colors: ['#ff66ff', '#ff44ff', '#ff22ff', '#cc00cc', '#aa00aa']
};

// Alien 2: Crab-like (middle rows) - Enhanced cyan
const ALIEN_SPRITE_2 = {
    frame0: [
        [0, 0, 1, 0, 0],
        [0, 2, 3, 4, 0],
        [1, 3, 5, 4, 2],
        [2, 0, 4, 0, 3],
        [0, 1, 0, 2, 0],
        [1, 0, 3, 0, 4],
        [2, 3, 4, 5, 4],
        [0, 1, 2, 0, 1]
    ],
    frame1: [
        [0, 0, 2, 0, 0],
        [1, 3, 0, 4, 2],
        [2, 4, 5, 4, 3],
        [0, 3, 0, 2, 0],
        [0, 4, 0, 1, 0],
        [2, 5, 4, 3, 4],
        [1, 3, 2, 3, 2],
        [0, 4, 1, 0, 1]
    ],
    colors: ['#66ffff', '#44ffff', '#22ffff', '#00cccc', '#00aaaa']
};

// Alien 3: Octopus-like (bottom rows) - Enhanced orange
const ALIEN_SPRITE_3 = {
    frame0: [
        [0, 1, 0, 2, 0],
        [0, 3, 4, 5, 0],
        [1, 4, 5, 4, 2],
        [3, 0, 4, 0, 5],
        [0, 1, 0, 2, 0],
        [4, 5, 0, 3, 4],
        [0, 2, 1, 5, 0],
        [1, 0, 0, 0, 2]
    ],
    frame1: [
        [0, 1, 0, 2, 0],
        [0, 3, 4, 5, 0],
        [1, 4, 5, 4, 2],
        [3, 0, 4, 0, 5],
        [0, 1, 0, 2, 0],
        [4, 5, 0, 3, 4],
        [1, 5, 2, 0, 1],
        [0, 4, 3, 0, 2]
    ],
    colors: ['#ffcc66', '#ffbb44', '#ff9922', '#ee8800', '#cc6600']
};

// Mystery ship sprite (enhanced)
const MYSTERY_SPRITE = {
    frame0: [
        [0, 1, 2, 3, 3, 2, 1, 0],
        [1, 2, 0, 3, 4, 0, 2, 1],
        [2, 3, 4, 5, 5, 4, 3, 2],
        [0, 3, 4, 0, 0, 4, 3, 0],
        [0, 3, 4, 5, 5, 4, 3, 0],
        [1, 2, 0, 4, 4, 0, 2, 1],
        [2, 3, 5, 4, 4, 5, 3, 2],
        [0, 1, 3, 4, 5, 3, 1, 0]
    ],
    frame1: [
        [0, 1, 2, 3, 3, 2, 1, 0],
        [1, 2, 0, 3, 4, 0, 2, 1],
        [2, 3, 4, 5, 5, 4, 3, 2],
        [0, 3, 4, 0, 0, 4, 3, 0],
        [1, 2, 0, 5, 5, 0, 2, 1],
        [0, 3, 4, 5, 5, 4, 3, 0],
        [0, 3, 4, 5, 5, 4, 3, 0],
        [1, 2, 4, 5, 5, 4, 2, 1]
    ],
    colors: ['#ff3333', '#ff0000', '#cc0000', '#aa0000', '#880000']
};

function drawPixelSprite(ctx, sprite, x, y, size, colors) {
    const pixelSize = size / sprite.length;

    ctx.shadowBlur = 3;
    ctx.shadowColor = colors[0];

    for (let row = 0; row < sprite.length; row++) {
        for (let col = 0; col < sprite[row].length; col++) {
            const cellValue = sprite[row][col];
            if (cellValue > 0) {
                ctx.fillStyle = colors[cellValue % colors.length];

                // Add subtle glow to larger pixels
                if (cellValue > 3) {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = colors[0];
                }

                ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize - 0.5, pixelSize - 0.5);
            }
        }
    }

    ctx.shadowBlur = 0; // Reset shadow
}

// Player class with engine trail effect
class Player {
    constructor() {
        this.width = 56;
        this.height = 48;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 50;
        this.speed = 6;
        this.colors = COLORS.player.split(',').map(c => c.trim());
        this.cooldown = 0;
        this.engineTrail = [];
    }

    draw() {
        const sprite = alienAnimationFrame % 20 < 10 ? PLAYER_SPRITE.frame0 : PLAYER_SPRITE.frame1;
        drawPixelSprite(ctx, sprite, this.x, this.y, this.width, PLAYER_SPRITE.colors);

        // Draw engine trail
        if (this.cooldown < 20 && gameRunning) {
            this.engineTrail.push({ x: this.x + this.width/2, y: this.y + this.height, size: 3 });
            if (this.engineTrail.length > 8) {
                this.engineTrail.shift();
            }
        }

        // Draw engine trail
        if (this.engineTrail.length > 0) {
            for (let i = this.engineTrail.length - 1; i >= 0; i--) {
                const trail = this.engineTrail[i];
                ctx.globalAlpha = (i + 1) / (this.engineTrail.length + 1);
                ctx.fillStyle = '#ffff00';
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ffaa00';

                const size = trail.size + (this.engineTrail.length - i) * 0.5;
                ctx.beginPath();
                ctx.arc(trail.x, trail.y + i * 3, size, 0, Math.PI * 2);
                ctx.fill();

                if (i > this.engineTrail.length - 3) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(trail.x - 1, trail.y + i * 3 - 1, 2, 2);
                }
            }
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    update() {
        if (keys['ArrowLeft'] && this.x > 10) {
            this.x -= this.speed;
        }
        if (keys['ArrowRight'] && this.x < canvas.width - this.width - 10) {
            this.x += this.speed;
        }

        if (this.cooldown > 0) {
            this.cooldown--;
        }
    }

    shoot() {
        if (this.cooldown <= 0) {
            bullets.push(new Bullet(this.x + this.width / 2 - 2, this.y, 0, -10, COLORS.bulletPlayer));
            this.cooldown = 25; // Frames between shots
        }
    }
}

// Alien class with sprite animation and beam effect
class Alien {
    constructor(x, y, type) {
        this.width = 48;
        this.height = 42;
        this.x = x;
        this.y = y;
        this.speed = (1 + wave * 0.15) * gameSpeedMultiplier;
        this.type = type;

        if (type === 0) {
            this.sprite = ALIEN_SPRITE_1;
            this.colors = ALIEN_SPRITE_1.colors;
            this.scoreValue = 30;
        } else if (type === 1) {
            this.sprite = ALIEN_SPRITE_2;
            this.colors = ALIEN_SPRITE_2.colors;
            this.scoreValue = 20;
        } else {
            this.sprite = ALIEN_SPRITE_3;
            this.colors = ALIEN_SPRITE_3.colors;
            this.scoreValue = 10;
        }

        this.eyeOffset = Math.random() * 2; // Random eye movement
    }

    draw() {
        const frame = Math.floor(alienAnimationFrame / 10) % 2;
        const sprite = frame === 0 ? this.sprite.frame0 : this.sprite.frame1;

        drawPixelSprite(ctx, sprite, this.x, this.y, this.width, this.colors);

        // Add eye glow effect
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#ffffff';

        const eyeX1 = this.x + 8 + this.eyeOffset;
        const eyeX2 = this.x + this.width - 10 - this.eyeOffset;
        const eyeY = this.y + 14;

        ctx.fillRect(eyeX1, eyeY, 3, 2);
        ctx.fillRect(eyeX2, eyeY, 3, 2);

        // Add beam effect when shooting
        if (Math.random() < 0.1 && gameRunning) {
            ctx.strokeStyle = this.colors[1];
            ctx.lineWidth = 2;
            ctx.shadowBlur = 6;
            ctx.shadowColor = this.colors[0];

            const beamX = this.x + this.width / 2;
            ctx.beginPath();
            ctx.moveTo(beamX, this.y + this.height);
            ctx.lineTo(beamX + (Math.random() - 0.5) * 20, this.y + this.height + Math.random() * 30);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
    }

    update() {
        this.x += this.speed * alienDirection;

        // Update eye offset
        if (alienAnimationFrame % 10 === 0) {
            this.eyeOffset = (Math.random() - 0.5) * 4;
        }
    }

    shoot() {
        if (Math.random() < 0.002 + wave * 0.001) {
            alienBullets.push(new Bullet(this.x + this.width / 2 - 2, this.y + this.height, 0, 5, COLORS.bulletAlien));
        }
    }
}

// Mystery ship (bonus alien) with enhanced visuals
class MysteryShip {
    constructor() {
        this.width = 56;
        this.height = 40;
        this.y = 35;
        this.direction = Math.random() < 0.5 ? -1 : 1;
        this.x = this.direction === 1 ? -this.width : canvas.width;
        this.speed = (3 + Math.random() * 2) * gameSpeedMultiplier;
        this.sprite = MYSTERY_SPRITE;
        this.colors = MYSTERY_SPRITE.colors;
        this.active = true;
        this.phase = 0;
    }

    draw() {
        const frame = Math.floor(alienAnimationFrame / 5) % 2;
        const sprite = frame === 0 ? this.sprite.frame0 : this.sprite.frame1;

        // Blink effect
        if (Math.floor(Date.now() / 80) % 2 === 0 || frame === 1) {
            drawPixelSprite(ctx, sprite, this.x, this.y, this.width, this.colors);

            // Draw engine exhaust
            ctx.fillStyle = '#ff8800';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0000';

            const engineOffset = 5;
            if (this.direction === 1) {
                ctx.fillRect(this.x + engineOffset, this.y + this.height - 4, 6, 8);
                ctx.fillRect(this.x + engineOffset + 10, this.y + this.height - 4, 6, 8);
            } else {
                ctx.fillRect(this.x + this.width - engineOffset - 6, this.y + this.height - 4, 6, 8);
                ctx.fillRect(this.x + this.width - engineOffset - 16, this.y + this.height - 4, 6, 8);
            }

            ctx.shadowBlur = 0;
        }
    }

    update() {
        this.x += this.speed * this.direction;

        // Check if ship went off screen
        if ((this.direction === 1 && this.x > canvas.width) ||
            (this.direction === -1 && this.x < -this.width)) {
            this.active = false;
        }

        // Phase-based movement for interesting pattern
        this.phase++;

        // Randomly shoot
        if (Math.random() < 0.03) {
            alienBullets.push(new Bullet(this.x + this.width / 2 - 2, this.y + this.height,
                (Math.random() - 0.5) * 2, 4, COLORS.bulletAlien));
        }
    }
}

// Bullet class with beam effect
class Bullet {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 4;
        this.height = 12;
        this.color = color;
        this.trail = [];
    }

    update() {
        // Store trail positions
        if (this.vy < 0 || this.vy > 0) {
            this.trail.push({ x: this.x, y: this.y, life: 1.0 });
            if (this.trail.length > 6) {
                this.trail.shift();
            }
        }

        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        // Draw beam trail
        ctx.globalAlpha = 0.6;

        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            ctx.fillStyle = this.color;
            ctx.fillRect(t.x, t.y + (i * 2), this.width - 1, 4);
        }

        ctx.globalAlpha = 1;

        // Draw main beam
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x, this.y, this.width, 3);

        // Beam core
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 1, this.y + 2, this.width - 2, this.height);

        // Beam tip
        ctx.fillStyle = '#ffffaa';
        ctx.fillRect(this.x - 1, this.y + this.height - 2, this.width + 2, 4);

        ctx.shadowBlur = 0;
    }
}

// Update score display
function updateScore() {
    scoreElement.textContent = `SCORE: ${score}`;
}

// Update high score display
function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceinvaders_highscore', highScore);
    }
    highScoreElement.textContent = `HIGH SCORE: ${highScore}`;
}

// Update lives display
function updateLives() {
    livesElement.textContent = `LIVES: ${lives}`;
}

// Draw protective barriers with enhanced details
function drawProtectiveBarriers() {
    const barrierCount = 4;
    const barrierWidth = 90;
    const barrierHeight = 70;
    const gap = (canvas.width - barrierCount * barrierWidth) / (barrierCount + 1);
    const startY = canvas.height - 100;

    for (let i = 0; i < barrierCount; i++) {
        const bx = gap + i * (gap + barrierWidth);
        drawBarrier(bx, startY, 120, COLORS.player);
    }
}

function drawBarrier(x, y, damageLimit, color) {
    // Base shield with gradient
    const gradient = ctx.createLinearGradient(x, y, x + 120, y);
    gradient.addColorStop(0, 'rgba(0, 30, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(0, 60, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 30, 0, 1)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, 120, damageLimit);

    // Shield border with glow
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.strokeRect(x, y, 120, damageLimit);

    // Inner grid pattern
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.4;

    // Horizontal lines
    for (let i = 0; i < damageLimit; i += 15) {
        ctx.beginPath();
        ctx.moveTo(x + (i % 30), y + i);
        ctx.lineTo(x + 120 - (i % 30), y + i);
        ctx.stroke();
    }

    // Vertical pillars
    for (let i = 20; i < 100; i += 30) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i, y + damageLimit - (i % 20));
        ctx.stroke();
    }

    // Decorative elements on shield
    ctx.fillStyle = color;

    // Corner decorations
    ctx.fillRect(x + 5, y + 5, 4, 4);
    ctx.fillRect(x + 111, y + 5, 4, 4);
    ctx.fillRect(x + 5, y + damageLimit - 9, 4, 4);
    ctx.fillRect(x + 111, y + damageLimit - 9, 4, 4);

    // Side decorations
    for (let i = 0; i < damageLimit; i += 25) {
        ctx.fillRect(x + 10, y + i + 5, 4, 2);
        ctx.fillRect(x + 106, y + i + 5, 4, 2);

        // Decorative bolts
        if (i % 50 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 15, y + i + 8, 2, 2);
            ctx.fillRect(x + 103, y + i + 8, 2, 2);
            ctx.fillStyle = color;
        }
    }

    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
}

// Draw border with arcade cabinet look (enhanced)
function drawBorder() {
    ctx.shadowBlur = 12;
    ctx.shadowColor = COLORS.player;

    // Top border with gradient
    const topGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    topGradient.addColorStop(0, '#003300');
    topGradient.addColorStop(0.5, '#006600');
    topGradient.addColorStop(1, '#003300');

    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, canvas.width, 28);

    // Bottom border with gradient
    const bottomGradient = ctx.createLinearGradient(0, canvas.height - 28, canvas.width, canvas.height);
    bottomGradient.addColorStop(0, '#003300');
    bottomGradient.addColorStop(0.5, '#006600');
    bottomGradient.addColorStop(1, '#003300');

    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, canvas.height - 28, canvas.width, 28);

    // Side borders
    ctx.fillStyle = '#003300';
    ctx.fillRect(0, 28, 12, canvas.height - 56);
    ctx.fillRect(canvas.width - 12, 28, 12, canvas.height - 56);

    // Decorative lines
    ctx.strokeStyle = COLORS.player;
    ctx.lineWidth = 2;

    // Top decorative line
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(canvas.width, 28);
    ctx.stroke();

    // Bottom decorative line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 28);
    ctx.lineTo(canvas.width, canvas.height - 28);
    ctx.stroke();

    // Corner decorations with glow
    const cornerSize = 12;
    ctx.fillStyle = COLORS.player;

    // Add glow to corners
    ctx.shadowBlur = 10;

    // Top left
    ctx.fillRect(4, 4, cornerSize, 3);
    ctx.fillRect(4, 4, 3, cornerSize);

    // Top right
    ctx.fillRect(canvas.width - 7, 4, cornerSize, 3);
    ctx.fillRect(canvas.width - 4, 4, 3, cornerSize);

    // Bottom left
    ctx.fillRect(4, canvas.height - 7, cornerSize, 3);
    ctx.fillRect(4, canvas.height - 4, 3, cornerSize);

    // Bottom right
    ctx.fillRect(canvas.width - 7, canvas.height - 7, cornerSize, 3);
    ctx.fillRect(canvas.width - 4, canvas.height - 4, 3, cornerSize);

    ctx.shadowBlur = 0;
}

// Wave indicator with enhanced styling
function drawWaveIndicator() {
    ctx.fillStyle = COLORS.nebulablue;

    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.nebulablue;

    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'center';

    // Wave text
    const waveText = `WAVE ${wave}`;
    ctx.fillText(waveText, canvas.width / 2, 22);

    // Decorative elements
    ctx.fillStyle = COLORS.nebulablue;
    const waveWidth = 80;
    const centerY = 22;

    // Decorative lines on sides
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - waveWidth, centerY);
    ctx.lineTo(canvas.width / 2 - 10, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + waveWidth, centerY);
    ctx.lineTo(canvas.width / 2 + 10, centerY);
    ctx.stroke();

    // Decorative dots
    ctx.fillRect(canvas.width / 2 - waveWidth - 5, centerY - 2, 4, 4);
    ctx.fillRect(canvas.width / 2 + waveWidth + 1, centerY - 2, 4, 4);

    ctx.shadowBlur = 0;
}

// Draw game screen
function drawGameScreen() {
    // Clear canvas with slight black background
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply screen shake
    if (screenShake > 0) {
        ctx.save();
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
        screenShake *= 0.9; // Decay
        if (screenShake < 0.5) screenShake = 0;
    }

    // Draw background elements
    drawNebula();
    drawStars();

    // Draw borders and wave info
    drawBorder();
    drawWaveIndicator();

    // Draw protective barriers
    drawProtectiveBarriers();

    // Update and draw player
    if (player && gameRunning) {
        player.update();
        player.draw();
    } else if (player) {
        player.draw();
    }

    // Spawn mystery ship occasionally
    if (!mysteryShip && Math.random() < 0.001 + wave * 0.0002) {
        mysteryShip = new MysteryShip();
    }

    if (mysteryShip && mysteryShip.active) {
        mysteryShip.update();
        mysteryShip.draw();
    } else if (mysteryShip && !mysteryShip.active) {
        mysteryShip = null;
    }

    // Update aliens position
    let moveDown = false;

    for (let i = 0; i < aliens.length; i++) {
        const alien = aliens[i];
        alien.update();

        // Check if alien should move down
        if (alien.x <= 15 || alien.x + alien.width >= canvas.width - 15) {
            moveDown = true;
        }
    }

    // Move aliens down if needed
    if (moveDown) {
        alienDirection *= -1;
        screenShake = 5; // Small shake when aliens move
        for (let i = 0; i < aliens.length; i++) {
            aliens[i].y += 25;
        }
    }

    // Update and draw aliens
    for (let i = 0; i < aliens.length; i++) {
        const alien = aliens[i];
        alien.draw();

        // Random shooting
        alien.shoot();
    }

    // Update and draw bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.update();
        bullet.draw();

        // Remove bullets that go off screen
        if (bullet.y < -10) {
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

                // Create explosion
                createExplosion(alien.x + alien.width/2, alien.y + alien.height/2, alien.colors[0]);

                // Remove alien and bullet
                aliens.splice(j, 1);
                bullets.splice(i, 1);
                score += alien.scoreValue;
                updateScore();
                updateHighScore();
                screenShake = 8; // Big shake on kill
                break;
            }
        }

        // Check collisions with mystery ship
        if (mysteryShip && mysteryShip.active) {
            const ms = mysteryShip;
            if (bullet.x < ms.x + ms.width &&
                bullet.x + bullet.width > ms.x &&
                bullet.y < ms.y + ms.height &&
                bullet.y + bullet.height > ms.y) {

                // Bonus points (random 50-150)
                const bonusPoints = Math.floor(Math.random() * 101) + 50;
                score += bonusPoints;

                createExplosion(ms.x + ms.width/2, ms.y + ms.height/2, COLORS.mysteryShip);

                mysteryShip.active = false;
                mysteryShip = null;
                bullets.splice(i, 1);

                // Screen flash
                ctx.fillStyle = COLORS.mysteryShip;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 1.0;
                screenShake = 15; // Big shake on bonus kill

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
        if (bullet.y > canvas.height + 10) {
            alienBullets.splice(i, 1);
            continue;
        }

        // Check collisions with player
        if (player && bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {

            // Create explosion
            createExplosion(player.x + player.width/2, player.y + player.height/2, COLORS.player);

            // Remove bullet and lose a life
            alienBullets.splice(i, 1);
            lives--;
            updateLives();
            screenShake = 20; // Big shake on player hit

            if (lives <= 0) {
                gameOver();
            }
            break;
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update();
        particle.draw();

        if (particle.life <= 0) {
            particles.splice(i, 1);
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
    if (aliens.length === 0 && gameRunning) {
        wave++;
        gameSpeedMultiplier += 0.15; // Speed up each wave
        initGame(); // Reset for next wave
    }

    // Animate aliens (twice per frame for smoother animation)
    if ((Date.now() - lastTime) > 100 / gameSpeedMultiplier) {
        alienAnimationFrame++;
    }

    if (screenShake > 0) {
        ctx.restore();
    }
}

// Game loop
function gameLoop(timestamp) {
    if (!gameRunning && particles.length === 0) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    drawGameScreen();

    requestAnimationFrame(gameLoop);
}

// Game over function
function gameOver() {
    gameRunning = false;

    // Big screen shake on game over
    screenShake = 30;
    drawGameScreen();

    updateHighScore();
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Start game function
function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    initGame();
    gameRunning = true;

    // Reset game speed
    gameSpeedMultiplier = 1;

    requestAnimationFrame(gameLoop);
}

// Initialize aliens
function createAliens() {
    aliens = [];
    const rows = 5;
    const cols = 10;
    const startX = 80;
    const startY = 60;
    const spacingX = 52;
    const spacingY = 48;

    for (let row = 0; row < rows; row++) {
        // Determine sprite type based on row
        let spriteType;
        if (row === 0 || row === 1) {
            spriteType = 0; // Squid-like (top)
        } else if (row === 2 || row === 3) {
            spriteType = 1; // Crab-like (middle)
        } else {
            spriteType = 2; // Octopus-like (bottom)
        }

        for (let col = 0; col < cols; col++) {
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;
            aliens.push(new Alien(x, y, spriteType));
        }
    }
}

// Initialize game
function initGame() {
    // Reset player position
    if (!player) {
        player = new Player();
    } else {
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - 50;
        player.engineTrail = [];
    }

    bullets = [];
    alienBullets = [];
    particles = [];
    mysteryShip = null;
    alienDirection = 1;

    // Clear screen
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    createAliens();
    updateScore();
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
    score = 0;
    lives = 3;
    wave = 1;
    gameSpeedMultiplier = 1;
    updateScore();
    updateLives();

    // Reset player
    if (player) {
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - 50;
    }

    initGame();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
});

startButton.addEventListener('click', startGame);

// Initialize on load
initStars();
initGame();
