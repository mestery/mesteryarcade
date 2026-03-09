// Asteroids Game Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');

// Game state
let score = 0;
let lives = 3;
let highScore = localStorage.getItem('asteroids_highscore') || 0;
let gameRunning = true;
let showTitleScreen = true;

// Input keys
const keys = {};

// Arrays for game objects
let asteroids = [];
let bullets = [];
let floatingTexts = [];

// Nebula background - colorful glowing clouds with animated gradients
let nebulas = [];
for (let i = 0; i < 12; i++) {
    nebulas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 150 + Math.random() * 200,
        color: `hsl(${Math.random() * 360}, 80%, ${15 + Math.random() * 20}%)`,
        opacity: 0.04 + Math.random() * 0.08,
        rotationSpeed: (Math.random() - 0.5) * 0.003,
        rotation: Math.random() * Math.PI,
        pulseSpeed: 0.5 + Math.random() * 1.5
    });
}

// Enhanced starfield with parallax effect and colored stars
let stars = [];
for (let i = 0; i < 250; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5,
        brightness: Math.random(),
        twinkleSpeed: 0.03 + Math.random() * 0.05,
        colorHue: Math.floor(Math.random() * 60 + 180), // Cyan to violet range
        speed: Math.random() * 0.3 // Parallax speed
    });
}

// Explosion particles with trails and enhanced effects
let particles = [];

// Ship properties
const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: -Math.PI / 2, // Point up initially
    thrusting: false,
    rotationSpeed: 0.08,
    thrust: 0.5,
    velocity: { x: 0, y: 0 },
    radius: 15,
    blinkTimer: 0
};

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
        // Generate irregular asteroid shape
        const sides = 8 + Math.floor(Math.random() * 4);
        const vertices = [];
        for (let j = 0; j < sides; j++) {
            const angle = (j / sides) * Math.PI * 2;
            // Vary the radius for each vertex to create jagged rock shapes
            const variance = 0.7 + Math.random() * 0.4;
            vertices.push({
                angle: angle,
                distance: variance
            });
        }

        let asteroid = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 30 + Math.random() * 20,
            velocity: {
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3
            },
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.03,
            color: '#d4d4d4',
            vertices: vertices
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

// Screen shake effect
let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };

function applyScreenShake() {
    if (screenShake.duration > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.duration--;
        
        if (screenShake.duration === 0) {
            screenShake.x = 0;
            screenShake.y = 0;
        }
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
}

// Trigger screen shake
function triggerScreenShake(intensity, duration) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
}

// Setup event listeners
function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;

        // Start game on space if on title screen
        if (showTitleScreen && e.key === ' ') {
            e.preventDefault();
            startGame();
            return;
        }

        // Shooting with spacebar
        if (e.key === ' ' && gameRunning) {
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
    // If game is not running (game over), don't continue the loop
    if (!gameRunning) {
        // If we're showing title screen, keep it running to allow re-starting
        if (showTitleScreen) {
            requestAnimationFrame(gameLoop);
        }
        return;
    }

    // Apply screen shake
    applyScreenShake();

    // Clear canvas with gradient background
    const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 100,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    bgGradient.addColorStop(0, '#0a0a15');
    bgGradient.addColorStop(1, '#020208');

    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Draw background (nebulas and stars)
    drawBackground();

    // If showing title screen
    if (showTitleScreen) {
        drawTitleScreen();

        // Only draw particles on title screen for effect
        if (particles.length > 0) {
            drawParticles();
        }

        ctx.restore();
        requestAnimationFrame(gameLoop);
        return;
    }

    // Draw ship
    updateShip();
    drawShip();

    // Update and draw asteroids
    updateAsteroids();
    drawAsteroids();

    // Update and draw bullets
    updateBullets();
    drawBullets();

    // Draw particles
    drawParticles();

    // Draw floating score text
    drawFloatingTexts();

    ctx.restore();

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

// Draw ship with enhanced graphics
function drawShip() {
    // Blink effect when invulnerable (after being hit)
    if (ship.blinkTimer > 0) {
        ship.blinkTimer--;
        if (Math.floor(ship.blinkTimer / 5) % 2 === 0) {
            return; // Skip drawing to create blinking effect
        }
    }

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    // Ship glow effect - dynamic based on state
    if (ship.thrusting) {
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#00ffff';
    } else {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00ffff';
    }

    // Draw ship as a triangle with fill
    ctx.strokeStyle = '#aaffff';
    ctx.fillStyle = '#001f3f'; // Deep blue-black fill
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Ship body (upward pointing triangle)
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(-ship.radius * 0.7, ship.radius);
    ctx.lineTo(0, ship.radius * 0.5); // Indent at bottom for retro look
    ctx.lineTo(ship.radius * 0.7, ship.radius);
    ctx.closePath();

    // Fill and stroke with gradient for depth
    const bodyGradient = ctx.createLinearGradient(-ship.radius, -ship.radius, ship.radius, ship.radius);
    bodyGradient.addColorStop(0, '#002a5f');
    bodyGradient.addColorStop(0.3, '#001f3f');
    bodyGradient.addColorStop(0.5, '#002e6f');
    bodyGradient.addColorStop(0.7, '#001f3f');
    bodyGradient.addColorStop(1, '#002a5f');

    ctx.fillStyle = bodyGradient;
    ctx.fill();
    ctx.stroke();

    // Draw window/cockpit with retro grid pattern
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';

    // Window glow - gradient from center
    const windowGradient = ctx.createRadialGradient(0, -ship.radius * 0.3, 1, 0, -ship.radius * 0.3, ship.radius * 0.25);
    windowGradient.addColorStop(0, '#ffffff');
    windowGradient.addColorStop(0.2, '#aaffff');
    windowGradient.addColorStop(0.5, '#44ffff');
    windowGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = windowGradient;
    ctx.beginPath();
    ctx.arc(0, -ship.radius * 0.3, ship.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit rim with glow
    ctx.strokeStyle = '#aaffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(0, -ship.radius * 0.3, ship.radius * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    // Add grid pattern inside window
    ctx.strokeStyle = 'rgba(170, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -ship.radius * 0.3, ship.radius * 0.15, 0, Math.PI * 2);
    ctx.stroke();

    // Draw thrust if active
    if (ship.thrusting) {
        // Thrust glow effect - dynamic flickering
        const flicker = Math.sin(Date.now() / 12) * 0.4 + 0.6;
        ctx.shadowBlur = 50 * flicker;
        ctx.shadowColor = '#ff3300';

        // Create flickering flame effect with multiple passes
        const flameLength = ship.radius * (1.3 + Math.random() * 0.5);
        const flameWidth = ship.radius * (0.4 + Math.random() * 0.2);

        // Outer flame glow - intense orange to magenta gradient
        const outerGradient = ctx.createLinearGradient(0, ship.radius, 0, ship.radius + flameLength);
        outerGradient.addColorStop(0, 'rgba(255, 80, 0, 1)');
        outerGradient.addColorStop(0.2, 'rgba(255, 140, 0, 0.8)');
        outerGradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.5)');
        outerGradient.addColorStop(1, 'rgba(255, 100, 100, 0)');

        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.moveTo(-ship.radius * 0.7, ship.radius);
        ctx.quadraticCurveTo(0, ship.radius + flameLength * 1.25, ship.radius * 0.7, ship.radius);
        ctx.closePath();
        ctx.fill();

        // Middle flame - cyan core with magenta edges
        const middleGradient = ctx.createLinearGradient(0, ship.radius, 0, ship.radius + flameLength);
        middleGradient.addColorStop(0, '#ff4400');
        middleGradient.addColorStop(0.3, '#ffff00');
        middleGradient.addColorStop(0.6, '#ff8800');
        middleGradient.addColorStop(1, 'rgba(255, 180, 50, 0)');

        ctx.fillStyle = middleGradient;
        ctx.beginPath();
        ctx.moveTo(-flameWidth * 0.75, ship.radius);
        ctx.quadraticCurveTo(0, ship.radius + flameLength * 1.2, flameWidth * 0.75, ship.radius);
        ctx.closePath();
        ctx.fill();

        // Inner core of flame - white hot with cyan edge
        const innerGradient = ctx.createLinearGradient(0, ship.radius, 0, ship.radius + flameLength * 0.75);
        innerGradient.addColorStop(0, '#ffffff');
        innerGradient.addColorStop(0.2, '#ffffee');
        innerGradient.addColorStop(0.4, '#aaffff');
        innerGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = innerGradient;
        ctx.shadowBlur = 30 * flicker;
        ctx.shadowColor = '#aaffff';
        ctx.beginPath();
        ctx.moveTo(-flameWidth * 0.4, ship.radius);
        ctx.quadraticCurveTo(0, ship.radius + flameLength * 0.75, flameWidth * 0.4, ship.radius);
        ctx.closePath();
        ctx.fill();

        // Add trailing sparks with glow - more numerous and brighter
        const sparkCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < sparkCount; i++) {
            ctx.shadowBlur = 25 * flicker;
            ctx.shadowColor = '#ff0066';

            const sparkX = (Math.random() - 0.5) * flameWidth;
            const sparkY = ship.radius + flameLength + Math.random() * 40;
            const size = 2 + Math.random() * 5;

            // Spark trail
            ctx.fillStyle = `rgba(255, 120, 180, ${0.7 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, size, 0, Math.PI * 2);
            ctx.fill();

            // Add glow ring around spark
            const sparkGradient = ctx.createRadialGradient(sparkX, sparkY, size/2, sparkX, sparkY, size * 4);
            sparkGradient.addColorStop(0, 'rgba(255, 0, 180, 1)');
            sparkGradient.addColorStop(0.5, 'rgba(255, 50, 180, 0.5)');
            sparkGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = sparkGradient;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, size * 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add side thruster sparks with colors
        for (let i = 0; i < 2; i++) {
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#00ccff';

            const sideThrustX = (Math.random() - 0.5) * ship.radius * 1.6;
            const sideThrustY = ship.radius + Math.random() * 20;

            ctx.fillStyle = `rgba(${50 + Math.floor(Math.random()*100)}, ${200 + Math.floor(Math.random()*55)}, 255, ${0.7 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(sideThrustX, sideThrustY, 3 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add trail particles
        if (Math.random() > 0.2) {
            const trailX = (Math.random() - 0.5) * ship.radius;
            const trailY = ship.radius + flameLength + Math.random() * 30;
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#aaffff';
            
            // Trail particle with glow
            const trailGradient = ctx.createRadialGradient(trailX, trailY, 0, trailX, trailY, 15);
            trailGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
            trailGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = trailGradient;
            ctx.beginPath();
            ctx.arc(trailX, trailY, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    } else {
        // Idle glow when not thrusting
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
    }

    // Add engine vents on sides
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = 'rgba(170, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-ship.radius * 0.5, ship.radius * 0.3, 2, 0, Math.PI * 2);
    ctx.arc(ship.radius * 0.5, ship.radius * 0.3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Add engine glow on sides with color variation
    if (ship.thrusting) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff5500';
        const engineGlowGradient = ctx.createLinearGradient(-ship.radius * 0.5, ship.radius * 0.3, ship.radius * 0.5, ship.radius * 0.3);
        engineGlowGradient.addColorStop(0, 'rgba(255, 80, 50, 0.7)');
        engineGlowGradient.addColorStop(0.5, 'rgba(255, 180, 100, 0.9)');
        engineGlowGradient.addColorStop(1, 'rgba(255, 80, 50, 0.7)');
        ctx.fillStyle = engineGlowGradient;
        ctx.beginPath();
        ctx.arc(-ship.radius * 0.5, ship.radius * 0.3, 5 + Math.random() * 2, 0, Math.PI * 2);
        ctx.arc(ship.radius * 0.5, ship.radius * 0.3, 5 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw diagonal accents on ship for retro feel
    ctx.strokeStyle = 'rgba(170, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-ship.radius * 0.3, -ship.radius * 0.5);
    ctx.lineTo(ship.radius * 0.2, ship.radius * 0.2);
    ctx.stroke();

    // Add side thruster glow effect
    if (ship.thrusting) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#aaffff';
        
        // Thrust flames on sides
        const sideFlameLength = ship.radius * 0.6;
        ctx.fillStyle = 'rgba(170, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(-ship.radius * 0.6, ship.radius * 0.4);
        ctx.lineTo(-ship.radius * 1.2, ship.radius * 0.7 + Math.random() * 10);
        ctx.lineTo(-ship.radius * 0.6, ship.radius * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(ship.radius * 0.6, ship.radius * 0.4);
        ctx.lineTo(ship.radius * 1.2, ship.radius * 0.7 + Math.random() * 10);
        ctx.lineTo(ship.radius * 0.6, ship.radius * 0.5);
        ctx.closePath();
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

// Draw asteroids with enhanced graphics
function drawAsteroids() {
    asteroids.forEach(asteroid => {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);

        // Determine color based on size (larger = redder, smaller = bluer)
        const baseHue = 20 + Math.random() * 30; // Orange/Red base
        const saturation = 70 + Math.random() * 20;
        const lightness = 35 + Math.random() * 35;

        // Size-based color variation
        let asteroidHue = baseHue;
        if (asteroid.radius < 20) {
            asteroidHue = 180 + Math.random() * 60; // Blue-ish to violet for small
        } else if (asteroid.radius < 35) {
            asteroidHue = 20 + Math.random() * 40; // Orange-ish to red for medium
        }

        const mainColor = `hsl(${asteroidHue}, ${saturation}%, ${lightness}%)`;
        const shadowColor = `hsl(${asteroidHue}, ${saturation}%, ${lightness - 15}%)`;

        // Outer glow with pulsing effect
        const pulse = Math.sin(Date.now() / 400) * 8 + 12;
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20 + pulse;
        ctx.shadowColor = mainColor;

        ctx.beginPath();

        // Draw jagged polygon using pre-generated vertices
        asteroid.vertices.forEach((vertex, i) => {
            const x = Math.cos(vertex.angle) * asteroid.radius * vertex.distance;
            const y = Math.sin(vertex.angle) * asteroid.radius * vertex.distance;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.closePath();

        // Create gradient fill for 3D effect with multiple light sources
        const gradient = ctx.createRadialGradient(-asteroid.radius * 0.35, -asteroid.radius * 0.35, asteroid.radius * 0.15, 0, 0, asteroid.radius);

        // Add more gradient stops for dramatic lighting
        gradient.addColorStop(0, `hsl(${asteroidHue}, ${saturation}%, ${lightness + 30}%)`);
        gradient.addColorStop(0.2, `hsl(${asteroidHue}, ${saturation}%, ${lightness + 18}%)`);
        gradient.addColorStop(0.5, `hsl(${asteroidHue}, ${saturation}%, ${lightness + 8}%)`);
        gradient.addColorStop(0.75, `hsl(${asteroidHue}, ${saturation}%, ${lightness - 5}%)`);
        gradient.addColorStop(1, `hsl(${asteroidHue}, ${saturation}%, ${Math.max(5, lightness - 40)}%)`);

        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw stroke with glow
        ctx.stroke();

        // Remove glow for detail lines
        ctx.shadowBlur = 0;

        // Draw crater details - retro space rock style with glow
        const craterCount = Math.floor(asteroid.radius / 8);

        for (let i = 0; i < craterCount; i++) {
            const craterX = Math.cos(i * 2.5 + asteroid.rotation) * (asteroid.radius * 0.45);
            const craterY = Math.sin(i * 2.5 + asteroid.rotation) * (asteroid.radius * 0.45);
            const craterRadius = asteroid.radius * (0.08 + Math.random() * 0.15);

            // Crater with gradient for depth
            const craterGradient = ctx.createRadialGradient(craterX, craterY, 0, craterX, craterY, craterRadius);
            craterGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
            craterGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
            craterGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');

            ctx.fillStyle = craterGradient;
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';

            ctx.beginPath();
            ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2);
            ctx.fill();

            // Add crater rim highlight
            if (craterRadius > 2) {
                ctx.strokeStyle = `rgba(${asteroidHue}, ${saturation}, ${lightness + 40}, 0.5)`;
                ctx.lineWidth = 1;
                ctx.shadowBlur = 10;
                ctx.shadowColor = mainColor;
                ctx.beginPath();
                ctx.arc(craterX, craterY, craterRadius * 0.85, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Add crater highlights for depth (specular reflection)
        if (asteroid.radius > 25) {
            const highlightX = -asteroid.radius * 0.35;
            const highlightY = -asteroid.radius * 0.35;

            // Glowing highlight
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffffff';

            const highlightGradient = ctx.createRadialGradient(highlightX, highlightY, 0, highlightX, highlightY, asteroid.radius * 0.28);
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.25)');
            highlightGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = highlightGradient;
            ctx.beginPath();
            ctx.arc(highlightX, highlightY, asteroid.radius * 0.28, 0, Math.PI * 2);
            ctx.fill();

            // Outer rim highlight
            ctx.shadowBlur = 10;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 + Math.random() * 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(highlightX, highlightY, asteroid.radius * 0.18, 0, Math.PI * 2);
            ctx.stroke();

            // Add crater to highlight area
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(highlightX * 1.2, highlightY * 1.2, asteroid.radius * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add small rocks stuck to larger asteroids with glow effect
        if (asteroid.radius > 30 && Math.random() > 0.85) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = mainColor;

            const smallRockX = Math.cos(Math.random() * Math.PI * 2) * (asteroid.radius * 0.85);
            const smallRockY = Math.sin(Math.random() * Math.PI * 2) * (asteroid.radius * 0.85);
            const smallRockRadius = asteroid.radius * (0.15 + Math.random() * 0.1);

            // Small rock gradient
            const smallRockGradient = ctx.createRadialGradient(smallRockX, smallRockY, 0, smallRockX, smallRockY, smallRockRadius);
            smallRockGradient.addColorStop(0, `hsl(${asteroidHue}, ${saturation - 15}%, ${lightness + 30}%)`);
            smallRockGradient.addColorStop(0.5, `hsl(${asteroidHue}, ${saturation - 10}%, ${lightness + 10}%)`);
            smallRockGradient.addColorStop(1, `hsl(${asteroidHue}, ${saturation - 20}%, ${Math.max(5, lightness - 40)}%)`);

            ctx.fillStyle = smallRockGradient;
            ctx.beginPath();
            ctx.arc(smallRockX, smallRockY, smallRockRadius, 0, Math.PI * 2);
            ctx.fill();

            // Small rock outline with glow
            ctx.strokeStyle = `rgba(${asteroidHue}, ${saturation}, ${lightness}, 0.5)`;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 8;
            ctx.shadowColor = mainColor;
            ctx.stroke();

            // Small crater on rock
            if (smallRockRadius > 3) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.arc(smallRockX + smallRockRadius * 0.3, smallRockY + smallRockRadius * 0.3, smallRockRadius * 0.25, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Add small decorative crystals on some asteroids
        if (asteroid.radius > 30 && Math.random() > 0.9) {
            const crystalX = Math.cos(Math.random() * Math.PI * 2) * (asteroid.radius * 0.8);
            const crystalY = Math.sin(Math.random() * Math.PI * 2) * (asteroid.radius * 0.8);
            const crystalSize = asteroid.radius * (0.12 + Math.random() * 0.1);

            // Glowing crystal with multiple colors
            const crystalHue = Math.random() > 0.5 ? 180 + Math.random() * 60 : 280 + Math.random() * 40;
            const crystalColor = `hsl(${crystalHue}, ${90 + Math.random() * 10}%, ${75 + Math.random() * 20}%)`;
            
            ctx.shadowBlur = 18;
            ctx.shadowColor = crystalColor;

            // Crystal shape - pyramid-like
            const points = 3 + Math.floor(Math.random() * 3);
            ctx.fillStyle = crystalColor;
            
            ctx.beginPath();
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2 + asteroid.rotation;
                ctx.lineTo(
                    crystalX + Math.cos(angle) * crystalSize,
                    crystalY + Math.sin(angle) * crystalSize
                );
            }
            ctx.closePath();
            ctx.fill();

            // Inner core glow
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(crystalX, crystalY, crystalSize * 0.35, 0, Math.PI * 2);
            ctx.fill();

            // Crystal tip highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(crystalX + crystalSize * 0.2, crystalY - crystalSize * 0.2, crystalSize * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add surface details - retro texture lines
        if (asteroid.radius > 35 && Math.random() > 0.92) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = mainColor;
            
            const lineX = Math.cos(Math.random() * Math.PI * 2) * (asteroid.radius * 0.6);
            const lineY = Math.sin(Math.random() * Math.PI * 2) * (asteroid.radius * 0.6);
            const lineLength = asteroid.radius * (0.2 + Math.random() * 0.4);
            const lineAngle = Math.random() * Math.PI * 2;
            
            ctx.strokeStyle = `rgba(${asteroidHue}, ${saturation - 10}, ${lightness + 30}, 0.5)`;
            ctx.lineWidth = 1;
            
            const endX = lineX + Math.cos(lineAngle) * lineLength;
            const endY = lineY + Math.sin(lineAngle) * lineLength;
            
            ctx.beginPath();
            ctx.moveTo(lineX, lineY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Line glow at ends
            const startGlow = ctx.createRadialGradient(lineX, lineY, 0, lineX, lineY, 5);
            startGlow.addColorStop(0, mainColor);
            startGlow.addColorStop(1, 'transparent');
            
            ctx.fillStyle = startGlow;
            ctx.beginPath();
            ctx.arc(lineX, lineY, 5, 0, Math.PI * 2);
            ctx.fill();
        }

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

// Draw bullets with enhanced graphics
function drawBullets() {
    bullets.forEach(bullet => {
        // Bullet glow effect - energetic trail
        ctx.shadowBlur = 20;
        ctx.shadowColor = bullet.color || '#0ff';

        // Create cone-shaped beam effect
        const angle = Math.atan2(bullet.velocity.y, bullet.velocity.x);
        const trailLength = 15 + Math.random() * 10;
        
        // Calculate beam points
        const tipX = bullet.x - Math.cos(angle) * trailLength;
        const tipY = bullet.y - Math.sin(angle) * trailLength;

        // Beam outer glow
        const beamGradient = ctx.createRadialGradient(bullet.x, bullet.y, 2, tipX, tipY, 8);
        
        // Color based on bullet type
        if (bullet.color === '#ff0066') {
            // Red/pink beam
            beamGradient.addColorStop(0, 'rgba(255, 0, 102, 1)');
            beamGradient.addColorStop(0.3, 'rgba(255, 100, 150, 0.6)');
            beamGradient.addColorStop(1, 'rgba(255, 0, 102, 0)');
        } else {
            // Cyan beam
            beamGradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
            beamGradient.addColorStop(0.3, 'rgba(100, 255, 255, 0.6)');
            beamGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        }

        ctx.fillStyle = beamGradient;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(bullet.x + Math.sin(angle) * 4, bullet.y - Math.cos(angle) * 4);
        ctx.lineTo(bullet.x - Math.sin(angle) * 4, bullet.y + Math.cos(angle) * 4);
        ctx.closePath();
        ctx.fill();

        // Inner core - bright white/yellow
        const coreGradient = ctx.createRadialGradient(bullet.x, bullet.y, 1, bullet.x, bullet.y, 5);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.3, '#ffffaa');
        coreGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Bullet shine effect
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 25;
        ctx.shadowColor = bullet.color || '#0ff';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Bullet trail - energetic streak behind
        if (Math.random() > 0.4) {
            ctx.shadowBlur = 15;
            
            const trailColor = bullet.color || '#0ff';
            ctx.strokeStyle = `rgba(${trailColor === '#0ff' ? '0, 255, 255' : '255, 100, 50'}, ${0.3 + Math.random() * 0.2})`;
            ctx.lineWidth = 2;

            const streakLength = trailLength + Math.random() * 10;
            ctx.beginPath();
            ctx.moveTo(
                bullet.x - Math.cos(angle) * streakLength,
                bullet.y - Math.sin(angle) * streakLength
            );
            ctx.lineTo(bullet.x, bullet.y);
            ctx.stroke();
        }

        // Add starburst effect for new bullets
        if (Math.random() > 0.8) {
            const sparkX = bullet.x + (Math.random() - 0.5) * 8;
            const sparkY = bullet.y + (Math.random() - 0.5) * 8;
            
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    });
}

// Create explosion particles
function createExplosion(x, y, color) {
    // Main debris particles - brighter and more varied
    const debrisCount = 50;
    for (let i = 0; i < debrisCount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 22,
            vy: (Math.random() - 0.5) * 22,
            life: 1.0,
            color: color || `hsl(${Math.random() * 60}, ${85 + Math.random() * 20}%, ${45 + Math.random() * 30}%)`,
            size: 2 + Math.random() * 5,
            type: 'debris',
            decay: 0.96 + Math.random() * 0.03
        });
    }

    // Spark particles - more numerous and brighter with color variety
    const sparkCount = 35;
    for (let i = 0; i < sparkCount; i++) {
        // Color variety: cyan, magenta, yellow, white
        let hue;
        const sparkType = Math.random();
        if (sparkType < 0.35) hue = 180 + Math.random() * 60; // Cyan
        else if (sparkType < 0.65) hue = 300 + Math.random() * 40; // Magenta
        else if (sparkType < 0.85) hue = 40 + Math.random() * 20; // Yellow
        else hue = 0 + Math.random() * 10; // White/Red

        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 32,
            vy: (Math.random() - 0.5) * 32,
            life: 1.0,
            color: `hsl(${hue}, ${95 + Math.random() * 10}%, ${70 + Math.random() * 25}%)`,
            size: 1 + Math.random() * 4,
            type: 'spark',
            trailLength: 3 + Math.random() * 5
        });
    }

    // Glowing fire particles - enhanced with more variety and intensity
    const fireCount = 45;
    for (let i = 0; i < fireCount; i++) {
        // Mix of colors: orange, yellow, red, magenta, cyan
        let hue;
        const fireType = Math.random();
        if (fireType < 0.25) hue = Math.random() * 30; // Orange/Red
        else if (fireType < 0.55) hue = 45 + Math.random() * 25; // Yellow
        else if (fireType < 0.75) hue = 280 + Math.random() * 35; // Magenta/Purple
        else if (fireType < 0.9) hue = 180 + Math.random() * 40; // Cyan
        else hue = 200 + Math.random() * 40; // Blue-ish

        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.5) * 14,
            life: 1.0,
            color: `hsl(${hue}, ${95 + Math.random() * 10}%, ${60 + Math.random() * 30}%)`,
            size: 4 + Math.random() * 7,
            type: 'fire',
            pulseSpeed: 0.5 + Math.random() * 1.5
        });
    }

    // Add expanding shockwave ring with enhanced colors
    particles.push({
        x: x,
        y: y,
        radius: 5,
        maxRadius: Math.max(canvas.width, canvas.height) * 0.35,
        life: 1.0,
        color: `hsl(${Math.random() * 60 + 20}, ${100}, ${50 + Math.random() * 30}%)`, // Orange to cyan
        type: 'shockwave',
        rotationSpeed: (Math.random() - 0.5) * 0.1
    });

    // Add secondary ring
    particles.push({
        x: x,
        y: y,
        radius: 15,
        maxRadius: Math.max(canvas.width, canvas.height) * 0.45,
        life: 1.0,
        color: `hsl(${Math.random() * 60 + 180}, ${90}, ${70 + Math.random() * 20}%)`, // Cyan to violet
        type: 'secondary_ring',
        rotationSpeed: (Math.random() - 0.5) * 0.15
    });

    // Add starburst particles for more dramatic effect
    const burstCount = 15;
    for (let i = 0; i < burstCount; i++) {
        const angle = (i / burstCount) * Math.PI * 2;
        const speed = 15 + Math.random() * 10;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: `hsl(${Math.random() * 60}, ${95 + Math.random() * 10}%, ${70 + Math.random() * 25}%)`,
            size: 1.5 + Math.random() * 3,
            type: 'burst',
            decay: 0.92 + Math.random() * 0.06
        });
    }
}

// Draw particles with enhanced graphics
function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Apply decay to velocity for particles that have it
        if (particle.decay) {
            particle.vx *= particle.decay;
            particle.vy *= particle.decay;
        }
        
        particle.life -= 0.025;

        if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = particle.life;

        if (particle.type === 'debris') {
            // Rock fragment - jagged square with glow
            const size = particle.size * particle.life;

            // Color gradient based on life
            let debrisColor;
            if (typeof particle.color === 'string' && particle.color.startsWith('hsl')) {
                // Parse HSL and update lightness based on particle life
                const hslMatch = particle.color.match(/hsl\(([^,]+),\s*([^,]+%),\s*([^)]+)\)/);
                if (hslMatch) {
                    const hue = hslMatch[1];
                    const saturation = hslMatch[2];
                    const newLightness = Math.min(100, Math.round(70 * particle.life));
                    debrisColor = `hsl(${hue}, ${saturation}, ${newLightness}%)`;
                } else {
                    debrisColor = '#ffffff';
                }
            } else {
                debrisColor = particle.color || '#ffffff';
            }

            ctx.fillStyle = debrisColor;
            ctx.shadowBlur = 25 * particle.life;
            ctx.shadowColor = debrisColor;

            ctx.save();
            ctx.translate(particle.x, particle.y);

            // Spin faster as life decreases
            const rotation = (1 - particle.life) * 8 + Date.now() / 100;
            ctx.rotate(rotation);

            // Draw jagged diamond shape
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size * 0.5, 0);
            ctx.lineTo(0, size);
            ctx.lineTo(-size * 0.5, 0);
            ctx.closePath();

            // Gradient fill with glow effect
            const debrisGradient = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size);
            debrisGradient.addColorStop(0, '#ffffff');
            debrisGradient.addColorStop(0.3, debrisColor);
            debrisGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');

            ctx.fillStyle = debrisGradient;
            ctx.fill();

            // Draw diagonal line for retro feel
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-size * 0.3, -size);
            ctx.lineTo(size * 0.3, size);
            ctx.stroke();

            // Draw corner glow points
            for (let j = 0; j < 4; j++) {
                const angle = (j * Math.PI / 2) + rotation;
                ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + particle.life * 0.4})`;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(
                    Math.cos(angle) * size,
                    Math.sin(angle) * size,
                    1.5, 0, Math.PI * 2
                );
                ctx.fill();
            }

            ctx.restore();

        } else if (particle.type === 'spark') {
            // Bright spark - streak effect with colors
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const angle = Math.atan2(particle.vy, particle.vx);

            // Color gradient for spark trail
            const hue = particle.color.match(/hsl\((\d+)/);
            const baseHue = hue ? parseInt(hue[1]) : 60;

            ctx.shadowBlur = 30 * particle.life;
            ctx.shadowColor = `hsl(${baseHue}, 100%, 70%)`;

            // Spark trail - thin and fast
            ctx.strokeStyle = `hsla(${baseHue}, 100%, ${70 + particle.life * 30}%, ${particle.life})`;
            ctx.lineWidth = particle.size;

            const streakLength = speed * 3.0 + (1 - particle.life) * 25;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);

            // Add curve to spark trail for more dynamic feel
            const midX = particle.x - Math.cos(angle) * streakLength / 2;
            const midY = particle.y - Math.sin(angle) * streakLength / 2;
            const endX = particle.x - Math.cos(angle) * streakLength;
            const endY = particle.y - Math.sin(angle) * streakLength;

            ctx.quadraticCurveTo(midX, midY, endX, endY);
            ctx.stroke();

            // Add glow point at tip
            if (particle.life > 0.5) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 35;
                ctx.beginPath();
                ctx.arc(endX, endY, 2.5 * particle.life, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (particle.type === 'fire') {
            // Fire particle - glowing orb with pulsing effect
            const pulse = Math.sin(Date.now() / (120 - particle.life * 60)) * 3 + 5;
            const size = particle.size * (2.8 - particle.life);
            
            const gradient = ctx.createRadialGradient(particle.x, particle.y, pulse * particle.life, particle.x, particle.y, size);

            const hue = particle.color.match(/hsl\((\d+)/);
            const baseHue = hue ? parseInt(hue[1]) : 30;

            gradient.addColorStop(0, `hsla(${baseHue}, ${100 + particle.life * 50}%, ${95 + particle.life * 10}%, ${particle.life})`);
            gradient.addColorStop(0.25, `hsla(${baseHue}, ${100 + particle.life * 50}%, ${70 + particle.life * 20}%, ${particle.life})`);
            gradient.addColorStop(0.5, `hsla(${baseHue}, ${100 + particle.life * 30}%, ${50 + particle.life * 25}%, ${particle.life * 0.8})`);
            gradient.addColorStop(0.75, `hsla(${baseHue}, 100%, ${30 + particle.life * 20}%, ${particle.life * 0.4})`);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.shadowBlur = 35 * particle.life;

            // Dynamic shadow color based on fire type
            if (baseHue < 40) {
                ctx.shadowColor = '#ffaa00'; // Orange/Yellow
            } else if (baseHue > 280) {
                ctx.shadowColor = '#ff00ff'; // Magenta
            } else if (baseHue < 120) {
                ctx.shadowColor = '#ffff00'; // Yellow
            } else if (baseHue < 200) {
                ctx.shadowColor = '#00ffff'; // Cyan
            } else {
                ctx.shadowColor = `hsl(${baseHue}, 100%, 70%)`;
            }

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();

            // Add inner bright core
            if (particle.life > 0.3) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 45;
                const coreSize = size * 0.35 * particle.life;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, coreSize, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (particle.type === 'shockwave') {
            // Shockwave ring - expanding circle with rotation
            particle.radius += (12 + Math.random() * 8) * particle.life;

            // Guard against non-finite values
            if (!isFinite(particle.x) || !isFinite(particle.y) || !isFinite(particle.radius)) {
                particles.splice(i, 1);
                continue;
            }

            ctx.shadowBlur = 35 * particle.life;
            
            // Parse color and apply life
            let shockColor = particle.color.match(/hsl\(([^)]+)\)/);
            if (shockColor) {
                ctx.strokeStyle = `hsl(${shockColor[1]}, 100%, ${50 + particle.life * 30}%)`;
                ctx.fillStyle = `hsla(0, 100%, ${50 + Math.random() * 30}%, ${particle.life})`;
            } else {
                ctx.strokeStyle = `rgba(255, 100, 0, ${particle.life})`;
                ctx.fillStyle = `rgba(255, 100, 0, ${particle.life})`;
            }
            
            ctx.lineWidth = 5 * particle.life;

            // Create expanding ring effect
            const innerRadius = Math.max(0.1, particle.radius * 0.75);
            const outerRadius = Math.max(0.1, particle.radius);
            const ringGradient = ctx.createRadialGradient(particle.x, particle.y, innerRadius, particle.x, particle.y, outerRadius);
            ringGradient.addColorStop(0, 'transparent');
            ringGradient.addColorStop(0.4, `rgba(255, 150, 50, ${particle.life * 0.6})`);
            ringGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = ringGradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();

            // Outer ring line with glow
            ctx.shadowBlur = 40 * particle.life;
            ctx.strokeStyle = `rgba(255, 180, 50, ${particle.life})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius * 0.95, 0, Math.PI * 2);
            ctx.stroke();

        } else if (particle.type === 'secondary_ring') {
            // Secondary expanding ring with different color
            particle.radius += (15 + Math.random() * 10) * particle.life;

            ctx.shadowBlur = 30 * particle.life;
            
            // Parse color and apply life
            let ringColor = particle.color.match(/hsl\(([^)]+)\)/);
            if (ringColor) {
                ctx.strokeStyle = `hsl(${ringColor[1]}, 90%, ${70 + particle.life * 30}%)`;
            } else {
                ctx.strokeStyle = `rgba(0, 180, 255, ${particle.life})`;
            }
            
            ctx.lineWidth = 3 * particle.life;

            // Guard against non-finite values
            if (!isFinite(particle.x) || !isFinite(particle.y) || !isFinite(particle.radius)) {
                particles.splice(i, 1);
                continue;
            }

            // Create ring with gradient
            const innerRadius = Math.max(0.1, particle.radius * 0.8);
            const outerRadius = Math.max(0.1, particle.radius);
            const ringGradient = ctx.createRadialGradient(particle.x, particle.y, innerRadius, particle.x, particle.y, outerRadius);
            ringGradient.addColorStop(0, 'transparent');
            ringGradient.addColorStop(0.5, `rgba(150, 200, 255, ${particle.life * 0.5})`);
            ringGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = ringGradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, outerRadius, 0, Math.PI * 2);
            ctx.fill();

            // Outer ring line
            ctx.strokeStyle = `rgba(170, 220, 255, ${particle.life})`;
            ctx.shadowBlur = 25 * particle.life;
            const outerRingRadius = Math.max(0.1, outerRadius * 0.92);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, outerRingRadius, 0, Math.PI * 2);
            ctx.stroke();

        } else if (particle.type === 'burst') {
            // Starburst particle - fast moving streak
            ctx.shadowBlur = 25 * particle.life;
            
            let burstColor = particle.color.match(/hsl\(([^)]+)\)/);
            if (burstColor) {
                ctx.fillStyle = `hsla(${burstColor[1]}, 95%, ${70 + particle.life * 25}%, ${particle.life})`;
                ctx.shadowColor = `hsl(${burstColor[1]}, 100%, ${70}%)`;
            } else {
                ctx.fillStyle = `rgba(255, 100, 0, ${particle.life})`;
            }
            
            // Draw streak
            const size = particle.size * particle.life;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();

            // Add small sparks
            if (Math.random() > 0.7) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 20;
                const sparkX = particle.x + (Math.random() - 0.5) * 15;
                const sparkY = particle.y + (Math.random() - 0.5) * 15;
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 2 * particle.life, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Reset global alpha
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
}

// Draw starfield background with nebulas
function drawBackground() {
    // Parallax starfield - stars move slowly
    stars.forEach(star => {
        star.x += star.speed;
        star.y += star.speed * 0.5; // Slight vertical component for depth
        
        // Wrap around screen
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;
    });

    // Enhanced nebulas with pulsing effect and rotation
    nebulas.forEach(nebula => {
        nebula.rotation += nebula.rotationSpeed;

        // Pulsing opacity for dramatic effect
        const pulse = Math.sin(Date.now() / (2000 + nebula.pulseSpeed * 1000)) * 0.02 + nebula.opacity;

        ctx.save();
        ctx.translate(nebula.x, nebula.y);
        ctx.rotate(nebula.rotation);

        // Create gradient for nebula with glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, nebula.size);

        // Parse original color
        let baseColor = nebula.color;
        if (baseColor.includes('hsl')) {
            // Extract HSL components and add pulse effect
            const hueMatch = baseColor.match(/hsl\((\d+), (\d+)%, (\d+)%/);
            if (hueMatch) {
                const hue = hueMatch[1];
                const sat = hueMatch[2];
                const light = hueMatch[3];
                baseColor = `hsl(${hue}, ${sat}%, ${light}%)`;
            }
        }

        // Create gradient with pulse
        const color = baseColor.replace('%)', '%, ' + pulse + ')');
        gradient.addColorStop(0, baseColor.replace('%)', '%, ' + (pulse * 1.5) + ')'));
        gradient.addColorStop(0.2, baseColor.replace('%)', '%, ' + (pulse * 1.2) + ')'));
        gradient.addColorStop(0.5, baseColor.replace('%)', '%, ' + pulse + ')'));
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;

        // Add glow effect
        ctx.shadowBlur = 50 * pulse;
        if (nebula.color.includes('hsl')) {
            ctx.shadowColor = nebula.color.replace('%)', '%, ' + pulse + ')');
        } else {
            ctx.shadowColor = nebula.color;
        }

        ctx.beginPath();
        ctx.arc(0, 0, nebula.size, 0, Math.PI * 2);
        ctx.fill();

        // Add secondary ring for extra depth
        ctx.shadowBlur = 30 * pulse;
        ctx.strokeStyle = nebula.color.replace('%)', '%, ' + (pulse * 0.5) + ')');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, nebula.size * 1.25, 0, Math.PI * 2);
        ctx.stroke();

        // Add faint outer glow ring
        ctx.shadowBlur = 15 * pulse;
        ctx.strokeStyle = nebula.color.replace('%)', '%, ' + (pulse * 0.2) + ')');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, nebula.size * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    });

    // Enhanced stars with more variety and parallax effect
    stars.forEach(star => {
        star.brightness += star.twinkleSpeed;
        if (star.brightness > 1 || star.brightness < 0.2) {
            star.twinkleSpeed = -star.twinkleSpeed;
        }

        const alpha = 0.3 + star.brightness;

        // Colored stars for more variety - broader color range
        const hue = star.colorHue + (Math.random() * 40 - 20);

        // Glowing stars with multiple layers
        ctx.shadowBlur = star.size * 5;
        
        // Calculate shadow color based on star hue
        let shadowHue = hue;
        if (hue > 180 && hue < 260) shadowHue = 240; // Blue stars
        else if (hue > 310 || hue < 40) shadowHue = 25; // Orange/Red stars
        else if (hue > 40 && hue < 120) shadowHue = 60; // Yellow stars
        
        ctx.shadowColor = `hsla(${shadowHue}, ${60 + Math.random() * 40}%, ${70 + Math.random() * 25}%, ${alpha})`;

        ctx.fillStyle = `hsla(${hue}, ${70 + Math.random() * 30}%, ${65 + Math.random() * 25}%, ${alpha})`;

        // Twinkle effect
        const twinkleSize = star.size * (0.5 + 0.5 * Math.sin(Date.now() / (100 + star.size * 20)));

        // Draw star glow
        const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3.5);
        glowGradient.addColorStop(0, `hsla(${hue}, ${70 + Math.random() * 30}%, ${80 + Math.random() * 25}%, ${alpha})`);
        glowGradient.addColorStop(0.3, `hsla(${hue}, ${70 + Math.random() * 30}%, ${65 + Math.random() * 25}%, ${alpha * 0.5})`);
        glowGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw star core
        ctx.shadowBlur = 0;
        
        // Core brightness with twinkle
        const coreAlpha = alpha * (0.7 + 0.3 * Math.sin(Date.now() / (150 + star.size * 25)));
        ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
        
        const finalSize = twinkleSize * (0.5 + 0.3 * Math.sin(Date.now() / (180 + star.size * 20)));
        ctx.beginPath();
        ctx.arc(star.x, star.y, finalSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw cross shape for bright stars
        if (star.size > 1.8) {
            const crossHue = hue;
            ctx.strokeStyle = `hsla(${crossHue}, ${70 + Math.random() * 30}%, ${75 + Math.random() * 25}%, ${alpha})`;
            ctx.lineWidth = star.size * 0.6;

            const crossSize = star.size * 3;
            ctx.beginPath();
            ctx.moveTo(star.x - crossSize, star.y);
            ctx.lineTo(star.x + crossSize, star.y);
            ctx.moveTo(star.x, star.y - crossSize);
            ctx.lineTo(star.x, star.y + crossSize);
            ctx.stroke();
        }

        // Draw faint comet trail for some stars
        if (Math.random() > 0.98) {
            const trailHue = hue;
            ctx.strokeStyle = `hsla(${trailHue}, ${70 + Math.random() * 30}%, ${65 + Math.random() * 25}%, ${alpha * 0.3})`;
            ctx.lineWidth = star.size * 0.4;
            
            const trailLength = star.size * 20;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star.x - trailLength * Math.cos(0.5), star.y - trailLength * Math.sin(0.5));
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
    });

    // Draw score popups
    drawFloatingTexts();
}

// Draw floating score text on asteroid explosions
function drawFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const text = floatingTexts[i];
        
        // Update position and life
        text.y -= 1; // Float upward
        text.life -= 0.02;
        
        if (text.life <= 0) {
            floatingTexts.splice(i, 1);
            continue;
        }
        
        ctx.save();
        ctx.globalAlpha = text.life;
        
        // Score popup gradient
        const scoreGradient = ctx.createLinearGradient(text.x - 20, text.y - 15, text.x + 20, text.y + 15);
        scoreGradient.addColorStop(0, '#ffffff');
        scoreGradient.addColorStop(0.5, '#ffff00');
        scoreGradient.addColorStop(1, '#ffaa00');
        
        ctx.fillStyle = scoreGradient;
        ctx.font = `900 ${text.size}px 'Courier New', monospace`;
        
        // Add glow effect
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 10 + text.life * 20;
        
        // Center the text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw shadow for depth
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0066';
        ctx.fillText('+' + text.text, text.x, text.y);
        
        // Draw main text
        ctx.shadowBlur = 0;
        ctx.fillStyle = scoreGradient;
        ctx.fillText('+' + text.text, text.x, text.y);
        
        // Add small explosion particles around score
        if (text.life > 0.8) {
            for (let j = 0; j < 3; j++) {
                const px = text.x + (Math.random() - 0.5) * 40;
                const py = text.y + (Math.random() - 0.5) * 20;
                const size = Math.random() * 4 + 1;
                
                ctx.fillStyle = `rgba(255, 200, 0, ${text.life})`;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

// Draw title screen with enhanced graphics
function drawTitleScreen() {
    // Title text glow effect
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#aaffff';

    // Main title "ASTEROIDS"
    const titleGradient = ctx.createLinearGradient(0, 120, canvas.width, 120);
    titleGradient.addColorStop(0, '#aaffff');
    titleGradient.addColorStop(0.25, '#ffffff');
    titleGradient.addColorStop(0.5, '#aaffff');
    titleGradient.addColorStop(0.75, '#ffaa00');
    titleGradient.addColorStop(1, '#aaffff');

    ctx.fillStyle = titleGradient;
    ctx.font = '900 72px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw title text with shadow
    const titleText = 'ASTEROIDS';
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#ffaa00';
    
    // Slight pulse effect on title
    const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.02;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 3);
    
    // Create gradient for each letter
    ctx.font = '900 72px "Courier New", monospace';
    
    // Draw individual letters with colors
    const letterSpacing = 10;
    let x = -(titleText.length * 20);
    
    for (let i = 0; i < titleText.length; i++) {
        const letter = titleText[i];
        const hue = (i * 30 + Date.now() / 20) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 85%)`;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        
        ctx.save();
        ctx.scale(pulseScale, pulseScale);
        ctx.fillText(letter, x, 0);
        ctx.restore();
        
        x += 35;
    }
    
    ctx.restore();

    // Draw subtitle with glowing effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff5500';
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 24px "Courier New", monospace';
    
    const subtitleY = canvas.height / 3 + 70;
    ctx.fillText('RETRO SPACE ARCADE', canvas.width / 2, subtitleY);

    // Draw high score
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffff00';
    ctx.font = '400 20px "Courier New", monospace';
    
    const scoreY = canvas.height / 3 + 100;
    ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width / 2, scoreY);

    // Draw blinking "PRESS START" message
    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
        const startGradient = ctx.createLinearGradient(0, canvas.height - 120, canvas.width, canvas.height - 120);
        startGradient.addColorStop(0, '#aaffff');
        startGradient.addColorStop(0.5, '#ffffff');
        startGradient.addColorStop(1, '#aaffff');

        ctx.fillStyle = startGradient;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00ffff';
        
        const startText = 'PRESS SPACE TO START GAME';
        ctx.font = '900 28px "Courier New", monospace';
        
        // Draw pulsing border around start text
        const textWidth = ctx.measureText(startText).width;
        const startX = canvas.width / 2 - textWidth / 2 - 30;
        const startY = canvas.height - 120;

        ctx.shadowBlur = 30;
        ctx.shadowColor = '#aaffff';
        ctx.fillText(startText, canvas.width / 2, startY);
    }

    // Draw controls info
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffaa00';
    ctx.fillStyle = '#aaffff';
    ctx.font = '400 16px "Courier New", monospace';

    const controlsY = canvas.height - 80;
    ctx.fillText('ARROWS to Move | SPACE to Shoot', canvas.width / 2, controlsY);

    // Draw title screen particles (optional - for visual flair)
    if (Math.random() > 0.9) {
        // Occasionally draw a small background particle effect
        const px = Math.random() * canvas.width;
        const py = Math.random() * 100 + 50;
        ctx.fillStyle = `rgba(255, 200, 100, ${Math.random() * 0.3})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffaa00';
        ctx.beginPath();
        ctx.arc(px, py, 3 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Check collisions
function checkCollisions() {
    // Bullet-Asteroid collisions - process in a way that avoids index issues
    const bulletsToRemove = [];
    
    // Create a temporary copy of bullets to iterate over
    const bulletsToProcess = [...bullets];
    
    for (let i = 0; i < bulletsToProcess.length; i++) {
        const bullet = bulletsToProcess[i];
        
        // Process asteroids backwards to avoid index issues
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];

            // Calculate distance between bullet and asteroid
            const dx = bullet.x - asteroid.x;
            const dy = bullet.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < asteroid.radius) {
                // Collision detected - mark bullet for removal from original array
                // Find the actual index in the original bullets array
                const bulletIndex = bullets.indexOf(bullet);
                if (bulletIndex !== -1) {
                    bulletsToRemove.push(bulletIndex);
                }
                
                // Create explosion at asteroid center
                createExplosion(asteroid.x, asteroid.y, null);

                // Add floating score text
                const points = 100;
                floatingTexts.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    text: points.toString(),
                    life: 1.0,
                    size: 24 + Math.random() * 10
                });

                // Screen shake on explosion
                triggerScreenShake(5, 10);

                // Split asteroid into smaller ones or remove it
                if (asteroid.radius > 15) {
                    // Split into two smaller asteroids
                    for (let k = 0; k < 2; k++) {
                        // Generate irregular asteroid shape for new asteroids
                        const sides = 8 + Math.floor(Math.random() * 4);
                        const vertices = [];
                        for (let v = 0; v < sides; v++) {
                            const angle = (v / sides) * Math.PI * 2;
                            const variance = 0.7 + Math.random() * 0.4;
                            vertices.push({
                                angle: angle,
                                distance: variance
                            });
                        }

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
                            color: '#f00',
                            vertices: vertices
                        };
                        asteroids.push(newAsteroid);
                    }
                }

                // Remove the original asteroid
                asteroids.splice(j, 1);

                // Increase score
                score += points;
                
                // Break out of inner loop since bullet is destroyed
                break;
            }
        }
    }

    // Remove bullets that collided - process in reverse order to avoid index shifting issues
    for (let i = bulletsToRemove.length - 1; i >= 0; i--) {
        bullets.splice(bulletsToRemove[i], 1);
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
                // Game over - set flag and break out
                gameRunning = false;
                // Use setTimeout to prevent blocking the game loop
                setTimeout(() => {
                    alert('Game Over! Final Score: ' + score);
                }, 0);
                break; // Break out of loop to prevent further processing
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

// Start the game
function startGame() {
    showTitleScreen = false;
    
    // Reset game state
    score = 0;
    lives = 3;
    gameRunning = true;
    
    // Reset ship
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.velocity.x = 0;
    ship.velocity.y = 0;
    ship.angle = -Math.PI / 2;
    ship.blinkTimer = 0;
    
    // Clear asteroids and bullets
    asteroids = [];
    bullets = [];
    
    // Create initial asteroids
    createAsteroids(5);
}

// Start the game when page loads
window.addEventListener('load', init);

// Initialize on load
init();