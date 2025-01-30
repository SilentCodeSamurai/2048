/// <reference types="vite-plugin-svgr/client" />
import { Direction, FieldState, Merger } from "./types";
import { KeyboardEventHandler, TouchEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { SWIPE_MIN_DISTANCE, TURN_ANIMATION_DURATION } from "./constants";
import { calculateTurn, checkIfGameIsOver, generateStartField, getFreeCoordinates } from "./utils";
import { getHighScore, updateHighScore } from "./storage";

import { Tile } from "./components/Tile";

const GAME_SIZE = 4;

const getMockedField = (gameSize: number): FieldState => {
	let tileId = 0;
	const tiles = [
		{
			id: ++tileId,
			coordinates: { x: 0, y: 0 },
			power: 1,
		},
		{
			id: ++tileId,
			coordinates: { x: 1, y: 0 },
			power: 1,
		},
	];

	for (let y = 0; y < gameSize; y++) {
		for (let x = 0; x < gameSize; x++) {
			if (tiles.every((tile) => tile.coordinates.x !== x || tile.coordinates.y !== y)) {
				tiles.push({
					id: ++tileId,
					coordinates: { x, y },
					power: tileId - 1,
				});
			}
		}
	}

	return {
		tiles,
	};
};

export default function App() {
	// const [fieldState, setFieldState] = useState<FieldState>(() => generateStartField(GAME_SIZE));
	const [fieldState, setFieldState] = useState<FieldState>(() => getMockedField(GAME_SIZE));
	const [mergers, setMergers] = useState<Merger[]>([]);
	const latestTileId = useRef(1);
	const turnDirection = useRef<Direction>(null!);

	const [turnsPlayed, setTurnsPlayed] = useState(0);
	const [score, setScore] = useState(0);
	const [gameOver, setGameOver] = useState(false);

	const scoredIds = useRef<number[]>([]);

	const [animating, setAnimating] = useState(false);

	const gameFieldRef = useRef<HTMLDivElement>(null);
	const touchStartRef = useRef<[number, number] | null>(null);

	const [fieldSize, setFieldSize] = useState(0);

	const fieldChangedRef = useRef(false);

	// Focus on the game field
	useEffect(() => {
		if (gameFieldRef.current) {
			gameFieldRef.current.focus();
		}
	}, []);

	// Update field size
	useEffect(() => {
		const updateFieldSize = () => {
			const width = window.innerWidth;
			const newSize = Math.min((width - 32) / GAME_SIZE, 120);
			setFieldSize(newSize);
		};
		updateFieldSize();
		window.addEventListener("resize", updateFieldSize);
		return () => {
			window.removeEventListener("resize", updateFieldSize);
		};
	}, []);

	// Delayed effect to set new states after animation
	useEffect(() => {
		if (!animating) return;
		const timer = setTimeout(() => {
			setFieldState((prevState) => {
				const newTiles = prevState.tiles
					// Remove tiles that were "from" part of a merge
					.filter((tile) => !mergers.find((merger) => merger.fromId === tile.id))
					.map((tile) => {
						// Update tile power if it was "to" part of a merge
						const mergedTile = mergers.find((merger) => merger.toId === tile.id);
						return mergedTile ? { ...tile, power: tile.power + 1 } : tile;
					});

				// Add new tile if possible
				if (fieldChangedRef.current) {
					const freeCoordinates = getFreeCoordinates(prevState, GAME_SIZE);
					if (freeCoordinates) {
						const power = Math.round(Math.random()) + 1;
						newTiles.push({
							id: ++latestTileId.current,
							coordinates: freeCoordinates,
							power,
						});
					}
				}
				return {
					tiles: newTiles,
				};
			});
			setMergers([]);
			setAnimating(false);
		}, TURN_ANIMATION_DURATION);
		return () => clearTimeout(timer);
	}, [animating, mergers]);

	// Updating score
	useEffect(() => {
		const newTiles = fieldState.tiles.filter((tile) => !scoredIds.current.includes(tile.id));
		const mergedTiles = fieldState.tiles.filter((tile) => mergers.find((merger) => merger.toId === tile.id));
		const tilesToScore = newTiles.concat(mergedTiles);
		const scoreToAdd = tilesToScore.reduce((acc, tile) => acc + 2 ** tile.power, 0);
		setScore((prev) => prev + scoreToAdd);
		scoredIds.current = scoredIds.current.concat(newTiles.map((tile) => tile.id));
	}, [fieldState, mergers]);

	// Check if game is over
	useEffect(() => {
		if (!checkIfGameIsOver(fieldState, GAME_SIZE)) return;
		updateHighScore(GAME_SIZE, score);
		setGameOver(true);
	}, [fieldState, score]);

	const handleMakeTurn = useCallback(
		(direction: Direction) => {
			if (animating) return;
			setAnimating(true);

			const { newFieldState, newMergers, fieldChanged } = calculateTurn(GAME_SIZE, fieldState, direction);

			fieldChangedRef.current = fieldChanged;
			turnDirection.current = direction;

			setFieldState(newFieldState);
			setMergers(newMergers);
			if (fieldChanged) {
				setTurnsPlayed((prevState) => prevState + 1);
			}
		},
		[animating, fieldState]
	);

	const handleRestart = useCallback(() => {
		setFieldState(() => generateStartField(GAME_SIZE));
		setMergers([]);
		setTurnsPlayed(0);
		setScore(0);
		setGameOver(false);
		gameFieldRef.current?.focus();
	}, []);

	const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
		(event) => {
			const key = event.key;
			if (key.toLowerCase() === "r") return handleRestart();
			if (!key.includes("Arrow")) return;
			const direction = key.replace("Arrow", "").toUpperCase();
			if (direction !== "LEFT" && direction !== "RIGHT" && direction !== "UP" && direction !== "DOWN") return;
			handleMakeTurn(direction);
		},
		[handleMakeTurn, handleRestart]
	);

	const handleTouchStart: TouchEventHandler<HTMLDivElement> = (event) => {
		if (event.touches.length !== 1) return;
		const y = event.touches[0].clientY;
		const x = event.touches[0].clientX;
		touchStartRef.current = [x, y];
	};

	const handleTouchEnd: TouchEventHandler<HTMLDivElement> = (event) => {
		const endX = event.changedTouches[0].clientX;
		const endY = event.changedTouches[0].clientY;
		handleSwipe({ endX, endY });
	};

	const handleSwipe = ({ endX, endY }: { endX: number; endY: number }) => {
		if (!touchStartRef.current) return;
		const [startX, startY] = touchStartRef.current;
		const verticalDiff = endY - startY;
		const verticalDistance = Math.abs(endY - startY);
		const horizontalDiff = endX - startX;
		const horizontalDistance = Math.abs(endX - startX);
		if (verticalDistance < SWIPE_MIN_DISTANCE || horizontalDistance < SWIPE_MIN_DISTANCE) return;
		if (verticalDistance > horizontalDistance) {
			// Vertical swipe
			if (verticalDiff > 0) {
				handleMakeTurn("DOWN");
			} else {
				handleMakeTurn("UP");
			}
		} else {
			// Horizontal swipe
			if (horizontalDiff > 0) {
				handleMakeTurn("RIGHT");
			} else {
				handleMakeTurn("LEFT");
			}
		}
	};

	return (
		<div className="flex justify-center items-center bg-gradient-to-br from-gray-900 to-black p-4 min-h-screen">
			<div className="text-center">
				<div className="flex flex-row justify-between items-baseline mb-6 px-1">
					<div className="flex flex-col items-center">
						<span className="bg-clip-text bg-gradient-to-br from-orange-100 to-purple-500 drop-shadow-sm font-bold text-transparent text-xl sm:text-3xl">
							SCORE
						</span>
						<span className="bg-clip-text bg-gradient-to-r from-purple-300 to-pink-500 drop-shadow-sm font-bold text-transparent text-xl sm:text-3xl">
							{score}
						</span>
					</div>
					<h1 className="bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm mb-8 font-bold text-5xl text-transparent sm:text-6xl">
						2048
					</h1>
					<div className="flex flex-col items-center">
						<span className="bg-clip-text bg-gradient-to-br from-purple-100 to-pink-500 drop-shadow-sm font-bold text-transparent text-xl sm:text-3xl">
							TURNS
						</span>
						<span className="bg-clip-text bg-gradient-to-br from-orange-300 to-purple-500 drop-shadow-sm font-bold text-transparent text-xl sm:text-3xl">
							{turnsPlayed}
						</span>
					</div>
				</div>
				<div className="mx-auto w-full max-w-2xl">
					<div
						className="relative bg-board-bg shadow-neon p-6 rounded-2xl"
						ref={gameFieldRef}
						tabIndex={1}
						onKeyDown={handleKeyDown}
						onTouchStart={handleTouchStart}
						onTouchEnd={handleTouchEnd}
						style={{
							width: GAME_SIZE * fieldSize,
							height: GAME_SIZE * fieldSize,
						}}
					>
						{gameOver && (
							<div className="top-0 right-0 bottom-0 left-0 z-10 absolute flex flex-col justify-center items-center gap-8 bg-board-bg bg-opacity-55">
								<span className="bg-clip-text bg-gradient-to-l from-pink-100 to-purple-300 font-bold text-4xl text-transparent">
									HighScore: {getHighScore(GAME_SIZE)}
								</span>
								<button
									onClick={handleRestart}
									className="bg-gradient-to-r hover:bg-gradient-to-br from-pink-100 to-purple-300 px-4 py-2 rounded-xl font-bold text-4xl text-black active:scale-95"
								>
									Restart
								</button>
							</div>
						)}
						{fieldState.tiles.map((tile) => (
							<Tile
								size={fieldSize - 20}
								key={tile.id}
								power={tile.power}
								coordinates={{
									x: tile.coordinates.x * fieldSize - 15,
									y: tile.coordinates.y * fieldSize - 15,
								}}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
