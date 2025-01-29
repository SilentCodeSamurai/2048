export function getHighScore(gameSize: number): number {
	const highScore = localStorage.getItem(`highScores-${gameSize}`);
	return highScore ? parseInt(highScore) : 0;
}

export function setHighScore(gameSize: number, score: number) {
	localStorage.setItem(`highScores-${gameSize}`, score.toString());
}

export function updateHighScore(gameSize: number, score: number) {
	const highScore = getHighScore(gameSize);
	if (score > highScore) {
		setHighScore(gameSize, score);
	}
}
