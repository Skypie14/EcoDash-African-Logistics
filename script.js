
// sets up canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//VARIABLES
let health = 10;
let score = 0;
let level = 1;
let batteries = [];
let obstacles = [];
let checkpoint = null;
let startTime = 0;
let gameRunning = false;
let levelComplete = false;


// tracks what key is currently being pressed
const keys = {};

//the boat object's information/location and size
const boat = {
    x: 175,
    y: 650,
    width: 50,
    height: 25,
    speed: 5
};

// key up and down event to check if its being pressed or not 
document.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});

document.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

function update() { //only moves the boat left and right not up and down
    // moves the boat to the left
    if (keys["ArrowLeft"] || keys["a"]) {
        boat.x -= boat.speed;
    }

    // moves the boat to the right
    if (keys["ArrowRight"] || keys["d"]) {
        boat.x += boat.speed;
    }

    // Keep boat inside of the canvas
    if (boat.x < 0) {
        boat.x = 0;
    }

    if (boat.x + boat.width > canvas.width) {
        boat.x = canvas.width - boat.width;
    }

    // moves the batteries down the screen and checks for collision w/ the boat
    batteries.forEach((battery, index) => {
    battery.y += battery.speed;

    if (collision(boat, battery)) {
        health += 10;
        if (health > 100) health = 100;

        score += 10;
        batteries.splice(index, 1);
    }

    if (battery.y > canvas.height) {
        batteries.splice(index, 1);
    }

    if (!checkpoint && Date.now() - startTime >= 60000) {
    spawnCheckpoint();
}
});

// moves the obstacles down the screen and checks for collision w/ the boat
obstacles.forEach((obstacle, index) => {
    obstacle.y += obstacle.speed;

    if (collision(boat, obstacle)) {
        health -= 2;
        obstacles.splice(index, 1);

        if (health <= 0) {
            alert("Game Over!");
            resetGame();
        }
    }

    if (obstacle.y > canvas.height) {
        obstacles.splice(index, 1);
    }
});

// Show checkpoint after 60 sec has passed 
if (!checkpoint && Date.now() - startTime >= 60000) {
    spawnCheckpoint();
}

//moves the checkpoint down the screen and checks for collision w/ the boat
if (checkpoint) {
    checkpoint.y += checkpoint.speed;

    if (collision(boat, checkpoint)) {
        gameRunning = false;

        document.getElementById("startBtn").textContent = "Next Level";
        document.getElementById("startBtn").style.display = "block";

        alert("Level Complete!");
    }
}

}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw boat
    ctx.fillStyle = "brown";
    ctx.fillRect(boat.x, boat.y, boat.width, boat.height);

    // Draw batteries
    ctx.fillStyle = "lime";
    batteries.forEach(battery => {
    ctx.fillRect(battery.x, battery.y, battery.width, battery.height);
    });

    // draw obstacles
    ctx.fillStyle = "red";
    obstacles.forEach(obstacle => {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // draw checkpoint
    if (checkpoint) {
        ctx.fillStyle = "gold";
        ctx.fillRect(
        checkpoint.x,
        checkpoint.y,
        checkpoint.width,
        checkpoint.height
    );}
    
    
}

// battery and obstacle and checkpoint creation functions

function spawnBattery() {
    batteries.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        width: 20,
        height: 20,
        speed: 2
    });
}

function spawnObstacle() {
    obstacles.push({
        x: Math.random() * (canvas.width - 25),
        y: -25,
        width: 25,
        height: 25,
        speed: 3
    });
}

function spawnCheckpoint() {
    checkpoint = {
        x: canvas.width / 2 - 40,
        y: -40,
        width: 80,
        height: 30,
        speed: 2
    };
}

// collision detection function to check if boat collides with anything

function collision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}


function gameLoop() { //game loop that runs the game

    if (!gameRunning){ //checks if game isn't running
        draw();
        return;
    };
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

setInterval(() => {
    if (gameRunning) {
        spawnBattery();
    }
}, 2000);

setInterval(() => {
    if (gameRunning) {
        spawnObstacle();
    }
}, 1500);

document.getElementById("startBtn").addEventListener("click", () => {

    if (!gameRunning) { //if not running
        gameRunning = true;

        batteries = [];
        obstacles = [];
        checkpoint = null;

        startTime = Date.now(); //resets the timer for the checkpoint

        level++;

        gameLoop(); //game loop starts
    }});

document.getElementById("resetBtn").addEventListener("click", () => { // resets the game when clicked

    // Stop game
    gameRunning = false;
    levelComplete = false;

    // Reset stats
    health = 10;
    score = 0;
    level = 1;

    // Clear all objects
    batteries = [];
    obstacles = [];
    checkpoint = null;

    // Reset timer
    startTime = 0;

    // Reset heading
    document.querySelector(".gameArea h1").textContent = "Title"; //resets headline to title

    // Reset start button
    document.getElementById("startBtn").textContent = "Start"; //resets start button to start instead of next level

    // Clear keys being held down
    for (let key in keys) {
        keys[key] = false;
    }

    // Clear canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw only the boat
    draw();
});