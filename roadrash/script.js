// Road Rash Game - Mestery Arcade

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game constants
const ROAD_X = 100;
const ROAD_WIDTH = 400;
const LANE_WIDTH = ROAD_WIDTH / 3;

// Game state
let score = 0;
let speed = 25;
let gameRunning = true;
let frameCount = 0;

// Player bike
const player = {
    x: ROAD_X + ROAD_WIDTH / 2,
    y: canvas.height - 100,
    width: 36,
    height: 48,
    color: '#ff3300', // Red bike
    lane: 1, // 0 = left, 1 = center, 2 = right
    leaning: 0,
    isJumping: false,
    jumpHeight: 0,
    maxSpeed: 60
};

// Road elements
let obstacles = [];
let trees = [];
let rocks = [];

// Input state
const keys = {};

// Game functions

function drawRoad() {
    // Asphalt background
    const gradient = ctx.createLinearGradient(ROAD_X, 0, ROAD_X + ROAD_WIDTH, 0);
    gradient.addColorStop(0, '#2a3b4c');
    gradient.addColorStop(1, '#1a2b3c');
    ctx.fillStyle = gradient;
    ctx.fillRect(ROAD_X, 0, ROAD_WIDTH, canvas.height);

    // Road borders (red and white stripes)
    const stripeHeight = 40;
    const offset = (frameCount * speed / 5) % (stripeHeight * 2);

    // Left border
    for (let y = -offset; y < canvas.height; y += stripeHeight * 2) {
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(ROAD_X - 15, y + offset, 15, stripeHeight);
    }

    // Right border
    for (let y = -offset; y < canvas.height; y += stripeHeight * 2) {
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(ROAD_X + ROAD_WIDTH, y + offset, 15, stripeHeight);
    }

    // Lane markers
    ctx.fillStyle = '#ffffff';
    for (let lane = 1; lane < 3; lane++) {
        const laneX = ROAD_X + LANE_WIDTH * lane;
        for (let y = -offset; y < canvas.height; y += 80) {
            ctx.fillRect(laneX - 2, y + (offset % 40), 4, 30);
        }
    }

    // Side gravel
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(0, 0, ROAD_X - 15, canvas.height);
    ctx.fillRect(ROAD_X + ROAD_WIDTH + 15, 0, canvas.width - (ROAD_X + ROAD_WIDTH + 15), canvas.height);
}

function drawTree(tree) {
    // Trunk
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(tree.x - 8, tree.y, 16, 30);

    // Leaves (pine tree style)
    ctx.fillStyle = '#2e7d32';
    for (let i = 0; i < 5; i++) {
        const width = 30 - i * 6;
        ctx.fillRect(tree.x - width / 2, tree.y + 10 + i * 6, width, 8);
    }

    // Highlights
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(tree.x - width / 2, tree.y + 10, width, 4);
}

function drawRock(rock) {
    const x = rock.x;
    const y = rock.y;
    
    ctx.fillStyle = '#757575';
    ctx.beginPath();
    ctx.moveTo(x - 15, y + 20);
    ctx.lineTo(x - 5, y + 5);
    ctx.lineTo(x + 10, y + 10);
    ctx.lineTo(x + 18, y + 25);
    ctx.lineTo(x, y + 30);
    ctx.closePath();
    ctx.fill();

    // Rock texture
    ctx.fillStyle = '#9e9e9e';
    ctx.beginPath();
    ctx.arc(x - 5, y + 22, 4, 0, Math.PI * 2);
    ctx.arc(x + 5, y + 28, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawBike(bike) {
    const x = bike.x;
    const y = bike.y + (bike.jumpHeight || 0);

    // Bike body
    ctx.fillStyle = '#333';
    
    // Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(x - 20, y + 35, 40, 8); // Rear wheel
    ctx.fillRect(x - 18, y + 37, 36, 4); // Rear wheel detail
    
    ctx.fillRect(x - 20, y + 5, 40, 8); // Front wheel
    ctx.fillRect(x - 18, y + 7, 36, 4); // Front wheel detail

    // Wheel spokes
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    
    // Rear wheel spokes
    const rearAngle = (frameCount * speed / 50) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 39);
    ctx.lineTo(x + 20, y + 39);
    ctx.moveTo(x, y + 19);
    ctx.lineTo(x, y + 59);
    ctx.strokeStyle = '#aaa';
    ctx.stroke();

    // Front wheel spokes
    const frontAngle = (frameCount * speed / 50) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 7);
    ctx.lineTo(x + 20, y + 7);
    ctx.moveTo(x, y - 13);
    ctx.lineTo(x, y + 27);
    ctx.stroke();

    // Frame
    ctx.strokeStyle = bike.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 15, y + 20);
    ctx.lineTo(x - 10, y + 35);
    ctx.lineTo(x + 10, y + 35);
    ctx.lineTo(x + 20, y + 15);
    ctx.lineTo(x, y + 5);
    ctx.closePath();
    ctx.stroke();

    // Handlebars
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 15, y + 8);
    ctx.lineTo(x + 15, y + 8);
    ctx.stroke();

    // Rider
    ctx.strokeStyle = '#ffcc00'; // Yellow racing suit
    ctx.lineWidth = 4;
    
    // Head (helmet)
    ctx.fillStyle = '#ff3300'; // Red helmet
    ctx.beginPath();
    ctx.arc(x, y + 2, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Visor
    ctx.fillStyle = '#33ccff';
    ctx.fillRect(x, y - 2, 8, 5);

    // Body
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x - 5, y + 25);
    ctx.lineTo(x + 10, y + 35);
    ctx.stroke();

    // Arms on handlebars
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x - 8, y + 6);
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 8, y + 6);
    ctx.stroke();

    // Legs on pedals
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 28);
    ctx.lineTo(x - 10, y + 45);
    ctx.moveTo(x + 10, y + 38);
    ctx.lineTo(x + 5, y + 45);
    ctx.stroke();

    // Lean effect based on steering
    if (bike.leaning !== 0) {
        ctx.save();
        ctx.translate(x, y + 25);
        ctx.rotate(bike.leaning * 0.1);
        ctx.translate(-x, -(y + 25));
    }
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const obstacleX = ROAD_X + LANE_WIDTH * lane + LANE_WIDTH / 2;

    obstacles.push({
        x: obstacleX,
        y: -100,
        width: 36,
        height: 48,
        type: 'car',
        speedOffset: Math.random() * 2 - 1
    });
}

function spawnRock() {
    const lane = Math.floor(Math.random() * 3);
    const rockX = ROAD_X + LANE_WIDTH * lane + LANE_WIDTH / 2;

    rocks.push({
        x: rockX,
        y: -100,
        width: 20,
        height: 15
    });
}

function spawnTree() {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    let treeX;
    
    if (side === 'left') {
        treeX = Math.random() * (ROAD_X - 40);
    } else {
        treeX = ROAD_X + ROAD_WIDTH + Math.random() * (canvas.width - ROAD_X - ROAD_WIDTH - 40);
    }
    
    trees.push({
        x: treeX,
        y: -100
    });
}

function updatePlayer() {
    // Lane switching with smooth transition
    if (keys['ArrowLeft'] && player.lane > 0) {
        player.leaning = -1;
        if (frameCount % 5 === 0) {
            player.lane--;
        }
    } else if (keys['ArrowRight'] && player.lane < 2) {
        player.leaning = 1;
        if (frameCount % 5 === 0) {
            player.lane++;
        }
    } else {
        player.leaning = 0;
    }

    // Calculate target X position based on lane
    const laneCenter = ROAD_X + LANE_WIDTH * player.lane + LANE_WIDTH / 2;
    const dx = laneCenter - player.x;
    
    if (Math.abs(dx) > 1) {
        player.x += dx * 0.2;
    } else {
        player.x = laneCenter;
    }

    // Jump
    if (keys[' '] && !player.isJumping) {
        player.isJumping = true;
        player.jumpHeight = 15;
    }

    // Handle jump physics
    if (player.isJumping) {
        player.jumpHeight -= 2;
        if (player.jumpHeight <= 0) {
            player.jumpHeight = 0;
            player.isJumping = false;
        }
    }

    // Keep player on road
    if (player.x < ROAD_X + 20) player.x = ROAD_X + 20;
    if (player.x > ROAD_X + ROAD_WIDTH - 20) player.x = ROAD_X + ROAD_WIDTH - 20;

    // Speed increases with score
    if (score > 0 && score % 50 === 0) {
        speed = Math.min(player.maxSpeed, speed + 1);
    }
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        // Obstacles move slower than player (simulating passing them)
        obs.y += speed;

        if (obs.y > canvas.height + 100) {
            obstacles.splice(i, 1);
            score += 10;
            updateScore();
        }
    }
}

function updateRocks() {
    for (let i = rocks.length - 1; i >= 0; i--) {
        const rock = rocks[i];
        rock.y += speed;

        if (rock.y > canvas.height + 100) {
            rocks.splice(i, 1);
        }
    }
}

function updateTrees() {
    for (let i = trees.length - 1; i >= 0; i--) {
        const tree = trees[i];
        tree.y += speed;

        if (tree.y > canvas.height + 100) {
            trees.splice(i, 1);
        }
    }
}

function checkCollisions() {
    const playerY = player.y - player.height + (player.jumpHeight || 0);

    // Check obstacle collisions (cars)
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const obsY = obs.y;
        
        // Car is 40px tall, player bike is 48px tall
        // Check if horizontal and vertical positions overlap
        const horizontalOverlap = Math.abs(player.x - obs.x) < 25;
        const verticalOverlap = playerY < obsY + 40 && playerY + player.height > obsY;
        
        if (horizontalOverlap && verticalOverlap) {
            gameOver();
            return;
        }
    }

    // Check rock collisions
    for (let i = 0; i < rocks.length; i++) {
        const rock = rocks[i];

        if (player.isJumping) continue; // Jump over rocks

        const rockY = rock.y;
        const horizontalOverlap = Math.abs(player.x - rock.x) < 15;
        const verticalOverlap = playerY < rockY + 20 && playerY + player.height > rockY;
        
        if (horizontalOverlap && verticalOverlap) {
            // Crash on rock
            gameOver();
            return;
        }
    }

    // Check tree collisions
    for (let i = 0; i < trees.length; i++) {
        const tree = trees[i];

        if (tree.x < ROAD_X && player.x < ROAD_X + 10) {
            gameOver();
            return;
        }

        if (tree.x > ROAD_X + ROAD_WIDTH && player.x > ROAD_X + ROAD_WIDTH - 10) {
            gameOver();
            return;
        }
    }
}

function updateScore() {
    document.getElementById('score').textContent = 'Score: ' + score;
}

function updateSpeed() {
    document.getElementById('speed').textContent = 'Speed: ' + speed + ' MPH';
}

function gameOver() {
    gameRunning = false;
    
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    gameOverDiv.innerHTML = `
        <h2>GAME OVER</h2>
        <p>You crashed!</p>
        <p style="font-size: 24px; margin: 20px 0;">Final Score: ${score}</p>
        <button onclick="location.reload()">PLAY AGAIN</button>
    `;
    
    document.body.appendChild(gameOverDiv);
}

function drawObstacle(obs) {
    const x = obs.x;
    const y = obs.y;

    // Car body
    ctx.fillStyle = '#cc0000'; // Red car
    ctx.fillRect(x - 15, y, 30, 40);

    // Windows
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(x - 12, y + 5, 24, 10);

    // Roof
    ctx.fillStyle = '#990000';
    ctx.fillRect(x - 12, y + 20, 24, 8);

    // Headlights
    ctx.fillStyle = '#ffffcc';
    ctx.fillRect(x - 13, y + 35, 6, 4);
    ctx.fillRect(x + 7, y + 35, 6, 4);

    // Taillights
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x - 13, y + 38, 6, 4);
    ctx.fillRect(x + 7, y + 38, 6, 4);
}

function drawPlayerWithEffects() {
    // Draw bike
    drawBike({
        x: player.x,
        y: player.y,
        color: player.color,
        jumpHeight: player.jumpHeight
    });

    // Draw skid marks effect when turning hard
    if (player.leaning !== 0) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(player.x - 5, player.y + 40, 2, 15);
        ctx.fillRect(player.x + 3, player.y + 40, 2, 15);
    }
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameRunning) {
        // Update game state
        updatePlayer();
        updateObstacles();
        updateRocks();
        updateTrees();
        checkCollisions();

        // Spawn new objects
        frameCount++;
        
        if (frameCount % 200 === 0) {
            spawnObstacle();
        }
        
        if (frameCount % 300 === 0) {
            spawnRock();
        }
        
        if (frameCount % 100 === 0) {
            spawnTree();
        }

        // Update speed display occasionally
        if (frameCount % 30 === 0) {
            updateSpeed();
        }
    }

    // Draw everything
    drawRoad();

    // Draw trees (behind road)
    trees.forEach(drawTree);

    // Draw rocks
    rocks.forEach(drawRock);

    // Draw obstacles (cars)
    obstacles.forEach(drawObstacle);

    // Draw player
    drawPlayerWithEffects();

    requestAnimationFrame(gameLoop);
}

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Prevent scrolling with space
    if (e.key === ' ') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Initialize and start game
updateScore();
gameLoop();
