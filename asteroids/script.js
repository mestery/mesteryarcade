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
for (let i = 0; i < 6; i++) { // Reduced from 12 to 6
    nebulas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 150 + Math.random() * 200,
        hsl: [Math.floor(Math.random() * 360), 80, 15 + Math.random() * 20],
        opacity: 0.04 + Math.random() * 0.08,
        rotationSpeed: (Math.random() - 0.5) * 0.003,
        rotation: Math.random() * Math.PI,
        pulseSpeed: 0.5 + Math.random() * 1.5
    });
}

// Enhanced starfield with parallax effect and colored stars
let stars = [];
for (let i = 0; i < 120; i++) { // Reduced from 250 to 120
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5,
        brightness: Math.random(),
        twinkleSpeed: 0.03 + Math.random() * 0.05,
        hue: Math.floor(Math.random() * 60 + 180), // Cyan to violet range
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

        // Calculate and store asteroid colors for performance
        updateAsteroidColors(asteroid);

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
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
    } else {
        ctx.shadowBlur = 15;
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
    bodyGradient.addColorStop(0.5, '#001f3f');
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

    // Draw thrust if active - simplified
    if (ship.thrusting) {
        const flicker = Math.sin(Date.now() / 12) * 0.4 + 0.6;
        ctx.shadowBlur = 20 * flicker;
        ctx.shadowColor = '#ff3300';

        const flameLength = ship.radius * 1.5;
        const flameWidth = ship.radius * 0.5;

        // Simplified flame
        const flameGradient = ctx.createLinearGradient(0, ship.radius, 0, ship.radius + flameLength);
        flameGradient.addColorStop(0, '#ff4400');
        flameGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.moveTo(-ship.radius * 0.7, ship.radius);
        ctx.quadraticCurveTo(0, ship.radius + flameLength, ship.radius * 0.7, ship.radius);
        ctx.closePath();
        ctx.fill();

        // Simplified sparks
        if (Math.random() > 0.5) {
            const sparkX = (Math.random() - 0.5) * flameWidth;
            const sparkY = ship.radius + flameLength + Math.random() * 20;
            
            ctx.fillStyle = `rgba(255, 120, 180, ${0.5 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    } else {
        // Idle glow when not thrusting
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
    }

    // Add engine vents on sides
    ctx.fillStyle = 'rgba(170, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-ship.radius * 0.5, ship.radius * 0.3, 2, 0, Math.PI * 2);
    ctx.arc(ship.radius * 0.5, ship.radius * 0.3, 2, 0, Math.PI * 2);
    ctx.fill();

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

// Pre-computed values for asteroid colors (stored per asteroid to avoid recalculation)
function updateAsteroidColors(asteroid) {
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

    asteroid.hue = asteroidHue;
    asteroid.saturation = saturation;
    asteroid.lightness = lightness;
}

// Draw asteroids with enhanced graphics
function drawAsteroids() {
    asteroids.forEach(asteroid => {
        // Update colors if not already set (for newly created asteroids)
        if (!asteroid.hue) {
            updateAsteroidColors(asteroid);
        }

        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);

        const { hue: asteroidHue, saturation, lightness } = asteroid;
        const mainColor = `hsl(${asteroidHue}, ${saturation}%, ${lightness}%)`;

        // Simplified asteroid rendering
        const pulse = Math.sin(Date.now() / 400) * 5 + 10;
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10 + pulse;
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

        // Simplified gradient fill
        const gradient = ctx.createRadialGradient(-asteroid.radius * 0.35, -asteroid.radius * 0.35, asteroid.radius * 0.15, 0, 0, asteroid.radius);
        gradient.addColorStop(0, `hsl(${asteroidHue}, ${saturation}%, ${lightness + 20}%)`);
        gradient.addColorStop(1, `hsl(${asteroidHue}, ${saturation}%, ${Math.max(5, lightness - 30)}%)`);

        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw crater details - simplified
        const craterCount = Math.floor(asteroid.radius / 12);

        for (let i = 0; i < craterCount; i++) {
            const craterX = Math.cos(i * 2.5 + asteroid.rotation) * (asteroid.radius * 0.45);
            const craterY = Math.sin(i * 2.5 + asteroid.rotation) * (asteroid.radius * 0.45);
            const craterRadius = asteroid.radius * (0.08 + Math.random() * 0.15);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2);
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
        // Simplified bullet rendering
        const angle = Math.atan2(bullet.velocity.y, bullet.velocity.x);

        ctx.shadowBlur = 10;
    ctx.shadowColor = bullet.color || '#0ff';
    ctx.fillStyle = bullet.color || '#0ff';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Simple trail
    if (Math.random() > 0.7) {
        ctx.shadowBlur = 5;
        ctx.fillStyle = `rgba(0, 255, 255, 0.3)`;
        ctx.beginPath();
        ctx.arc(bullet.x - Math.cos(angle) * 10, bullet.y - Math.sin(angle) * 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.shadowBlur = 0;
    });
}

// Create explosion particles - optimized for performance
function createExplosion(x, y, color) {
    const debrisCount = 12; // Reduced
    for (let i = 0; i < debrisCount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: color || Math.floor(Math.random() * 60),
            size: 2 + Math.random() * 2,
            type: 'debris',
            decay: 0.96
        });
    }

    const sparkCount = 8; // Reduced
    for (let i = 0; i < sparkCount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 1.0,
            color: 180 + Math.random() * 120,
            size: 1 + Math.random() * 2,
            type: 'spark'
        });
    }

    const fireCount = 10; // Reduced
    for (let i = 0; i < fireCount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1.0,
            color: 15 + Math.random() * 30,
            size: 2 + Math.random() * 3,
            type: 'fire'
        });
    }

    particles.push({
        x: x,
        y: y,
        radius: 5,
        maxRadius: Math.max(canvas.width, canvas.height) * 0.25,
        life: 1.0,
        color: 30,
        type: 'shockwave'
    });

    const burstCount = 4; // Reduced
    for (let i = 0; i < burstCount; i++) {
        const angle = (i / burstCount) * Math.PI * 2;
        const speed = 6 + Math.random() * 4;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: Math.floor(Math.random() * 60),
            size: 1 + Math.random() * 1.5,
            type: 'burst',
            decay: 0.94
        });
    }
}

// Draw particles - optimized for performance
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
        // Simplified debris - reduced complexity
        const size = particle.size * particle.life;

        ctx.fillStyle = `hsl(${particle.color}, 80%, ${70 * particle.life}%)`;
        ctx.shadowBlur = 5 * particle.life;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();

        } else if (particle.type === 'spark') {
            ctx.fillStyle = `hsl(${particle.color}, 100%, 75%)`;
            ctx.shadowBlur = 5 * particle.life;

            const size = particle.size * particle.life;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();

        } else if (particle.type === 'fire') {
            const size = particle.size * (1.5 - particle.life);
            ctx.fillStyle = `hsl(${particle.color}, 90%, ${60 + particle.life * 30}%)`;
            ctx.shadowBlur = 10 * particle.life;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();

        } else if (particle.type === 'shockwave') {
            particle.radius += 6 * particle.life;
            if (!isFinite(particle.x) || !isFinite(particle.y) || !isFinite(particle.radius)) {
                particles.splice(i, 1);
                continue;
            }
            ctx.strokeStyle = `hsl(${particle.color}, 100%, ${50 + particle.life * 30}%)`;
            ctx.lineWidth = 2 * particle.life;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.stroke();

        } else if (particle.type === 'burst') {
            ctx.fillStyle = `hsl(${particle.color}, 90%, ${70 + particle.life * 25}%)`;
            ctx.shadowBlur = 5 * particle.life;
            const size = particle.size * particle.life;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
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

    // Draw nebulas (pre-computed HSL values to avoid string parsing)
    nebulas.forEach(nebula => {
        nebula.rotation += nebula.rotationSpeed;

        // Pulsing opacity for dramatic effect - cached
        const pulse = Math.sin(Date.now() / (2000 + nebula.pulseSpeed * 1000)) * 0.02 + nebula.opacity;

        ctx.save();
        ctx.translate(nebula.x, nebula.y);
        ctx.rotate(nebula.rotation);

        // Create gradient with pre-computed HSL values (no string parsing)
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, nebula.size);
        const [hue, sat, light] = nebula.hsl;

        gradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${pulse * 1.5})`);
        gradient.addColorStop(0.5, `hsla(${hue}, ${sat}%, ${light}%, ${pulse})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 30 * pulse;
        ctx.shadowColor = `hsla(${hue}, ${sat}%, ${light}%, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, nebula.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    // Draw stars with simplified rendering
    stars.forEach(star => {
        star.brightness += star.twinkleSpeed;
        if (star.brightness > 1 || star.brightness < 0.2) {
            star.twinkleSpeed = -star.twinkleSpeed;
        }

        const alpha = 0.3 + star.brightness;

        // Simple color calculation (no HSL parsing needed)
        const hue = star.hue + (Math.random() * 40 - 20);

    // Simplified star rendering - reduce shadowBlur and gradient complexity
    const hue = star.hue; // Use precomputed hue

    // Draw simple star (reduced gradient complexity)
    const twinkleSize = star.size * (0.5 + 0.5 * Math.sin(Date.now() / (100 + star.size * 20)));
    const glowRadius = star.size * 3;

    // Simplified gradient for glow
    ctx.shadowBlur = 8; // Reduced from star.size * 5

    const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowRadius);
    glowGradient.addColorStop(0, `hsla(${hue}, 80%, 80%, ${alpha})`);
    glowGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw star core (simplified)
    const coreAlpha = alpha * (0.7 + 0.3 * Math.sin(Date.now() / (150 + star.size * 25)));
    ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
    ctx.shadowBlur = 0;

    const finalSize = twinkleSize * (0.5 + 0.3 * Math.sin(Date.now() / (180 + star.size * 20)));
    ctx.beginPath();
    ctx.arc(star.x, star.y, finalSize, 0, Math.PI * 2);
    ctx.fill();

    // Only draw cross for very bright stars (reduce draws)
    if (star.size > 2.5) {
        ctx.strokeStyle = `hsla(${hue}, 80%, 75%, ${alpha})`;
        ctx.lineWidth = star.size * 0.6;

        const crossSize = star.size * 2;
        ctx.beginPath();
        ctx.moveTo(star.x - crossSize, star.y);
        ctx.lineTo(star.x + crossSize, star.y);
        ctx.moveTo(star.x, star.y - crossSize);
        ctx.lineTo(star.x, star.y + crossSize);
        ctx.stroke();
    }
    });

    // Draw score popups
    drawFloatingTexts();
}

    // Draw floating score text on asteroid explosions
    function drawFloatingTexts() {
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const text = floatingTexts[i];

            text.y -= 1;
            text.life -= 0.02;

            if (text.life <= 0) {
                floatingTexts.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = text.life;
            ctx.fillStyle = '#ffff00';
            ctx.font = `900 ${text.size}px 'Courier New', monospace`;
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 5;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+' + text.text, text.x, text.y);
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
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 3);
        ctx.fillText(titleText, 0, 0);
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
                        // Calculate and store asteroid colors for performance
                        updateAsteroidColors(newAsteroid);
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