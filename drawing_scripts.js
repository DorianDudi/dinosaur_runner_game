function drawGame(X, Y) {
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = 'green';
	ctx.fillRect(X, Y, dinosaurWidth, dinosaurHeight);
	ctx.fillStyle = 'red';
	drawObstacles();
	if (gameOver) {
		drawEndGameMessage();
	}
}

function drawObstacles() {
	for (let i = 0; i < obstacles.length; ++i) {
		let obstacleGroupGap = 0;
		ctx.fillStyle = 'red';
		if (obstacles[i].getType() == "flying") {
			ctx.fillRect(obstacles[i].getPosition(), obstacles[i].getFlyingHeight(), obstacles[i].getObstacleWidth(), obstacles[i].getHeightSegment());
		} else {
			for (let k = 0; k < obstacles[i].getElementsCount(); ++k) {
				ctx.fillRect(obstacles[i].getPosition() + obstacleGroupGap, Obstacle.getObstacleBottom(), obstacles[i].getObstacleWidth(), obstacles[i].getHeightSegment() * obstacles[i].getElementsHeight(k));
				obstacleGroupGap += 45;
			}
		}
	}
}

function drawEndGameMessage() {
	ctx.fillStyle = 'black';
	ctx.font = '20px sans-serif';
	ctx.fillText('GAME OVER', canvasWidth/2 - 60, canvasHeight/2);
}
