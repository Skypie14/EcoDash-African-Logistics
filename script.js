
// sets up canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//the boat object's information/location and size
const boat = {
    x: 175,
    y: 650,
    width: 50,
    height: 25,
    speed: 5
};

// tracks what key is currently being pressed
const keys = {};

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
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw boat
    ctx.fillStyle = "brown";
    ctx.fillRect(boat.x, boat.y, boat.width, boat.height);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}