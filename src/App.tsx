import { Direction, FieldState, Merger } from "./types";
import { KeyboardEventHandler, TouchEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateTurn, checkIfGameIsOver, generateStartField, getFreeCoordinates } from "./utils";
import { getHighScore, updateHighScore } from "./storage";

import { TURN_ANIMATION_DURATION } from "./constants";
import { Tile } from "./components/Tile";

export default function App() {
	const [menuOpen, setMenuOpen] = useState(true);

	const [gameSize, setGameSize] = useState(4);

	const [fieldState, setFieldState] = useState<FieldState>({ tiles: [] });
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

	const turnQueue = useRef<Direction[]>([]);

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
			const newSize = Math.min((width - 32) / gameSize, 120);
			setFieldSize(newSize);
		};
		updateFieldSize();
		window.addEventListener("resize", updateFieldSize);
		return () => {
			window.removeEventListener("resize", updateFieldSize);
		};
	}, [gameSize]);

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
					const freeCoordinates = getFreeCoordinates(prevState, gameSize);
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
	}, [gameSize, animating, mergers]);

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
		if (!checkIfGameIsOver(fieldState, gameSize)) return;
		updateHighScore(gameSize, score);
		setGameOver(true);
	}, [gameSize, fieldState, score]);

	const makeTurn = useCallback((direction: Direction) => {
		setAnimating(true);

		const { newFieldState, newMergers, fieldChanged } = calculateTurn(gameSize, fieldState, direction);

		fieldChangedRef.current = fieldChanged;
		turnDirection.current = direction;

		setFieldState(newFieldState);
		setMergers(newMergers);
		if (fieldChanged) {
			setTurnsPlayed((prevState) => prevState + 1);
		}
	}, [gameSize, fieldState]);

	useEffect(() => {
		if (animating) return;
		if (turnQueue.current.length === 0) return;
		const direction = turnQueue.current.shift()!;
		makeTurn(direction);
	}, [animating, makeTurn]);

	const handleMakeTurn = useCallback(
		(direction: Direction) => {
			if (animating) {
				turnQueue.current.push(direction);
				return;
			}
			if (turnQueue.current.length > 0) {
				return;
			}
			makeTurn(direction);
		},
		[animating, makeTurn]
	);

	const handleStartGame = useCallback(() => {
		setMergers([]);
		setTurnsPlayed(0);
		setScore(0);
		setGameOver(false);
		gameFieldRef.current?.focus();
		setFieldState(() => generateStartField(gameSize));
		setMenuOpen(false);
	}, [gameSize]);

	const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
		(event) => {
			const key = event.key;
			if (key.toLowerCase() === "r") return handleStartGame();
			if (!key.includes("Arrow")) return;
			const direction = key.replace("Arrow", "").toUpperCase();
			if (direction !== "LEFT" && direction !== "RIGHT" && direction !== "UP" && direction !== "DOWN") return;
			handleMakeTurn(direction);
		},
		[handleMakeTurn, handleStartGame]
	);

	const handleTouchStart: TouchEventHandler<HTMLDivElement> = (event) => {
		event.preventDefault();
		if (event.touches.length !== 1) return;
		const y = event.touches[0].clientY;
		const x = event.touches[0].clientX;
		touchStartRef.current = [x, y];
	};

	const handleTouchEnd: TouchEventHandler<HTMLDivElement> = (event) => {
		event.preventDefault();
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

	const tileSize = useMemo(() => fieldSize - 20, [fieldSize]);

	const tilesToRender = useMemo(() => {
		return fieldState.tiles.map((tile) => {
			return (
				<Tile
					key={tile.id}
					size={tileSize}
					power={tile.power}
					coordinates={{
						x: tile.coordinates.x * fieldSize - 15,
						y: tile.coordinates.y * fieldSize - 15,
					}}
				/>
			);
		});
	}, [tileSize, fieldSize, fieldState]);

	return (
		<div className="flex justify-center items-center bg-gradient-to-br from-gray-900 to-black p-4 h-dvh touch-none">
			<div className="text-center">
				{menuOpen ? (
					<>
						<h1 className="bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm mb-8 font-bold text-transparent text-5xl sm:text-6xl">
							2048
						</h1>
						<div className="relative flex flex-col justify-center items-center gap-8 bg-board-bg bg-opacity-55 shadow-neon p-6 rounded-2xl">
							<div className="flex flex-row gap-2">
								<button
									onClick={() => setGameSize(3)}
									className={`${
										gameSize === 3 ? "shadow-neon" : ""
									} bg-gradient-to-r hover:bg-gradient-to-br from-pink-100 to-purple-300 w-16 h-16 rounded-xl active:scale-95`}
								>
									<h1 className="bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm font-bold text-transparent text-5xl sm:text-6xl">
										3
									</h1>
								</button>
								<button
									onClick={() => setGameSize(4)}
									className={`${
										gameSize === 4 ? "shadow-neon" : ""
									} bg-gradient-to-r hover:bg-gradient-to-br from-pink-100 to-purple-300 w-16 h-16 rounded-xl active:scale-95`}
								>
									<h1 className="bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm font-bold text-transparent text-5xl sm:text-6xl">
										4
									</h1>
								</button>
								<button
									onClick={() => setGameSize(5)}
									className={`${
										gameSize === 5 ? "shadow-neon" : ""
									} bg-gradient-to-r hover:bg-gradient-to-br from-pink-100 to-purple-300 w-16 h-16 rounded-xl active:scale-95`}
								>
									<h1 className="bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm font-bold text-transparent text-5xl sm:text-6xl">
										5
									</h1>
								</button>
							</div>
							<button
								onClick={() => handleStartGame()}
								className={`bg-gradient-to-r hover:bg-gradient-to-br from-pink-100 to-purple-300 px-2 py-2 rounded-xl active:scale-95`}
							>
								<h1 className="font-bold text-black sm:text-2xl text-3xl">PLAY</h1>
							</button>
						</div>
					</>
				) : (
					<>
						<div className="flex flex-row justify-between items-baseline mb-6 px-1">
							<div className="flex flex-col items-center">
								<span className="bg-clip-text bg-gradient-to-br from-orange-100 to-purple-500 drop-shadow-sm font-bold text-transparent text-xl sm:text-3xl">
									SCORE
								</span>
								<span className="bg-clip-text bg-gradient-to-r from-purple-300 to-pink-500 drop-shadow-sm font-bold text-transparent text-xl sm:text-3xl">
									{score}
								</span>
							</div>
							<h1 className="bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm mb-8 font-bold text-transparent text-5xl sm:text-6xl">
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
									width: gameSize * fieldSize,
									height: gameSize * fieldSize,
								}}
							>
								{gameOver && (
									<div className="top-0 right-0 bottom-0 left-0 z-10 absolute flex flex-col justify-center items-center gap-8 bg-board-bg bg-opacity-55">
										<span className="bg-clip-text bg-gradient-to-l from-pink-100 to-purple-300 font-bold text-transparent text-4xl">
											HIGH SCORE: {getHighScore(gameSize)}
										</span>
										<button
											onClick={() => handleStartGame()}
											className={`bg-gradient-to-r hover:bg-gradient-to-br from-pink-100 to-purple-300 px-2 py-2 rounded-xl active:scale-95`}
										>
											<h1 className="font-bold text-black sm:text-2xl text-3xl">RESTART</h1>
										</button>
										<button
											onClick={() => setMenuOpen(true)}
											className={`bg-gradient-to-r hover:bg-gradient-to-br from-pink-100 to-purple-300 px-2 py-2 rounded-xl active:scale-95`}
										>
											<h1 className="font-bold text-black sm:text-2xl text-3xl">MENU</h1>
										</button>
									</div>
								)}
								{tilesToRender}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
