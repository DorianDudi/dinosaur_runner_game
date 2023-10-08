const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let canvasWidth = 1400, canvasHeight = 500; // game canvas size for redraw - display size in html file
//let canvasWidth = 3350, canvasHeight = 500; // size used for development
let xPositionInPixelsBackground = 1100,  score = 0, gameOver = 0, executingJump = 0, gameSpeed = 27; // game speed starts at 27 (lowest) increased to 8 (highest)
let dinosaurWidth = 50, dinosaurHeight = 120, crouching = 0;
let obstacleWidth = 40;
let upperLeftX = 170, upperLeftY_Initial = 320, upperLeftY = upperLeftY_Initial; // upper left coordinates for the game character
let jumpID;	// jump interval
let obstacles = []; //to be populated with x coordinates for the game obstacles
let obstacleType = []; // type 1 = ground obstacle / type 2 = flying obstacle
let obstacleGroupCount = []; // each obstacle is treated as a "group" of 1 to 3 objects - group counts are stored here
let obstacleGapLengths = [1650, 2200, 2750, 3300]; // fixed values representing the four generation points of the obstacles - this randomizes distance between obstacles
let groupMembersHeight = []; // each obstacle "group member" has 3 height levels - height factors of 1, 2 or 3 are stored here
let obstacleTop = 390;
let obstacleBottom = 440;
let generationPoint = 1050; // distance from left side of canvas - once passed by the last obstacle triggers generation of new obstacle
let obstacleFlyingHeight = 365;
let flyingObstacleWidth = 120;
let heightSegment = -45// to be multiplied by height factor in groupMembersHeight
let scoreID;
let moveObstaclesID;
let moveBackgroundID = setInterval(moveBackground, gameSpeed);
runGame();

function moveBackground() { // moves background image right to left in increments of 10px
	document.getElementById('game').style.backgroundPositionX = xPositionInPixelsBackground + "px";
	if (xPositionInPixelsBackground == 0) {
		xPositionInPixelsBackground = 1100;
	} else {
		xPositionInPixelsBackground -= 10;
	}
	//console.log(xPositionInPixelsBackground);
}

function runGame() {
	generateObstacles();
	scoreID = setInterval(incrementScore, 1000);
	//obstaclesID = setInterval(generateObstacles, 1200);
	moveObstaclesID = setInterval(moveObstacles, gameSpeed);
	document.addEventListener('keydown', moveDinosaur);
	drawGame(upperLeftX, upperLeftY);
}

function incrementScore() {
	++score;
	document.getElementById("score").innerHTML = score.toString().padStart(4, '0');
	if (score % 10 == 0) {
		if (gameSpeed >= 9) {
			--gameSpeed;
			//console.log(gameSpeed);
			clearInterval(moveObstaclesID);
			moveObstaclesID = setInterval(moveObstacles, gameSpeed);
			clearInterval(moveBackgroundID);
			moveBackgroundID = setInterval(moveBackground, gameSpeed);
		}
	}
}

function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min); //min-max inclusive
}

function generateObstacles() {
	let newX = obstacleGapLengths[getRandomIntInclusive(0, 3)];
	obstacles.push(newX); 									// sets generation point for new obstacle
	if (gameSpeed <= 15) { // 'flying' obstacles are generated starting at game speed 15
		let setObstacleType = getRandomIntInclusive(1,10); 
		if (setObstacleType < 9) { // assigns type to new obstacle (either 1 ground or 2 flying)
			obstacleType.push(1);  // 80% of the cases a ground obstacle will be generated
		} else {
			obstacleType.push(2);		
		}
	} else {
		obstacleType.push(1);
	}
	groupMembersHeight.push([]);							// creates new entry in the 'groupMembersHeight' array
	if (obstacleType[obstacleType.length - 1] == 1) { // if current obstacle is "ground"
		obstacleGroupCount.push(getRandomIntInclusive(1, 3));	// set no. of obstacles in group
		groupCountLast = obstacleGroupCount[obstacleGroupCount.length - 1];
		groupHeightLast = groupMembersHeight.length - 1; // last element of 'groupMembersHeight'
		for (let i = 0; i < groupCountLast; ++i) { // populate groupMembersHeight with values 1 to 3
			groupMembersHeight[groupHeightLast].push(getRandomIntInclusive(1, 3));
		}
	} else {
		obstacleGroupCount.push(1); // ////////////////////////////////////////////////////////////////////////////////////////////////   !!!group count for flying objects
	}
}

function moveObstacles() {
	for (let i = 0; i < obstacles.length; ++i) {
		obstacles[i] -= 10;
	}
	if (collision()) {
		endGame();
	}
	if (obstacles[obstacles.length - 1] <= generationPoint) {
		generateObstacles();
	}
	deleteObstacles();
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
	obstacleGroupCount = [];
	groupMembersHeight = [];
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
	for (let i = 0; i < obstacles.length; ++i) {
		if (obstacles[i] <= -150) {
			obstacleType.splice(i, 1);
			obstacles.splice(i, 1);
			obstacleGroupCount.splice(i, 1);
			groupMembersHeight.splice(i, 1);
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
	let jumpLimit = 4, jumpPeaked = 0, shortJump = 0;
	document.addEventListener('keyup', ()=>{shortJump = 1}); // if upArrow is released when character is at least 150px from canvas top edge a short jump is triggered 
	jumpID = setInterval(() =>{
		if (shortJump && upperLeftY >= 150) {
			jumpLimit = 95;
			document.removeEventListener('keyup', ()=>{shortJump = 1});
		}
		let jumpIncrement;	 
		if (upperLeftY <= jumpLimit + 20) { // 20 px away from the jump peak the character slows down by traversing a smaller distance increment (2px)
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
		if (!jumpPeaked && upperLeftY <= jumpLimit) {
			jumpPeaked = 1;
		}

		if (jumpPeaked == 1 && upperLeftY >= upperLeftY_Initial) { // upperLeftY_Initial is at the top edge of the character - this instruction block ends the jump
			clearInterval(jumpID);
			upperLeftY = upperLeftY_Initial;
			executingJump = 0;
			jumpLimit = 4;
			shortJump = 0;
			jumpPeaked = 0;
			document.removeEventListener('keyup', ()=>{shortJump = 1});
		}
		drawGame(upperLeftX, upperLeftY);
	}, 15);
}

let heightWidthDifference = dinosaurHeight - dinosaurWidth;
function crouch() { // crouch() and resetDifference
	crouching = 1;
	dinosaurWidth = 50 + heightWidthDifference, dinosaurHeight = 120 - heightWidthDifference, upperLeftY = upperLeftY_Initial + heightWidthDifference;
	document.addEventListener('keyup', crouchEnd);
}

function crouchEnd() {
	document.removeEventListener('keyup', crouchEnd);
	dinosaurWidth = 50, dinosaurHeight = 120, upperLeftY = upperLeftY_Initial;
	crouching = 0;
}

function collision() {
	let collisionPresent = 0;
	for (let i = 0; i < obstacles.length; ++i) { // traverse all existing obstacles
		if (!collisionPresent) {
			let aX = upperLeftX, aY = upperLeftY + dinosaurHeight, bX = upperLeftX + dinosaurWidth, bY = upperLeftY + dinosaurHeight; // a and b are the two bottom corners of the "dinosaur", their coordinates are aX, aY, bX, bY
			if (obstacleType[i] == 1) { // 1 => 'ground' obstacle type
				let obstacleGroupGap = 0; // to be incremented by 45
				for (let k = 0; k < groupMembersHeight[i].length; ++k) { // traverse each obstacle group member
					let obstacleTopLeftX = obstacles[i] + obstacleGroupGap, obstacleTopLeftY = obstacleTop + 5 + ((groupMembersHeight[i][k] - 1) * heightSegment);
					let obstacleTopRightX = obstacles[i] + obstacleGroupGap + obstacleWidth;
					if ((aX > obstacleTopLeftX && aX < obstacleTopRightX && aY > obstacleTopLeftY) || (bX > obstacleTopLeftX && bX < obstacleTopRightX && bY > obstacleTopLeftY)) {
						collisionPresent = 1;
						break;
					}
					obstacleGroupGap += 45;
				}
			} else { // 2 => 'flying' obstacle type
				if (crouching == 0 && ((aX > obstacles[i] && aX < obstacles[i] + flyingObstacleWidth && aY > obstacleFlyingHeight) || (bX > obstacles[i] && bX < obstacles[i] + flyingObstacleWidth && bY > obstacleFlyingHeight))) {
					collisionPresent = 1;
					break;
				}
			}
		}
	}
	return collisionPresent;
}
