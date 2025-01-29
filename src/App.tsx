/// <reference types="vite-plugin-svgr/client" />
import { Direction, FieldState, Merger } from "./types";
import { KeyboardEventHandler, TouchEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { SWIPE_MIN_DISTANCE, TURN_ANIMATION_DURATION } from "./constants";
import { calculateTurn, checkIfGameIsOver, generateStartField, getFreeCoordinates } from "./utils";
import { getHighScore, updateHighScore } from "./storage";

import RefreshIcon from "./assets/refresh.svg?react";
import { Tile } from "./components/Tile";

const GAME_SIZE = 4;

export default function App() {
	const [fieldState, setFieldState] = useState<FieldState>(() => generateStartField(GAME_SIZE));
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
		const horizontalDiff = endX - startX;
		if (Math.abs(verticalDiff) > Math.abs(horizontalDiff)) {
			// Vertical swipe
			if (verticalDiff > SWIPE_MIN_DISTANCE) {
				handleMakeTurn("DOWN");
			} else {
				handleMakeTurn("UP");
			}
		} else {
			// Horizontal swipe
			if (horizontalDiff > SWIPE_MIN_DISTANCE) {
				handleMakeTurn("RIGHT");
			} else {
				handleMakeTurn("LEFT");
			}
		}
	};

	return (
		<div
			className="field"
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
			<div
				style={{
					position: "absolute",
					top: -30,
					left: 0,
					width: "100%",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<span className="info">Turns: {turnsPlayed}</span>
				<span className="info">Score: {score}</span>
			</div>
			{gameOver && (
				<div className="game-over">
					<span className="score">Score: {score}</span>
					<span className="score">HighScore: {getHighScore(GAME_SIZE)}</span>
					<button onClick={handleRestart}>
						<RefreshIcon width={32} height={32} />
					</button>
				</div>
			)}
			{fieldState.tiles.map((tile) => (
				<Tile
					size={fieldSize}
					key={tile.id}
					power={tile.power}
					coordinates={{ x: tile.coordinates.x * fieldSize, y: tile.coordinates.y * fieldSize }}
					mergeDirection={mergers.find((merger) => merger.fromId === tile.id) && turnDirection.current}
				/>
			))}
		</div>
	);
}
