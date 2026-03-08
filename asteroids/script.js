// Asteroids Game Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');

// Game state
let score = 0;
let lives = 3;
let gameRunning = true;

// Ship properties
const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    thrusting: false,
    rotationSpeed: 0.08,
    thrust: 0.5,
    velocity: { x: 0, y: 0 },
    radius: 15,
    color: '#0f0'
};

// Game objects
let asteroids = [];
let bullets = [];
let keys = {};

// Initialize game
function init() {
    // Create initial asteroids
    createAsteroids(5);
    
    // Setup event listeners
    setupEventListeners();
    
    // Start game loop
    gameLoop();
}

// Create asteroids
function createAsteroids(count) {
    for (let i = 0; i < count; i++) {
        let asteroid = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 30 + Math.random() * 20,
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2
            },
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            color: '#f00'
        };
        
        // Make sure asteroids don't spawn on top of the ship
        const distance = Math.sqrt(
            Math.pow(asteroid.x - ship.x, 2) + 
            Math.pow(asteroid.y - ship.y, 2)
        );
        
        if (distance < 100) {
            asteroid.x = Math.random() * canvas.width;
            asteroid.y = Math.random() * canvas.height;
        }
        
        asteroids.push(asteroid);
    }
}

// Setup event listeners
function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // Shooting with spacebar
        if (e.key === ' ') {
            e.preventDefault();
            shootBullet();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
}

// Shoot bullet
function shootBullet() {
    // Ship tip position in local space is (0, -radius)
    // After rotation by angle θ and translation to ship position:
    const bulletX = ship.x + ship.radius * Math.sin(ship.angle);
    const bulletY = ship.y - ship.radius * Math.cos(ship.angle);
    
    // Forward direction after rotation: (sin(θ), -cos(θ))
    const bulletSpeed = 7;
    bullets.push({
        x: bulletX,
        y: bulletY,
        velocity: {
            x: bulletSpeed * Math.sin(ship.angle) + ship.velocity.x,
            y: -bulletSpeed * Math.cos(ship.angle) + ship.velocity.y
        },
        radius: 2,
        color: '#0ff'
    });
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw ship
    updateShip();
    drawShip();
    
    // Update and draw asteroids
    updateAsteroids();
    drawAsteroids();
    
    // Update and draw bullets
    updateBullets();
    drawBullets();
    
    // Check collisions
    checkCollisions();
    
    // Update UI
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Update ship position and rotation
function updateShip() {
    // Rotation
    if (keys['ArrowLeft']) {
        ship.angle -= ship.rotationSpeed;
    }
    if (keys['ArrowRight']) {
        ship.angle += ship.rotationSpeed;
    }
    
    // Thrust
    if (keys['ArrowUp']) {
        ship.thrusting = true;
        ship.velocity.x += Math.cos(ship.angle) * ship.thrust;
        ship.velocity.y += Math.sin(ship.angle) * ship.thrust;
    } else {
        ship.thrusting = false;
    }
    
    // Apply friction
    ship.velocity.x *= 0.98;
    ship.velocity.y *= 0.98;
    
    // Update position
    ship.x += ship.velocity.x;
    ship.y += ship.velocity.y;
    
    // Wrap around screen
    if (ship.x < 0) ship.x = canvas.width;
    if (ship.x > canvas.width) ship.x = 0;
    if (ship.y < 0) ship.y = canvas.height;
    if (ship.y > canvas.height) ship.y = 0;
}

// Draw ship
function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    
    // Draw ship as a triangle
    ctx.strokeStyle = ship.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Ship body
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(-ship.radius * 0.7, ship.radius);
    ctx.lineTo(0, ship.radius * 0.5);
    ctx.lineTo(ship.radius * 0.7, ship.radius);
    ctx.closePath();
    
    // Draw ship
    ctx.stroke();
    
    // Draw thrust if active
    if (ship.thrusting) {
        ctx.beginPath();
        ctx.moveTo(-ship.radius * 0.7, ship.radius);
        ctx.lineTo(0, ship.radius * 1.5);
        ctx.lineTo(ship.radius * 0.7, ship.radius);
        ctx.closePath();
        ctx.fillStyle = '#ff0';
        ctx.fill();
    }
    
    ctx.restore();
}

// Update asteroids
function updateAsteroids() {
    asteroids.forEach(asteroid => {
        asteroid.x += asteroid.velocity.x;
        asteroid.y += asteroid.velocity.y;
        asteroid.rotation += asteroid.rotationSpeed;
        
        // Wrap around screen
        if (asteroid.x < -asteroid.radius) asteroid.x = canvas.width + asteroid.radius;
        if (asteroid.x > canvas.width + asteroid.radius) asteroid.x = -asteroid.radius;
        if (asteroid.y < -asteroid.radius) asteroid.y = canvas.height + asteroid.radius;
        if (asteroid.y > canvas.height + asteroid.radius) asteroid.y = -asteroid.radius;
    });
}

// Draw asteroids
function drawAsteroids() {
    asteroids.forEach(asteroid => {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);
        
        ctx.strokeStyle = asteroid.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Draw irregular polygon for asteroid
        const sides = 8 + Math.floor(Math.random() * 4);
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const radius = asteroid.radius * (0.7 + Math.random() * 0.3);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    });
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Update position
        bullet.x += bullet.velocity.x;
        bullet.y += bullet.velocity.y;
        
        // Remove bullets that go off-screen
        if (bullet.x < 0 || bullet.x > canvas.width || 
            bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }
}

// Draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Check collisions
function checkCollisions() {
    // Bullet-Asteroid collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            
            // Calculate distance between bullet and asteroid
            const dx = bullet.x - asteroid.x;
            const dy = bullet.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroid.radius) {
                // Collision detected
                bullets.splice(i, 1);
                
                // Split asteroid into smaller ones or remove it
                if (asteroid.radius > 15) {
                    // Split into two smaller asteroids
                    for (let k = 0; k < 2; k++) {
                        const newAsteroid = {
                            x: asteroid.x,
                            y: asteroid.y,
                            radius: asteroid.radius / 2,
                            velocity: {
                                x: (Math.random() - 0.5) * 4,
                                y: (Math.random() - 0.5) * 4
                            },
                            rotation: Math.random() * Math.PI,
                            rotationSpeed: (Math.random() - 0.5) * 0.02,
                            color: '#f00'
                        };
                        asteroids.push(newAsteroid);
                    }
                }
                
                // Remove the original asteroid
                asteroids.splice(j, 1);
                
                // Increase score
                score += 100;
                
                break; // Break out of inner loop since bullet is destroyed
            }
        }
    }
    
    // Ship-Asteroid collisions
    for (let i = 0; i < asteroids.length; i++) {
        const asteroid = asteroids[i];
        
        // Calculate distance between ship and asteroid
        const dx = ship.x - asteroid.x;
        const dy = ship.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < ship.radius + asteroid.radius) {
            // Collision detected - decrease lives
            lives--;
            
            if (lives <= 0) {
                // Game over
                gameRunning = false;
                alert('Game Over! Final Score: ' + score);
            } else {
                // Reset ship position
                ship.x = canvas.width / 2;
                ship.y = canvas.height / 2;
                ship.velocity.x = 0;
                ship.velocity.y = 0;
            }
            
            // Remove the asteroid that hit the ship
            asteroids.splice(i, 1);
            break;
        }
    }
    
    // Create new asteroids if all destroyed
    if (asteroids.length === 0) {
        createAsteroids(5);
    }
}

// Start the game when page loads
window.addEventListener('load', init);