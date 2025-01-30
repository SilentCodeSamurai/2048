import { useEffect, useRef, useState } from "react";

import { Coordinates } from "../types";
import { TURN_ANIMATION_DURATION } from "../constants";

type TileProps = {
	size: number;
	power: number;
	coordinates: Coordinates;
};

export const Tile: React.FC<TileProps> = (props) => {
	const boxRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	useEffect(() => {
		if (boxRef.current) {
			setScale(1.1);
			const timer = setTimeout(() => {
				setScale(1);
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [props.power]);

	return (
		<>
			<div
				ref={boxRef}
				className={`absolute rounded-xl backdrop-blur-sm opacity-95`}
				style={{
					transform: `translate3d(${props.coordinates.x}px, ${props.coordinates.y}px, 0) scale(${scale})`,
					backgroundColor: `var(--tile-${props.power})`,
					boxShadow: `0 0 ${Math.floor(props.power)}px 1px var(--tile-${props.power})`,
					transition: `background-color 0.1s ease-in-out, box-shadow 0.1s ease-in-out, transform ${TURN_ANIMATION_DURATION}ms cubic-bezier(0.33, 1, 0.68, 1)`,
					width: props.size,
					height: props.size,
					willChange: "transform, background-color, box-shadow",
				}}
			>
				{props.power >= 11 && (
					<div
						className="absolute bg-transparent rounded-xl animate-epic-shadow"
						style={{
							width: props.size,
							height: props.size,
						}}
					/>
				)}
				<span
					style={{
						lineHeight: `${props.size}px`,
						fontSize: `${props.size / 2 - props.power}px`,
					}}
					className="bg-clip-text bg-gradient-to-br from-white to-gray-300 font-bold text-transparent animate-pulse-slow"
				>
					{2 ** props.power}
				</span>
			</div>
		</>
	);
};
