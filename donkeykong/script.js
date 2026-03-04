// Donkey Kong Game - Mestery Arcade

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game variables
let score = 0;
let lives = 3;
let gameRunning = true;

// Player object (Retro Arcade Style)
const player = {
    x: 50,
    y: 400,
    width: 28,
    height: 36,
    speed: 4,
    jumpForce: 18,
    velocityY: 0,
    isJumping: false,
    direction: 'right',
    color: '#ff1a1a' // Classic red
};

// Platforms (Retro Arcade Style with gradient and details)
const platforms = [
    { x: 0, y: 560, width: 800, height: 40, color: '#c0392b', topColor: '#e74c3c' }, // Ground
    { x: 80, y: 490, width: 250, height: 18, color: '#c0392b', topColor: '#e74c3c' },
    { x: 450, y: 420, width: 270, height: 18, color: '#c0392b', topColor: '#e74c3c' },
    { x: 50, y: 350, width: 240, height: 18, color: '#c0392b', topColor: '#e74c3c' },
    { x: 480, y: 280, width: 270, height: 18, color: '#c0392b', topColor: '#e74c3c' }
];

// Donkey Kong (enemy - improved graphics)
const donkeyKong = {
    x: 680,
    y: 110,
    width: 56,
    height: 48,
    color: '#8b4513', // Brown fur
    skinColor: '#deb887', // Skin
    animateFrame: 0,
    armDirection: 1
};

// Barrels (obstacles - improved graphics with stripes)
let barrels = [];

// Game functions
function drawPlayer() {
    const { x, y, width, height } = player;
    
    // Draw body with retro styling
    ctx.fillStyle = player.color;
    ctx.fillRect(x, y + 10, width, height - 10);
    
    // Draw head
    ctx.fillStyle = '#ffcc80'; // Skin tone
    ctx.fillRect(x + 4, y, width - 8, 10);
    
    // Draw overalls (blue retro color)
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(x + 4, y + 16, width - 8, height - 20);
    
    // Draw arms
    ctx.fillStyle = '#ffcc80';
    if (player.direction === 'right') {
        ctx.fillRect(x + width - 2, y + 14, 6, 8); // Right arm
        ctx.fillRect(x - 2, y + 14, 6, 8); // Left arm
    } else {
        ctx.fillRect(x - 2, y + 14, 6, 8); // Left arm
        ctx.fillRect(x + width - 2, y + 14, 6, 8); // Right arm
    }
    
    // Draw face details - eyes
    ctx.fillStyle = '#000';
    if (player.direction === 'right') {
        ctx.fillRect(x + width - 10, y + 3, 2, 4); // Right eye
        ctx.fillRect(x + width - 6, y + 3, 2, 4); // Left eye
    } else {
        ctx.fillRect(x + 6, y + 3, 2, 4); // Left eye
        ctx.fillRect(x + 10, y + 3, 2, 4); // Right eye
    }
    
    // Draw hat (red)
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x + 2, y - 2, width - 4, 3);
    
    // Simple shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 4, y + height - 2, width - 8, 2);
}

function drawPlatforms() {
    platforms.forEach(platform => {
        // Main platform body
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Top highlight for 3D effect
        ctx.fillStyle = platform.topColor;
        ctx.fillRect(platform.x, platform.y, platform.width, 6);
        
        // Platform border
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        
        // Add some "ladder rungs" pattern for texture
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 10; i < platform.width; i += 30) {
            ctx.fillRect(platform.x + i, platform.y + 8, 2, platform.height - 16);
        }
    });
}

function drawDonkeyKong() {
    const { x, y, width, height } = donkeyKong;
    
    // Animate arm movement
    if (Math.floor(Date.now() / 200) % 2 === 0) {
        donkeyKong.armDirection = -donkeyKong.armDirection;
    }
    
    // Draw body (brown fur)
    ctx.fillStyle = donkeyKong.color;
    ctx.fillRect(x + 10, y + 20, width - 20, height - 20);
    
    // Draw belly (lighter color)
    ctx.fillStyle = '#a1887f';
    ctx.fillRect(x + 20, y + 25, width - 40, height - 30);
    
    // Draw head
    ctx.fillStyle = donkeyKong.color;
    ctx.fillRect(x + 12, y, width - 24, 20);
    
    // Draw face
    ctx.fillStyle = donkeyKong.skinColor;
    ctx.fillRect(x + 16, y + 4, width - 32, 12);
    
    // Draw eyes (white with black pupils)
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 20, y + 6, 5, 5);
    ctx.fillRect(x + width - 25, y + 6, 5, 5);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 21, y + 7, 2, 3);
    ctx.fillRect(x + width - 24, y + 7, 2, 3);
    
    // Draw eyebrows
    ctx.fillStyle = '#4e342e';
    if (donkeyKong.animateFrame % 10 < 5) {
        ctx.fillRect(x + 22, y - 2, 8, 3);
    } else {
        ctx.fillRect(x + width - 30, y - 2, 8, 3);
    }
    
    // Draw arms swinging
    ctx.fillStyle = donkeyKong.color;
    const armOffset = 4 * Math.sin(Date.now() / 150);
    
    // Left arm
    ctx.save();
    ctx.translate(x + 12, y + 25);
    ctx.rotate(-Math.PI / 4 + armOffset * 0.1);
    ctx.fillRect(0, 0, 6, 20);
    ctx.restore();
    
    // Right arm
    ctx.save();
    ctx.translate(x + width - 12, y + 25);
    ctx.rotate(Math.PI / 4 + armOffset * 0.1);
    ctx.fillRect(0, 0, 6, 20);
    ctx.restore();
    
    // Draw fingers
    ctx.fillStyle = donkeyKong.skinColor;
    if (donkeyKong.armDirection > 0) {
        ctx.fillRect(x + width - 14, y + 23, 2, 6);
        ctx.fillRect(x + width - 8, y + 25, 2, 6);
    } else {
        ctx.fillRect(x + 10, y + 23, 2, 6);
        ctx.fillRect(x + 16, y + 25, 2, 6);
    }
    
    // Draw legs
    ctx.fillStyle = donkeyKong.color;
    ctx.fillRect(x + 18, y + height - 12, 6, 12);
    ctx.fillRect(x + width - 24, y + height - 12, 6, 12);
    
    // Draw feet
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(x + 16, y + height, 10, 4);
    ctx.fillRect(x + width - 26, y + height, 10, 4);
    
    // Add some fur texture
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x + 20, y + 30, 4, 10);
    ctx.fillRect(x + width - 28, y + 35, 4, 10);
}

function drawBarrels() {
    barrels.forEach((barrel, index) => {
        // Rotate barrel animation
        const rotation = (Date.now() / 50) * barrel.direction;
        
        ctx.save();
        ctx.translate(barrel.x, barrel.y);
        ctx.rotate(rotation);
        
        // Draw barrel body (brown wood)
        const grad = ctx.createLinearGradient(-barrel.radius, -barrel.radius, barrel.radius, barrel.radius);
        grad.addColorStop(0, '#8d6e63');
        grad.addColorStop(0.5, '#a1887f');
        grad.addColorStop(1, '#6d4c41');
        ctx.fillStyle = grad;
        ctx.fillRect(-barrel.radius, -barrel.radius / 2, barrel.radius * 2, barrel.radius);
        
        // Draw barrel hoops (metal)
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(-barrel.radius, -barrel.radius / 2 + 2, 4, barrel.radius - 4);
        ctx.fillRect(barrel.radius - 4, -barrel.radius / 2 + 2, 4, barrel.radius - 4);
        
        // Draw barrel middle hoop
        ctx.fillRect(-2, -barrel.radius / 2 + 4, 4, barrel.radius - 8);
        
        ctx.restore();
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

    //
    // Player vs Donkey Kong collision - must land on top to win
    if (player.x < donkeyKong.x + donkeyKong.width &&
        player.x + player.width > donkeyKong.x &&
        player.y < donkeyKong.y + donkeyKong.height &&
        player.y + player.height > donkeyKong.y) {

        // Only win if landing on top (player is falling and above the Donkey)
        const hitFromTop = player.y + player.height - donkeyKong.y <= 10 &&
                           player.velocityY > 0;

        if (hitFromTop) {
            // Player wins by reaching Donkey Kong
            score += 100;
            updateGameInfo();
            alert('You defeated Donkey Kong! Score: ' + score);
            // Reset game
            barrels = [];
            player.x = 50;
            player.y = 400;
        } else {
            // Hit from side/bottom - player dies
            lives--;
            updateGameInfo();
            if (lives <= 0) {
                gameRunning = false;
                alert('Game Over! Final Score: ' + score);
            }
        }
    }
}

function updateGameInfo() {
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
}

function gameLoop() {
    // Draw background gradient (retro arcade style)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#1a237e'); // Deep blue
    bgGradient.addColorStop(0.5, '#4a148c'); // Purple
    bgGradient.addColorStop(1, '#3e2723'); // Dark brown
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw decorative elements (clouds in background)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(100, 80, 25, 0, Math.PI * 2);
    ctx.arc(130, 85, 20, 0, Math.PI * 2);
    ctx.arc(160, 75, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(600, 120, 30, 0, Math.PI * 2);
    ctx.arc(640, 115, 25, 0, Math.PI * 2);
    ctx.arc(670, 125, 30, 0, Math.PI * 2);
    ctx.fill();

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

// Input state
let keys = {};

// Handle keyboard down events
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    keys[e.key] = true;
});

// Handle keyboard up events
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls state
let touchControls = {
    left: false,
    right: false,
    jump: false
};

// Setup touch button with proper iOS support
function setupTouchButton(btn, controlName) {
    if (!btn) return;

    let touchId = null; // Track specific touch for this button
    let isTouching = false;

    const handleStart = (e) => {
        // If this isn't a touch event, use mouse
        if (!e.changedTouches || e.changedTouches.length === 0) {
            // Mouse event - only process on non-touch devices
            if (!isTouchDevice) {
                e.preventDefault();
                btn.classList.add('active');
            }
            return;
        }

        // Touch event
        e.preventDefault();

        // Track specific touch point
        const touch = e.changedTouches[0];
        if (touchId === null) {
            touchId = touch.identifier;
            isTouching = true;
            touchControls[controlName] = true;
            btn.classList.add('active');
        }
    };

    const handleMove = (e) => {
        if (!isTouching || !e.changedTouches || e.changedTouches.length === 0) return;

        // Find our tracked touch
        const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
        if (!touch) return;

        e.preventDefault();

        const rect = btn.getBoundingClientRect();

        // Check if finger is still over the button
        const isOver = touch.clientX >= rect.left &&
                       touch.clientX <= rect.right &&
                       touch.clientY >= rect.top &&
                       touch.clientY <= rect.bottom;

        if (!isOver && isTouching) {
            // Finger moved off button
            touchControls[controlName] = false;
            btn.classList.remove('active');
        }
    };

    const handleEnd = (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) {
            // Mouse event
            if (!isTouchDevice) {
                e.preventDefault();
                touchControls[controlName] = false;
                btn.classList.remove('active');
            }
            return;
        }

        // Touch event - check if our tracked touch ended
        const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
        if (!touch) return;

        e.preventDefault();

        // Only reset if this is the same touch that started it
        touchControls[controlName] = false;
        btn.classList.remove('active');

        // Reset tracked touch
        if (touchId === touch.identifier) {
            touchId = null;
            isTouching = false;
        }
    };

    // Touch start
    btn.addEventListener('touchstart', handleStart, { passive: false });

    // Touch move on document to catch when finger moves outside button
    btn.addEventListener('touchmove', handleMove, { passive: false });

    // Touch end
    btn.addEventListener('touchend', handleEnd);

    // Touch cancel (e.g., finger slides off screen)
    btn.addEventListener('touchcancel', handleEnd);

    // Mouse events for desktop testing (only if not touch device)
    btn.addEventListener('mousedown', (e) => {
        // Prevent default only for non-touch devices to avoid issues
        if (!isTouchDevice) {
            e.preventDefault();
            handleStart(e);
        }
    });

    btn.addEventListener('mouseup', (e) => {
        if (!isTouchDevice) {
            e.preventDefault();
            handleEnd(e);
        }
    });

    btn.addEventListener('mouseleave', (e) => {
        if (!isTouchDevice) {
            e.preventDefault();
            touchControls[controlName] = false;
            btn.classList.remove('active');
        }
    });
}

// Setup mobile control buttons
setupTouchButton(document.getElementById('btn-left'), 'left');
setupTouchButton(document.getElementById('btn-right'), 'right');
setupTouchButton(document.getElementById('btn-jump'), 'jump');

// Track if this is a touch device
let isTouchDevice = false;

// Add touch listeners for detection (on document to catch early touches)
document.addEventListener('touchstart', () => {
    if (!isTouchDevice) {
        isTouchDevice = true;
    }
}, { passive: false, once: true });

document.addEventListener('touchmove', () => {
    if (!isTouchDevice) {
        isTouchDevice = true;
    }
}, { passive: false, once: true });

// Check for touch capability via window matchMedia for better detection
if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    isTouchDevice = true;
}

// Handle jump keys (separate handler for double jump)
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp':
            if (!player.isJumping) {
                player.velocityY = -player.jumpForce;
                player.isJumping = true;
            } else if (player.velocityY < 0) {
                // Double jump
                player.velocityY = -player.jumpForce * 0.8;
            }
            break;
        case ' ':
            if (!player.isJumping) {
                player.velocityY = -player.jumpForce;
                player.isJumping = true;
            } else if (player.velocityY < 0) {
                // Double jump
                player.velocityY = -player.jumpForce * 0.8;
            }
            break;
    }
});

// Handle jump keys for touch controls (immediate jump response)
function handleJump() {
    if (!gameRunning) return;
    
    if (!player.isJumping) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
    } else if (player.velocityY < 0) {
        // Double jump
        player.velocityY = -player.jumpForce * 0.8;
    }
}

// Handle movement in game loop - single unified updatePlayer function
function updatePlayer() {
    // Handle continuous key presses for smooth movement
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
    }

    // Handle touch controls (override keyboard if active)
    if (touchControls.left) {
        player.x -= player.speed;
    }
    if (touchControls.right) {
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

    // Check if player is no longer standing on a platform (when moving horizontally)
    if (!onPlatform && player.isJumping === false) {
        // Player has moved past the platform edge, should start falling
        let isOnPlatform = false;
        platforms.forEach(platform => {
            if (player.x + player.width > platform.x &&
                player.x < platform.x + platform.width &&
                player.y + player.height >= platform.y &&
                player.y + player.height <= platform.y + 10) {
                isOnPlatform = true;
            }
        });

        // If not on a platform, start falling
        if (!isOnPlatform) {
            player.isJumping = true;
        }
    }

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
