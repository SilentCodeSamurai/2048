import { memo, useEffect, useRef } from "react";

import { Coordinates } from "../types";
import { TURN_ANIMATION_DURATION } from "../constants";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

const turnAnimationDuration = TURN_ANIMATION_DURATION / 1000;

type TileProps = {
	size: number;
	power: number;
	coordinates: Coordinates;
};

export const Tile: React.FC<TileProps> = memo(
	(props) => {
		const boxRef = useRef(null);

		useEffect(() => {
			const docStyle = getComputedStyle(document.documentElement);
			const color = docStyle.getPropertyValue(`--tile-${props.power}`);
			gsap.set(boxRef.current, {
				x: props.coordinates.x,
				y: props.coordinates.y,
				backgroundColor: color,
				boxShadow: `0 0 ${Math.floor(props.power)}px 1px ${color}`,
				width: props.size,
				height: props.size,
			});
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		useGSAP(
			() => {
				const docStyle = getComputedStyle(document.documentElement);
				const color = docStyle.getPropertyValue(`--tile-${props.power}`);
				gsap.timeline()
					.to(boxRef.current, {
						scale: 1.1,
						duration: 0.1,
					})
					.to(boxRef.current, {
						scale: 1,
						duration: 0.1,
					});
				gsap.to(boxRef.current, {
					backgroundColor: color,
					boxShadow: `0 0 ${Math.floor(props.power)}px 1px ${color}`,
					duration: 0.2,
				});
			},
			{ dependencies: [props.power], scope: boxRef }
		);

		useGSAP(
			() => {
				const coordinates = props.coordinates;
				const startX = Number(gsap.getProperty(boxRef.current, "x"));
				const startY = Number(gsap.getProperty(boxRef.current, "y"));
				if (startX !== coordinates.x) {
					gsap.to(boxRef.current, {
						x: coordinates.x,
						duration: turnAnimationDuration,
					});
				}
				if (startY !== coordinates.y) {
					gsap.to(boxRef.current, {
						y: coordinates.y,
						duration: turnAnimationDuration,
					});
				}
			},
			{ dependencies: [props.coordinates], scope: boxRef }
		);

		return (
			<div className={`absolute rounded-xl backdrop-blur-sm opacity-95`} ref={boxRef}>
				{props.power >= 11 && (
					<div className="top-0 right-0 bottom-0 left-0 absolute bg-transparent rounded-xl animate-epic-shadow" />
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
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.power === nextProps.power &&
			prevProps.coordinates.x === nextProps.coordinates.x &&
			prevProps.coordinates.y === nextProps.coordinates.y
		);
	}
);
