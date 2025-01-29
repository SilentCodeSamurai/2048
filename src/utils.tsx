import { Coordinates, Direction, FieldState, Merger, TileState } from "./types";

export function calculateTurn(
	gameSize: number,
	fieldState: FieldState,
	direction: Direction
): { newFieldState: FieldState; newMergers: Merger[] } {
	const newFieldState: FieldState = {
		tiles: fieldState.tiles.map((tile) => ({ ...tile })), // Deep clone
	};

	const newMergers: Merger[] = [];

	// Helper function to move and merge tiles
	const moveAndMergeTiles = (
		tiles: TileState[],
		getCoordinate: (tile: TileState) => number,
		setCoordinate: (tile: TileState, value: number) => void,
		getNearestTile: (current: number) => TileState | undefined,
		isForward: boolean
	) => {
		tiles.sort((a, b) => (isForward ? getCoordinate(a) - getCoordinate(b) : getCoordinate(b) - getCoordinate(a)));

		for (const tile of tiles) {
			const nearestTile = getNearestTile(getCoordinate(tile));

			if (!nearestTile) {
				setCoordinate(tile, isForward ? 0 : gameSize - 1);
			} else if (
				nearestTile.power === tile.power &&
				!newMergers.flatMap((merger) => [merger.toId, merger.fromId]).includes(nearestTile.id)
			) {
				setCoordinate(tile, getCoordinate(nearestTile));
				newMergers.push({ toId: nearestTile.id, fromId: tile.id });
			} else {
				setCoordinate(tile, getCoordinate(nearestTile) + (isForward ? 1 : -1));
			}
		}
	};

	if (direction === "LEFT" || direction === "RIGHT") {
		const isForward = direction === "LEFT";
		for (let y = 0; y < gameSize; y++) {
			const tileRow = newFieldState.tiles.filter((tile) => tile.coordinates.y === y);
			if (tileRow.length === 0) continue;

			moveAndMergeTiles(
				tileRow,
				(tile) => tile.coordinates.x,
				(tile, value) => (tile.coordinates.x = value),
				(current) => {
					for (let i = current + (isForward ? -1 : 1); isForward ? i >= 0 : i < gameSize; i += isForward ? -1 : 1) {
						const nearestTile = tileRow.find((tile) => tile.coordinates.x === i);
						if (nearestTile) return nearestTile;
					}
					return undefined;
				},
				isForward
			);
		}
	} else if (direction === "UP" || direction === "DOWN") {
		const isForward = direction === "UP";
		for (let x = 0; x < gameSize; x++) {
			const tileColumn = newFieldState.tiles.filter((tile) => tile.coordinates.x === x);
			if (tileColumn.length === 0) continue;

			moveAndMergeTiles(
				tileColumn,
				(tile) => tile.coordinates.y,
				(tile, value) => (tile.coordinates.y = value),
				(current) => {
					for (let i = current + (isForward ? -1 : 1); isForward ? i >= 0 : i < gameSize; i += isForward ? -1 : 1) {
						const nearestTile = tileColumn.find((tile) => tile.coordinates.y === i);
						if (nearestTile) return nearestTile;
					}
					return undefined;
				},
				isForward
			);
		}
	}

	return {
		newFieldState,
		newMergers,
	};
}

export function generateStartField(gameSize: number): FieldState {

	return {
		tiles: [
			{
				id: 0,
				coordinates: { x: Math.floor(Math.random() * gameSize), y: Math.floor(Math.random() * gameSize) },
				power: 1,
			},
		],
	};
}

export function getFreeCoordinates(fieldState: FieldState, gameSize: number): Coordinates | null {
	const freeCoordinates: Coordinates[] = [];
	for (let x = 0; x < gameSize; x++) {
		for (let y = 0; y < gameSize; y++) {
			if (!fieldState.tiles.find((tile) => tile.coordinates.x === x && tile.coordinates.y === y)) {
				freeCoordinates.push({ x, y });
			}
		}
	}
	if (freeCoordinates.length === 0) {
		return null;
	}
	return freeCoordinates[Math.floor(Math.random() * freeCoordinates.length)];
}

export function checkIfGameIsOver(fieldState: FieldState, gameSize: number) {
	// find 2 next to each other tiles with the same power
	for (let x = 0; x < gameSize; x++) {
		for (let y = 0; y < gameSize; y++) {
			const tile = fieldState.tiles.find((tile) => tile.coordinates.x === x && tile.coordinates.y === y);
			// empty tile, no need to check
			if (!tile) return false;
			const rightTile = fieldState.tiles.find((tile) => tile.coordinates.x === x + 1 && tile.coordinates.y === y);
			if (rightTile && rightTile.power === tile.power) return false;
			const downTile = fieldState.tiles.find((tile) => tile.coordinates.x === x && tile.coordinates.y === y + 1);
			if (downTile && downTile.power === tile.power) return false;
			const leftTile = fieldState.tiles.find((tile) => tile.coordinates.x === x - 1 && tile.coordinates.y === y);
			if (leftTile && leftTile.power === tile.power) return false;
			const upTile = fieldState.tiles.find((tile) => tile.coordinates.x === x && tile.coordinates.y === y - 1);
			if (upTile && upTile.power === tile.power) return false;
		}
	}
	return true;
}

export function weightedChoice<T>(items: { value: T; weight: number }[]): T {
	const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
	const randomWeight = Math.random() * totalWeight;
	let cumulativeWeight = 0;
	for (const item of items) {
		cumulativeWeight += item.weight;
		if (randomWeight < cumulativeWeight) {
			return item.value;
		}
	}
	throw new Error("Unexpected error");
}
