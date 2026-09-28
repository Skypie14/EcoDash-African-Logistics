
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
let collectedCrates = 0;
let unloading = false;
let gameOver = false;

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

//the boat information
const boat = {
    x: 175,
    y: 650,
    width: 50,
    height: 25,
    speed: 5,
    verlocity: 0,
    verticalVerlocity: 0,
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

    //moves the boat upward
    if (keys["ArrowUp"] || keys["w"]) {
        boat.verticalVerlocity -= boat.acceleration;
    }

    // moves the boat down
    if (keys["ArrowDown"] || keys["s"]) {
        boat.verticalVerlocity += boat.acceleration;
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
    //friction to slow down boat
    
    if (!(keys["ArrowUp"] || keys["w"]) && !(keys["ArrowDown"] || keys["s"])) {

    if (boat.verticalVerlocity > 0) {
        boat.verticalVerlocity -= boat.friction;
    }

    if (boat.verticalVerlocity < 0) {
        boat.verticalVerlocity += boat.friction;
    }

    if (Math.abs(boat.verticalVerlocity) < boat.friction) {
        boat.verticalVerlocity = 0;
    }
    }

    // stops the boat from going faster than max speed

    if (boat.verlocity > boat.maxSpeed) {
    boat.verlocity = boat.maxSpeed;
    }

    if (boat.verlocity < -boat.maxSpeed) {
        boat.verlocity = -boat.maxSpeed;
    }

    if (boat.verticalVerlocity > boat.maxSpeed) {
        boat.verticalVerlocity = boat.maxSpeed;
    }

    if (boat.verticalVerlocity < -boat.maxSpeed) {
        boat.verticalVerlocity = -boat.maxSpeed;
    }

    //boat position updates based on verlocity
    boat.x += boat.verlocity;
    boat.y += boat.verticalVerlocity;

    // Keep boat inside of the canvas [barriers]
    if (boat.x < 0) {
        boat.x = 0;
    }

    if (boat.x + boat.width > canvas.width) {
        boat.x = canvas.width - boat.width;
    }
    
    if (boat.y < 0) {
        boat.y = 0;
    }


    if (boat.y + boat.height > canvas.height) {
        boat.y = canvas.height - boat.height;
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

 // checks for collision w/ the boat and battery/crate
    if (collision(boat, battery)) {

        if (battery.type === "battery") {
            health += 1; //increase health
          if (health > 10) health = 10; // caps health at 10
            score += 10; //score increase
        } else if (battery.type === "crate") {
            score += 20; //score increase
            collectedCrates++
        }

        collectSound.play(); //plays the sound when the boat collides with a crate
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
            health = 0;
            updateUI();
            gameRunning = false;
            gameOver=true;

            batteries = [];
            obstacles = [];
            checkpoint = null;
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
        unloading = true;

        levelComplete = true;
        gameRunning = false;

        document.getElementById("startBtn").textContent = "Next Level";
        document.getElementById("startBtn").style.display = "block";

    }
}

}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw boat
    
    ctx.fillStyle = "#161e27";
    ctx.fillRect(boat.x, boat.y + 8, 50, 17);

    ctx.beginPath();
    ctx.moveTo(boat.x + 50, boat.y + 8);
    ctx.lineTo(boat.x + 60, boat.y + 16);
    ctx.lineTo(boat.x + 50, boat.y + 25);
    ctx.fill();
    
    ctx.fillStyle = "#505657";
    ctx.fillRect(boat.x + 10, boat.y + 2, 25, 10);

    ctx.fillStyle = "#65caf1";
    ctx.fillRect(boat.x + 15, boat.y + 4, 15, 6);



    // Draw batteries 
    batteries.forEach(item => {

    if (item.type === "battery") {
        ctx.fillStyle = "lime";

        // body
        ctx.fillRect(item.x, item.y, 20, 25);

        // top terminal
        ctx.fillStyle = "silver";
        ctx.fillRect(item.x + 6, item.y - 4, 8, 4);
    }
    // draw crate
    if (item.type === "crate") {
        ctx.fillStyle = "saddlebrown";
        ctx.fillRect(item.x, item.y, 25, 25);

        ctx.strokeStyle = "tan";

        ctx.beginPath();
        ctx.moveTo(item.x, item.y);
        ctx.lineTo(item.x + 25, item.y + 25);

        ctx.moveTo(item.x + 25, item.y);
        ctx.lineTo(item.x, item.y + 25);
        ctx.stroke();
    }
});

    // draw obstacles
    obstacles.forEach(obstacle => {

    // draws houses
    if (obstacle.type === "house") {

        ctx.fillStyle = "#d2b48c";
        ctx.fillRect(obstacle.x,obstacle.y + 15,40,25);

        ctx.fillStyle = "darkred";
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y + 15);
        ctx.lineTo(obstacle.x + 20, obstacle.y);
        ctx.lineTo(obstacle.x + 40, obstacle.y + 15);
        ctx.fill();
    }

    // draws logs
    if (obstacle.type === "logs") {

        ctx.fillStyle = "saddlebrown";
        ctx.fillRect(obstacle.x,obstacle.y,50,8);
        ctx.fillRect(obstacle.x, obstacle.y + 10, 50,8);
    }

    // debris
    if (obstacle.type === "debris") {

        ctx.fillStyle = "#666";
        ctx.fillRect(obstacle.x,obstacle.y,12,12);
        ctx.fillRect(obstacle.x + 10, obstacle.y + 8,12,12);
        ctx.fillRect(obstacle.x + 5, obstacle.y + 18,14, 10);
    }
});

    // draw checkpoint
    if (checkpoint) {
        ctx.fillStyle = "gold";
        ctx.fillRect(checkpoint.x,checkpoint.y,checkpoint.width, checkpoint.height);}

    if (unloading && checkpoint) {

    // Draw collected crates
    for (let i = 0; i < collectedCrates; i++) {
        ctx.fillStyle = "saddlebrown";
        ctx.fillRect(250 + (i % 10) * 16,checkpoint.y + 2 + Math.floor(i / 10) * 15,12,12);
    }
}

// Draw Game Over screen
if (gameOver) {

    ctx.fillStyle = "red";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Final Score: " + score,canvas.width / 2,canvas.height / 2 + 30);

    ctx.font = "20px Arial";
    ctx.fillText("Press Reset to Play Again",canvas.width / 2, canvas.height / 2 + 80);
}
    
}

// battery and obstacle and checkpoint creation functions

function spawnBattery() { // creates a battery or crate randomly

    const collectibleType = ["battery", "crate"];
    const type = collectibleType[Math.floor(Math.random() * collectibleType.length)];


    batteries.push({
        type: type,
        x: Math.random() * (canvas.width - 20),
        y: -20,
        width: 20,
        height: 20,
        speed: 2,
        verlocity: 2
    });
}

//spawns obstacles randomly on the screen that could be a house, wood log or debris
function spawnObstacle() {
    const obstacleType = [
        {
            type: "house",
            width: 40,
            height: 50
        },
        {
            type: "logs",
            width: 30,
            height: 10
        },
        {
            type: "debris",
            width: 20,
            height: 20
        }
    ];

    const obsType = obstacleType[Math.floor(Math.random() * obstacleType.length)]; // randomizes obstacle type to get selected

    //draws obstacle
    obstacles.push({
        type: obsType.type,
        x: Math.random() * (canvas.width - 25),
        y: -30,
        width: obsType.width,
        height: obsType.height,
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

        gameOver = false;
        batteries = [];
        obstacles = [];
        checkpoint = null;

        unloading = false;
    
        collectedCrates = 0;

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
    unloading = false;
    collectedCrates = 0;
    gameOver = false;

    // Reset stats
    health = 10;
    score = 0;
    level = 0;
    
    updateUI();
    document.getElementById("currentAngle").textContent = "The current angle is: towards/against the boat";

    //resets verlocity and position

    boat.verlocity = 0;
    boat.verticalVerlocity = 0;

    boat.x = 175;
    boat.y = 650;

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