import { Coordinates, Direction } from "../types";
import {
	MERGER_IN_ANIMATION_DURATION,
	MERGER_OUT_ANIMATION_DURATION,
	MERGE_START_PERCENTAGE,
	TURN_ANIMATION_DURATION,
} from "../constants";
import { memo, useEffect, useRef } from "react";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

const turnAnimationDuration = TURN_ANIMATION_DURATION / 1000;
const mergerInAnimationDuration = MERGER_IN_ANIMATION_DURATION / 1000;
const mergerOutAnimationDuration = MERGER_OUT_ANIMATION_DURATION / 1000;

type TileProps = {
	size: number;
	power: number;
	coordinates: Coordinates;
	isMerger?: boolean;
	mergeDirection?: Direction;
};

const borderSide: Record<Direction, string> = {
	UP: "borderTop",
	RIGHT: "borderRight",
	DOWN: "borderBottom",
	LEFT: "borderLeft",
};

export const Tile: React.FC<TileProps> = memo(
	(props) => {
		const boxRef = useRef(null);

		useEffect(() => {
			gsap.set(boxRef.current, {
				x: props.coordinates.x,
				y: props.coordinates.y,
			});
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		useGSAP(() => {
			gsap.timeline()
				.to(boxRef.current, {
					scale: 1.1,
					duration: 0.1,
				})
				.to(boxRef.current, {
					scale: 1,
					duration: 0.1,
				});
		}, [props.power]);

		useGSAP(
			() => {
				const coordinates = props.coordinates;
				const growDirection = props.mergeDirection;
				const startX = Number(gsap.getProperty(boxRef.current, "x"));
				const startY = Number(gsap.getProperty(boxRef.current, "y"));
				if (startX !== coordinates.x) {
					const distanceX = Math.abs(startX - coordinates.x);
					gsap.to(boxRef.current, {
						x: coordinates.x,
						duration: turnAnimationDuration,
						onUpdate: () => {
							if (!growDirection) return;
							const borderParameter = borderSide[growDirection];
							const currentX = Number(gsap.getProperty(boxRef.current, "x"));
							const elapsedX = Math.abs(currentX - startX);
							const percentage = Math.round((elapsedX / distanceX) * 100);
							if (percentage === MERGE_START_PERCENTAGE) {
								gsap.timeline()
									.to(boxRef.current, {
										[borderParameter]: `50px solid var(--tile-color-${props.power})`,
										duration: mergerInAnimationDuration,
									})
									.to(boxRef.current, {
										[borderParameter]: "0px solid transparent",
										duration: mergerOutAnimationDuration,
									});
							}
						},
					});
				}
				if (startY !== coordinates.y) {
					const distanceY = Math.abs(startY - coordinates.y);
					gsap.to(boxRef.current, {
						y: coordinates.y,
						duration: turnAnimationDuration,
						onUpdate: () => {
							if (!growDirection) return;
							const borderParameter = borderSide[growDirection];
							const currentY = Number(gsap.getProperty(boxRef.current, "y"));
							const elapsedY = Math.abs(currentY - startY);
							const percentage = Math.round((elapsedY / distanceY) * 100);
							if (percentage === MERGE_START_PERCENTAGE) {
								gsap.timeline()
									.to(boxRef.current, {
										[borderParameter]: `50px solid var(--tile-color-${props.power})`,
										duration: mergerInAnimationDuration,
									})
									.to(boxRef.current, {
										[borderParameter]: "0px solid transparent",
										duration: mergerOutAnimationDuration,
									});
							}
						},
					});
				}
			},
			{ dependencies: [props.coordinates, props.mergeDirection], scope: boxRef }
		);

		return (
			<div
				className="tile"
				ref={boxRef}
				style={{
					backgroundColor: `var(--tile-color-${props.power})`,
					width: `calc(${props.size}px - var(--padding))`,
					height: `calc(${props.size}px - var(--padding))`,
				}}
			>
				{2 ** props.power}
			</div>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.power === nextProps.power &&
			prevProps.coordinates.x === nextProps.coordinates.x &&
			prevProps.coordinates.y === nextProps.coordinates.y &&
			prevProps.mergeDirection === nextProps.mergeDirection
		);
	}
);
