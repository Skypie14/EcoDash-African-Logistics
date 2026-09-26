
// sets up canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//Variables
let health = 10;
let score = 0;
let level = 0;
let batteries = [];
let obstacles = [];
let checkpoint = null;
let startTime = 0;
let gameRunning = false;
let levelComplete = false;

let hitSound = new Audio("hit.mp3"); //https://dev.to/amitavmishra99/play-audio-with-htmlaudioelement-api-in-javascript-2fcf
let collectSound = new Audio("battery.mp3");
let checkpointSound = new Audio("checkpoint.mp3");
// what Audio does is that it creates a new audio object so that you can play the sound

// Water current
let currentAngle =
    parseFloat(localStorage.getItem("currentAngle")) ||
    Math.random() * Math.PI * 2; //randomizes the current angle if there is no current angle in storage

let currentX = Math.cos(currentAngle); // calculates the x of current angle
let currentY = Math.sin(currentAngle); // calculates the y of current angle

// tracks what key is currently being pressed
const keys = {};

//the boat info
const boat = {
    x: 175,
    y: 650,
    width: 50,
    height: 25,
    speed: 5,
    verlocity: 0,
    acceleration: 0.3,
    maxSpeed: 5,
    friction: 0.2
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
        boat.verlocity -= boat.acceleration;
    }

    // moves the boat to the right
    if (keys["ArrowRight"] || keys["d"]) {
        boat.verlocity += boat.acceleration;
    }

    // friction to slow down the boat when no key is being pressed
    if (!(keys["ArrowLeft"] || keys["a"]) && !(keys["ArrowRight"] || keys["d"])) {

    if (boat.verlocity > 0) {
        boat.verlocity -= boat.friction;
    }

    if (boat.verlocity < 0) {
        boat.verlocity += boat.friction;
    }

    if (Math.abs(boat.verlocity) < boat.friction) {
        boat.verlocity = 0;
    }

    }   

    // stops the boat from going faster than max speed

    if (boat.verlocity > boat.maxSpeed) {
    boat.verlocity = boat.maxSpeed;
    }

    if (boat.verlocity < -boat.maxSpeed) {
        boat.verlocity = -boat.maxSpeed;
    }

    //boat position updates based on verlocity
    boat.x += boat.verlocity;

    // Keep boat inside of the canvas [barriers]
    if (boat.x < 0) {
        boat.x = 0;
    }

    if (boat.x + boat.width > canvas.width) {
        boat.x = canvas.width - boat.width;
    }

    // moves the batteries down the screen and checks for collision w/ the boat
    batteries.forEach((battery, index) => {
    

    const boatDirectionY = -1; 
    if (currentY * boatDirectionY > 0) {
        battery.verlocity += 0.01; // moving with boat direction
    } else {
        battery.verlocity -= 0.01; // moving against boat direction
    }

    if (battery.verlocity < 0.5) battery.verlocity = 0.5; // set a min speed for battery
        
    battery.y += battery.verlocity; // update battery position

 // checks for collision w/ the boat and battery
    if (collision(boat, battery)) {
        health += 1; //increase health
        if (health > 10) health = 10; // caps health at 10
        collectSound.play(); //plays the sound when the boat collides with a battery

        score += 10; //score increase

        updateUI(); // update screen


        batteries.splice(index, 1); //removes battery after collision
    }

    if (battery.y > canvas.height) { //removes battery if it goes off screen
        batteries.splice(index, 1);
    }

    if (!checkpoint && Date.now() - startTime >= 60000) { //shows checkpoint after the time has passed [1 min]
    spawnCheckpoint();
}
});

// moves the obstacles down the screen and checks for collision w/ the boat
obstacles.forEach((obstacle, index) => {
    const boatDirectionY = -1;
    if (currentY * boatDirectionY > 0) {
        obstacle.verlocity += 0.01; // current toward boat
    } else {
        obstacle.verlocity -= 0.01; // current against boat
    }

if (obstacle.verlocity < 0.5) obstacle.verlocity = 0.5; //min speed for obstacle

obstacle.y += obstacle.verlocity;

    if (collision(boat, obstacle)) { //checks for collision w/ the boat and obstacle
         health -= 2;
        updateUI(); // update screen
        obstacles.splice(index, 1);
        hitSound.play(); //plays the sound when the boat collides with an obstacle

        if (health <= 0) { //ends game if health = 0
            alert("Game Over!");
            resetGame();
        }
    }

    if (obstacle.y > canvas.height) { //removes obstacle if it goes off screen
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
        checkpointSound.play(); //plays the sound when the boat collides with a checkpoint
        levelComplete = true;
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
        speed: 2,
        verlocity: 2
    });
}

function spawnObstacle() {
    obstacles.push({
        x: Math.random() * (canvas.width - 25),
        y: -25,
        width: 25,
        height: 25,
        speed: 3,
        verlocity: 3
    });
}

function spawnCheckpoint() {
    checkpoint = {
        x: 0, //covers the entire width of the canvas
        y: -40,
        width: canvas.width ,
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

//updates health and score when boat collides w/ battery or obstacle
function updateUI() {
    document.getElementById("healthText").textContent =  health;
    document.getElementById("scoreText").textContent = "Score: " + score;
    document.getElementById("levelTitle").textContent = "Level " + level;
    document.getElementById("currentAngle").textContent = "The current angle is: " +
        (currentY * -1 > 0 ? "towards the boat" : "against the boat");

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

setInterval(() => { //spawns batteries every 2 seconds
    if (gameRunning) {
        spawnBattery();
    }
}, 2000);

setInterval(() => { //spawns obstacles every 1.5 seconds
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

        currentAngle = Math.random() * Math.PI * 2;
        localStorage.setItem("currentAngle", currentAngle);
        currentX = Math.cos(currentAngle);
        currentY = Math.sin(currentAngle);

        level++;

        updateUI();  
        //fixes the current angle
        gameLoop(); //game loop starts
    } 
});

document.getElementById("resetBtn").addEventListener("click", () => { // resets the game when clicked

    // Stop game
    gameRunning = false;
    levelComplete = false;

    // Reset stats
    health = 10;
    score = 0;
    level = 0;
    
    updateUI();
    document.getElementById("currentAngle").textContent = "The current angle is: towards/against the boat";

    // Clear all objects
    batteries = [];
    obstacles = [];
    checkpoint = null;

    // Reset timer
    startTime = 0;

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