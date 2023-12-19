const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let canvasWidth = 1400, canvasHeight = 500; // game canvas size
let xPositionInPixelsBackground = 1100,  score = 0, gameOver = 0, executingJump = 0, crouching = 0;
let gameSpeed = 27, maxGameSpeed = 8, flyingObstaclesMinimiumGameSpeed = 15;  // game speed starts at 27ms (lowest) increasing to 8ms (highest)
let obstacleAnimationIncrementInPx = 10;
let dinosaurWidth = 50, dinosaurHeight = 120;
let upperLeftX = 170, upperLeftY_Initial = 320, upperLeftY = upperLeftY_Initial; // upper left coordinates for the game character
let obstacles = []; // to be populated with "Obstacle" objects
let generationTrigger = 1050; // distance from the left side of canvas - once passed by the last obstacle triggers generation of new obstacle
// animation intervals used:
let jumpID;
let scoreID;
let moveObstaclesID;
let moveBackgroundID = setInterval(moveBackground, gameSpeed);

class Obstacle {
	// private fields use the hash symbol "#" as the first character in their name
	static #generationPoints = [1650, 2200, 2750, 3300]; // fixed values representing the four generation points of the obstacles - this randomizes distance between obstacles
	static #heightSegment = -45// to be multiplied by height factor in #elementsHeight (factor can be 1, 2 or 3) => obstacles will be either 45, 90 or 135px in height
	//(negative value needed because canvas origin is at the top left corner and we are drawing towards it)
	static #obstacleTop = 395; //the top of the smallest obstacles is at 395px
	static #obstacleBottom = this.#obstacleTop + this.#heightSegment * -1; // an obstacle segment is 45px high
	#position;
	#type;
	constructor(position, type) {
		this.#position = position;
		this.#type = type;
	}
	
	getPosition() {
		return this.#position;
	}
	
	setPosition(newValue) {
		this.#position = newValue;
	}
	
	getType() {
		return this.#type;
	}
	
	getHeightSegment() {
		return Obstacle.#heightSegment;
	}

	static getGenerationPoints() {
		return Obstacle.#generationPoints[getRandomIntInclusive(0, 3)];
	}

	static getObstacleTop() {
		return Obstacle.#obstacleTop;
	}

	static getObstacleBottom() {
		return Obstacle.#obstacleBottom;
	}
}

class GroundObstacle extends Obstacle {
	static #obstacleWidth = 40;
	static #groupGap = 5; // the gap between a ground obstacle's elements
	#elementsCount = getRandomIntInclusive(1,3);
	#elementsHeight = []; // array will have "#elementsCount" values of 1 to 3
		
	constructor(position) {
		super(position, "ground");
		this.setElementsHeight();
	}
		
	setElementsHeight() {
		for (let i = 0; i < this.#elementsCount; ++i) {
			let heightValue = getRandomIntInclusive(1,3);
			this.#elementsHeight.push(heightValue);
		}
	}
	
	getElementsHeight(elemIndex) {
		return this.#elementsHeight[elemIndex];
	}
	
	getObstacleWidth(){
		return GroundObstacle.#obstacleWidth;
	}

	getElementsCount() {
		return this.#elementsCount;
	}

	static getGroupGap() {
		return GroundObstacle.#groupGap;
	}
}

class FlyingObstacle extends Obstacle {
	static #flyingHeight = 365;
	static #obstacleWidth = 120;

	constructor(position) {
		super(position, "flying");
	}

	getFlyingHeight() {
		return FlyingObstacle.#flyingHeight;
	}

	getObstacleWidth() {
		return FlyingObstacle.#obstacleWidth;
	}
}

function moveBackground() { // moves background image right to left in increments of 10px
	document.getElementById('game').style.backgroundPositionX = xPositionInPixelsBackground + "px";
	if (xPositionInPixelsBackground == 0) {
		xPositionInPixelsBackground = 1100; //reset to initial value
	} else {
		xPositionInPixelsBackground -= 10;
	}
}

function runGame() {
	generateObstacles();
	scoreID = setInterval(incrementScore, 1000);
	moveObstaclesID = setInterval(moveObstacles, gameSpeed);
	document.addEventListener('keydown', moveDinosaur);
}

function incrementScore() {
	++score;
	document.getElementById("score").innerHTML = score.toString().padStart(4, '0');
	if (score % 5 == 0) { // speed increases every 5 seconds
		if (gameSpeed > maxGameSpeed) { // highest speed is 8ms
			--gameSpeed;
			clearInterval(moveObstaclesID); // clear intervals and reset with updated speed value
			moveObstaclesID = setInterval(moveObstacles, gameSpeed);
			clearInterval(moveBackgroundID);
			moveBackgroundID = setInterval(moveBackground, gameSpeed);
		}
	}
}

function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min); // The maximum and minimum values are inclusive
}

function generateObstacles() {
	// the game speed starts at 27ms (slowest) and goes down to 8ms (fastest)
	// flying obstacles are introduced at speeds below or equal to 15ms
	// "setObstacleType" gives a random value from 1 to 10. The condition on line 155 checks for "setObstacleType" values above 8 before generating a flying obstacle => 8 times out of 10 a ground obstacle will be created
	let setObstacleType = getRandomIntInclusive(1,10), groundObstacleRatio = 8;
	let horizPosition = Obstacle.getGenerationPoints(); // selects a random value from the "#generationPoints" array at line 19 as the starting horizontal position (outside visible area)
	let newObstacle;
	if (gameSpeed <= flyingObstaclesMinimiumGameSpeed && setObstacleType > groundObstacleRatio) { // 'flying' obstacles are generated starting at game speed 15 in 20% of cases 
		newObstacle = new FlyingObstacle(horizPosition);	
	} else {
		newObstacle = new GroundObstacle(horizPosition);
	}
	obstacles.push(newObstacle);
}

function moveObstacles() {
	for (let i = 0; i < obstacles.length; ++i) {
		let updatedPosition = obstacles[i].getPosition() - obstacleAnimationIncrementInPx;
		obstacles[i].setPosition(updatedPosition);
	}
	if (collision()) {
		endGame();
	}
	if (obstacles[obstacles.length - 1].getPosition() <= generationTrigger) { //when the last obstacle passes the generation point - another is generated
		generateObstacles();
	}
	deleteObstacles(); // objects that have passed the character and are outside the screen get deleted 
	drawGame(upperLeftX, upperLeftY);
}

function endGame() {
	clearInterval(moveBackgroundID);
	clearInterval(moveObstaclesID);
	clearInterval(scoreID);
	clearInterval(jumpID);
	document.removeEventListener('keydown', moveDinosaur);
	document.getElementById("restart_button").style.display = "block";
	gameOver = 1;
}

function resetGame() {
	obstacles = [];
	executingJump = 0;
	gameSpeed = 27;
	crouching = 0;
	gameOver = 0;
	score = 0;
	upperLeftX = 170;
	upperLeftY = upperLeftY_Initial;
	moveBackgroundID = setInterval(moveBackground, gameSpeed);
	document.getElementById("score").innerHTML = "0000";
	document.getElementById("restart_button").style.display = "none";
	runGame();
}

function deleteObstacles() {
	let deletionLimit = -150;
	for (let i = 0; i < obstacles.length; ++i) {
		if (obstacles[i].getPosition() <= deletionLimit) {
			obstacles.splice(i, 1);
		}
	}
}

function moveDinosaur(event) {
	if (event.key === 'ArrowUp') {
		if (!executingJump && !crouching) {
			jump();
			executingJump = 1;
		}
	} else if (event.key === 'ArrowDown') {
		if (!executingJump) {
			crouch();
		}
	}
}

function jump() {
	let jumpLimit = 4, jumpPeaked = 0, shortJump = 0, shortJumpKeyReleaseLimitPx = 150;
	document.addEventListener('keyup', ()=>{shortJump = 1}); // if upArrow is released when character is at least 150px from canvas top edge a short jump is triggered 
	jumpID = setInterval(() =>{
		if (shortJump && upperLeftY >= shortJumpKeyReleaseLimitPx) {
			jumpLimit = 95; // which is further away from the canvas top side than the initial value of 4px (line 226)
			document.removeEventListener('keyup', ()=>{shortJump = 1});
		}
		let jumpIncrement;	 
		if (upperLeftY <= jumpLimit + 20) { // 20 px away from the jump peak the character slows down by traversing a smaller distance increment (2px), otherwise the distance is set to 20px (line 237)
			jumpIncrement = 2;
		} else {
			jumpIncrement = 20;
		}

		if (!jumpPeaked) { // move towards the jump peak and - once reached - move away from it
			upperLeftY -= jumpIncrement;
		} else {
			upperLeftY += jumpIncrement;
		}
		if (collision()) {
			endGame();
		}
		if (!jumpPeaked && upperLeftY <= jumpLimit) { //jump peaks if the character's top side reaches or passes the jumpLimit
			jumpPeaked = 1;
		}

		if (jumpPeaked && upperLeftY >= upperLeftY_Initial) { // upperLeftY_Initial is at the top edge of the character at the groud position - this instruction block ends the jump
			clearInterval(jumpID);
			upperLeftY = upperLeftY_Initial;
			executingJump = 0;
			jumpLimit = 4;
			shortJump = 0;
			jumpPeaked = 0;
			document.removeEventListener('keyup', ()=>{shortJump = 1});
		}
		drawGame(upperLeftX, upperLeftY);
	}, 15); // 15ms is the interval for the jump animation
}

let heightWidthDifference = dinosaurHeight - dinosaurWidth;
function crouch() { // crouch works by flipping the width and height values of the character
	crouching = 1;
	dinosaurWidth = 50 + heightWidthDifference;
	dinosaurHeight = 120 - heightWidthDifference;
	upperLeftY = upperLeftY_Initial + heightWidthDifference;
	document.addEventListener('keyup', crouchEnd);
}

function crouchEnd() {
	document.removeEventListener('keyup', crouchEnd);
	dinosaurWidth = 50;
	dinosaurHeight = 120;
	upperLeftY = upperLeftY_Initial; // reset to initial values after crouch
	crouching = 0;
}

function collision() {
	let collisionPresent = 0;
	for (let i = 0; i < obstacles.length; ++i) { // traverse all existing obstacles
		if (!collisionPresent) {
			let aX = upperLeftX, aY = upperLeftY + dinosaurHeight, bX = upperLeftX + dinosaurWidth, bY = upperLeftY + dinosaurHeight; // a and b are the two bottom corners of the game character, their coordinates are aX, aY, bX, bY
			if (obstacles[i].getType() == "ground") {
				let drawingPointX = 0;
				for (let k = 0; k < obstacles[i].getElementsCount(); ++k) { // traverse each obstacle group member
					let obstacleTopLeftX = obstacles[i].getPosition()+ drawingPointX, obstacleTopLeftY = Obstacle.getObstacleTop() + ((obstacles[i].getElementsHeight(k) - 1) * obstacles[i].getHeightSegment());
					let obstacleTopRightX = obstacles[i].getPosition() + drawingPointX + obstacles[i].getObstacleWidth();
					if ((aX > obstacleTopLeftX && aX < obstacleTopRightX && aY > obstacleTopLeftY) || (bX > obstacleTopLeftX && bX < obstacleTopRightX && bY > obstacleTopLeftY)) {
						collisionPresent = 1;
						break;
					}
					drawingPointX += (obstacles[i].getObstacleWidth() + GroundObstacle.getGroupGap()); // evaluating the next obstacle in group and accounting for the 5px gap in between
				}
			} else { //'flying' obstacle type
				let flyingObsWidth = obstacles[i].getObstacleWidth();
				if (!crouching && ((aX > obstacles[i].getPosition() && aX < obstacles[i].getPosition() + flyingObsWidth && aY > obstacles[i].getFlyingHeight()) || (bX > obstacles[i].getPosition() && bX < obstacles[i].getPosition() + flyingObsWidth && bY > obstacles[i].getFlyingHeight()))) {
					collisionPresent = 1;
					break;
				}
			}
		}
	}
	return collisionPresent;
}

runGame();
