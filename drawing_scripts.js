function drawGame(X, Y) {
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = 'green';
	ctx.fillRect(X, Y, dinosaurWidth, dinosaurHeight);
	/*
	ctx.fillStyle = 'magenta'; //highlights collision points - for testing only
	ctx.fillRect(X, Y + dinosaurHeight, 5, 5);
	ctx.fillRect(X + dinosaurWidth, Y + dinosaurHeight, 5, 5);
	*/
	ctx.fillStyle = 'red'; //320 height
	//ctx.fillRect(0, 320, 3350, 1);
	drawObstacles();
	drawEndGameMessage();
}

function drawObstacles() {
	for (let i = 0; i < obstacles.length; ++i) { //for every obstacle
		let obstacleGroupGap = 0;
		ctx.fillStyle = 'red';
		if (obstacleType[i] == 2) {
			ctx.fillRect(obstacles[i], obstacleFlyingHeight, flyingObstacleWidth, heightSegment);
			//highlights collision points - for testing only
			/*
			ctx.fillStyle = 'black';
			ctx.fillRect(obstacles[i], obstacleFlyingHeight + heightSegment, 4, 4);
			ctx.fillRect(obstacles[i]  + flyingObstacleWidth, obstacleFlyingHeight + heightSegment, 4, 4);
			ctx.fillStyle = 'red';
			*/
		} else {
			for (let k = 0; k < groupMembersHeight[i].length; ++k) {
				ctx.fillRect(obstacles[i] + obstacleGroupGap, obstacleBottom, obstacleWidth, -45 * groupMembersHeight[i][k]);
				/*
				ctx.fillStyle = 'black';
				ctx.fillRect(obstacles[i] + obstacleGroupGap, obstacleTop + ((groupMembersHeight[i][k] - 1) * heightSegment), 4, 4);
				ctx.fillRect(obstacles[i] + obstacleGroupGap  + obstacleWidth, obstacleTop + ((groupMembersHeight[i][k] - 1) * heightSegment), 4, 4);
				ctx.fillStyle = 'red';
				*/
				obstacleGroupGap += 45;
			}
		}
	}
}

function drawEndGameMessage() {
	if (gameOver) {
		ctx.fillStyle = 'black';
		ctx.font = '20px sans-serif';
		ctx.fillText('GAME OVER', canvasWidth/2 - 60, canvasHeight/2);
	}
}