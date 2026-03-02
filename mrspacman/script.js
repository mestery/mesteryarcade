// Mr. PacMan Game Implementation with Maze and Collision Detection
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Game variables
let score = 0;
let lives = 3;
let gameRunning = true;

// Power-up orb properties
const POWER_ORB_RADIUS = 8;
const POWER_UP_DURATION = 5000; // 5 seconds in milliseconds
let powerOrbs = [];
let powerModeActive = false;
let powerModeEndTime = 0;

// Define maze layout (1 = wall, 0 = path)
const mazeLayout = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Maze dimensions
const cellSize = 30;
const rows = mazeLayout.length;
const cols = mazeLayout[0].length;

// PacMan properties
const pacman = {
    x: 50,
    y: 50,
    radius: 12,
    speed: 3,
    direction: 'right',
    flashColor: false // Used when eating ghost in power mode
};

// Ghosts array
const ghosts = [
    { x: 200, y: 150, radius: 12, speed: 2, color: '#FF0000', direction: 'left', eaten: false },
    { x: 350, y: 200, radius: 12, speed: 2, color: '#00FFFF', direction: 'up', eaten: false },
    { x: 150, y: 300, radius: 12, speed: 2, color: '#FF00FF', direction: 'down', eaten: false },
    { x: 450, y: 300, radius: 12, speed: 2, color: '#FFFF00', direction: 'right', eaten: false }
];

// Track if ghost is vulnerable (blinking)
function isGhostVulnerable(ghost) {
    return powerModeActive && !ghost.eaten;
}

function isGhostEaten(ghost) {
    return ghost.eaten;
}

// Food array
const food = [];

// Power-up orbs are placed in the maze corners and key positions
function createPowerOrbs() {
    powerOrbs = [];
    
    // Place orbs in corners and strategic locations
    const orbPositions = [
        { col: 1, row: 1 },
        { col: 18, row: 1 },
        { col: 1, row: 14 },
        { col: 18, row: 14 }
    ];
    
    orbPositions.forEach(pos => {
        powerOrbs.push({
            x: pos.col * cellSize + cellSize / 2,
            y: pos.row * cellSize + cellSize / 2,
            radius: POWER_ORB_RADIUS,
            pulsePhase: Math.random() * Math.PI * 2
        });
    });
}

// Create food dots based on maze paths
function createFood() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Only place food in paths (not walls)
            if (mazeLayout[row][col] === 0) {
                // Place food at center of cell
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;

                // Make sure food is not placed on Pacman's starting position
                const pacmanStartX = 50;
                const pacmanStartY = 50;

                // Check if this position is where a power orb is placed
                let hasPowerOrb = false;
                for (let i = 0; i < powerOrbs.length; i++) {
                    const orb = powerOrbs[i];
                    if (Math.abs(x - orb.x) < 5 && Math.abs(y - orb.y) < 5) {
                        hasPowerOrb = true;
                        break;
                    }
                }

                if (Math.abs(x - pacmanStartX) > 20 || Math.abs(y - pacmanStartY) > 20) {
                    if (!hasPowerOrb) {
                        food.push({
                            x: x,
                            y: y,
                            radius: 4
                        });
                    }
                }
            }
        }
    }
}

// Draw maze walls
function drawMaze() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (mazeLayout[row][col] === 1) {
                // Draw wall
                ctx.fillStyle = '#0033FF';
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                
                // Draw wall details
                ctx.strokeStyle = '#0066FF';
                ctx.lineWidth = 2;
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }
}

// Draw PacMan
function drawPacman() {
    ctx.beginPath();
    ctx.arc(pacman.x, pacman.y, pacman.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.closePath();

    // Draw mouth
    ctx.beginPath();
    let startAngle, endAngle;
    switch(pacman.direction) {
        case 'right':
            startAngle = 0.2 * Math.PI;
            endAngle = 1.8 * Math.PI;
            break;
        case 'left':
            startAngle = 1.2 * Math.PI;
            endAngle = 0.8 * Math.PI;
            break;
        case 'up':
            startAngle = 1.7 * Math.PI;
            endAngle = 1.3 * Math.PI;
            break;
        case 'down':
            startAngle = 0.7 * Math.PI;
            endAngle = 0.3 * Math.PI;
            break;
    }
    ctx.arc(pacman.x, pacman.y, pacman.radius, startAngle, endAngle);
    ctx.lineTo(pacman.x, pacman.y);
    ctx.fillStyle = '#000';
    ctx.fill();
}

// Draw ghosts
function drawGhosts() {
    ghosts.forEach(ghost => {
        // Determine ghost color based on state
        let drawColor;
        
        if (isGhostEaten(ghost)) {
            // Eaten ghost - just show eyes (invisible body)
            drawColor = 'transparent';
        } else if (isGhostVulnerable(ghost)) {
            // Vulnerable/Scared ghost - blink blue/purple
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                drawColor = '#0000FF'; // Blue
            } else {
                drawColor = '#8A2BE2'; // Purple
            }
        } else {
            // Normal ghost color
            drawColor = ghost.color;
        }
        
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, ghost.radius, 0, Math.PI * 2);
        ctx.fillStyle = drawColor;
        ctx.fill();
        ctx.closePath();

        // Ghost eyes
        ctx.beginPath();
        ctx.arc(ghost.x - 4, ghost.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(ghost.x + 4, ghost.y - 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.closePath();

        // Ghost pupils
        ctx.beginPath();
        ctx.arc(ghost.x - 4, ghost.y - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(ghost.x + 4, ghost.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.closePath();
    });
}

// Draw food
function drawFood() {
    food.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.closePath();
    });
}

// Draw power-up orbs (glowing blue/orange orbs)
let frameCount = 0;
function drawPowerOrbs() {
    frameCount++;
    
    powerOrbs.forEach(orb => {
        // Calculate pulsing effect
        const pulse = Math.sin(frameCount * 0.1 + orb.pulsePhase) * 2;
        const currentRadius = orb.radius + pulse;
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius + 4, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(orb.x, orb.y, currentRadius, orb.x, orb.y, currentRadius + 8);
        glowGradient.addColorStop(0, 'rgba(137, 204, 255, 0.6)'); // Blue glow
        glowGradient.addColorStop(1, 'rgba(137, 204, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();
        ctx.closePath();
        
        // Inner circle
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#89CCFF'; // Light blue
        ctx.fill();
        
        // Outer ring
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    });
}

// Check if position is valid (not a wall)
function isValidPosition(x, y) {
    // Convert to grid coordinates
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    // Check bounds
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
        return false;
    }
    
    // Check if it's a wall
    return mazeLayout[row][col] === 0;
}

// Move PacMan with collision detection
function movePacman() {
    // Save current position
    const oldX = pacman.x;
    const oldY = pacman.y;
    
    // Move in current direction
    switch(pacman.direction) {
        case 'up':
            pacman.y -= pacman.speed;
            break;
        case 'down':
            pacman.y += pacman.speed;
            break;
        case 'left':
            pacman.x -= pacman.speed;
            break;
        case 'right':
            pacman.x += pacman.speed;
            break;
    }

    // Check for collisions with walls
    if (!isValidPosition(pacman.x, pacman.y)) {
        // If collision occurs, revert to previous position
        pacman.x = oldX;
        pacman.y = oldY;
    }

    // Wrap around the screen (but keep within maze bounds)
    if (pacman.x < pacman.radius) {
        pacman.x = canvas.width - pacman.radius;
    } else if (pacman.x > canvas.width - pacman.radius) {
        pacman.x = pacman.radius;
    }

    if (pacman.y < pacman.radius) {
        pacman.y = canvas.height - pacman.radius;
    } else if (pacman.y > canvas.height - pacman.radius) {
        pacman.y = pacman.radius;
    }
}

// Move ghosts with collision detection
function moveGhosts() {
    ghosts.forEach(ghost => {
        // Determine ghost speed based on state
        let currentSpeed = ghost.speed;
        
        if (isGhostEaten(ghost)) {
            // Eaten ghosts move faster back to their respawn point
            currentSpeed = ghost.speed * 1.5;
        } else if (isGhostVulnerable(ghost)) {
            // Vulnerable ghosts move slower
            currentSpeed = ghost.speed * 0.5;
        }
        
        // Simple AI: random movement with some direction changes
        if (Math.random() < 0.02 && !isGhostEaten(ghost)) {
            const directions = ['up', 'down', 'left', 'right'];
            ghost.direction = directions[Math.floor(Math.random() * directions.length)];
        }
        
        // If eaten, move toward center spawn point
        if (isGhostEaten(ghost)) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2 + cellSize; // Slightly below center
            
            if (Math.abs(ghost.x - centerX) > 5 || Math.abs(ghost.y - centerY) > 5) {
                if (ghost.x < centerX) ghost.x += currentSpeed;
                else if (ghost.x > centerX) ghost.x -= currentSpeed;
                
                if (ghost.y < centerY) ghost.y += currentSpeed;
                else if (ghost.y > centerY) ghost.y -= currentSpeed;
            } else {
                // Respawn at original position
                if (ghost.color === '#FF0000') { ghost.x = 200; ghost.y = 150; }
                else if (ghost.color === '#00FFFF') { ghost.x = 350; ghost.y = 200; }
                else if (ghost.color === '#FF00FF') { ghost.x = 150; ghost.y = 300; }
                else if (ghost.color === '#FFFF00') { ghost.x = 450; ghost.y = 300; }
                
                ghost.eaten = false;
            }
            
            // Continue to next ghost
            return;
        }

        // Save current position
        const oldX = ghost.x;
        const oldY = ghost.y;

        // Move in current direction
        switch(ghost.direction) {
            case 'up':
                ghost.y -= currentSpeed;
                break;
            case 'down':
                ghost.y += currentSpeed;
                break;
            case 'left':
                ghost.x -= currentSpeed;
                break;
            case 'right':
                ghost.x += currentSpeed;
                break;
        }

        // Check for collisions with walls
        if (!isValidPosition(ghost.x, ghost.y)) {
            // If collision occurs, revert to previous position and change direction
            ghost.x = oldX;
            ghost.y = oldY;

            // Change direction randomly
            const directions = ['up', 'down', 'left', 'right'];
            ghost.direction = directions[Math.floor(Math.random() * directions.length)];
        }

        // Wrap around the screen (but keep within maze bounds)
        if (ghost.x < ghost.radius) {
            ghost.x = canvas.width - ghost.radius;
        } else if (ghost.x > canvas.width - ghost.radius) {
            ghost.x = ghost.radius;
        }

        if (ghost.y < ghost.radius) {
            ghost.y = canvas.height - ghost.radius;
        } else if (ghost.y > canvas.height - ghost.radius) {
            ghost.y = ghost.radius;
        }
    });
}

// Check collisions
function checkCollisions() {
    // Check power orb collection
    for (let i = powerOrbs.length - 1; i >= 0; i--) {
        const orb = powerOrbs[i];
        const dx = pacman.x - orb.x;
        const dy = pacman.y - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < pacman.radius + orb.radius) {
            powerOrbs.splice(i, 1);
            
            // Activate power mode
            const now = Date.now();
            if (!powerModeActive || now > powerModeEndTime) {
                powerModeActive = true;
                powerModeEndTime = now + POWER_UP_DURATION;
                
                // Decrease speed of vulnerable ghosts
                ghosts.forEach(g => {
                    if (!g.eaten) g.wasEatenDuringPower = false;
                });
            }
            
            // Replenish the orb for continuous gameplay (respawn after delay)
            setTimeout(() => {
                if (!powerOrbs.some(o => o.x === orb.x && o.y === orb.y)) {
                    powerOrbs.push({
                        x: orb.x,
                        y: orb.y,
                        radius: POWER_ORB_RADIUS,
                        pulsePhase: Math.random() * Math.PI * 2
                    });
                }
            }, 10000); // Respawn after 10 seconds
        }
    }

    // Check food collection
    for (let i = food.length - 1; i >= 0; i--) {
        const dot = food[i];
        const dx = pacman.x - dot.x;
        const dy = pacman.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < pacman.radius + dot.radius) {
            food.splice(i, 1);
            score += 10;
            scoreElement.textContent = score;
        }
    }

    // Check ghost collisions
    const now = Date.now();
    
    ghosts.forEach(ghost => {
        const dx = pacman.x - ghost.x;
        const dy = pacman.y - ghost.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < pacman.radius + ghost.radius) {
            if (isGhostEaten(ghost)) {
                // Already eaten, do nothing
            } else if (isGhostVulnerable(ghost)) {
                // Eat the ghost!
                ghost.eaten = true;
                
                // Ghost respawns after 4 seconds
                setTimeout(() => {
                    if (ghost.eaten) {
                        // Move to center spawn point
                        const centerX = canvas.width / 2;
                        const centerY = canvas.height / 2 + cellSize;
                        
                        if (ghost.color === '#FF0000') { ghost.x = 200; ghost.y = 150; }
                        else if (ghost.color === '#00FFFF') { ghost.x = 350; ghost.y = 200; }
                        else if (ghost.color === '#FF00FF') { ghost.x = 150; ghost.y = 300; }
                        else if (ghost.color === '#FFFF00') { ghost.x = 450; ghost.y = 300; }
                        
                        ghost.eaten = false;
                    }
                }, 4000); // Ghost respawns after 4 seconds
                
                score += 200;
                scoreElement.textContent = score;
            } else {
                // Normal collision - lose life
                lives--;
                livesElement.textContent = lives;

                // Reset Pacman position to starting point
                pacman.x = 50;
                pacman.y = 50;

                // Reset power mode so ghosts stop blinking
                powerModeActive = false;

                if (lives <= 0) {
                    gameOver();
                }
            }
        }
    });

    // Check if power mode has ended
    if (powerModeActive && now > powerModeEndTime) {
        powerModeActive = false;
    }
}

// Game over function
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// Restart game function
function restartGame() {
    // Reset game state
    score = 0;
    lives = 3;
    gameRunning = true;

    // Reset Pacman
    pacman.x = 50;
    pacman.y = 50;

    // Reset ghosts
    ghosts[0].x = 200; ghosts[0].y = 150;
    ghosts[1].x = 350; ghosts[1].y = 200;
    ghosts[2].x = 150; ghosts[2].y = 300;
    ghosts[3].x = 450; ghosts[3].y = 300;
    
    // Reset ghost eaten state
    ghosts.forEach(g => g.eaten = false);

    // Reset power mode
    powerModeActive = false;
    powerOrbs.length = 0;
    
    // Create power orbs
    createPowerOrbs();

    // Reset UI
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    gameOverElement.style.display = 'none';

    // Recreate food
    food.length = 0;
    createFood();
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw game elements
    drawMaze();
    drawFood();
    drawPowerOrbs();
    drawPacman();
    drawGhosts();

    // Show power mode indicator
    if (powerModeActive) {
        ctx.save();
        const now = Date.now();
        const timeLeft = Math.max(0, powerModeEndTime - now);
        const secondsLeft = (timeLeft / 1000).toFixed(1);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        
        // Draw warning if time is running out
        if (timeLeft < 2000) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 5;
        }
        
        ctx.fillText('POWER MODE: ' + secondsLeft + 's', canvas.width / 2, 30);
        
        // Draw glowing effect
        const pulse = Math.sin(now * 0.01) * 3;
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.strokeRect(10 + pulse, 25 + pulse, canvas.width - 20 - 2*pulse, canvas.height - 25 - 10);
        
        ctx.restore();
    }

    // Update game state
    movePacman();
    moveGhosts();
    checkCollisions();

    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
            pacman.direction = 'up';
            break;
        case 'ArrowDown':
            pacman.direction = 'down';
            break;
        case 'ArrowLeft':
            pacman.direction = 'left';
            break;
        case 'ArrowRight':
            pacman.direction = 'right';
            break;
    }
});

// Initialize game
createFood();
createPowerOrbs();
gameLoop();

// Prevent arrow keys from scrolling the page
window.addEventListener('keydown', function(e) {
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key) > -1) {
        e.preventDefault();
    }
}, false);