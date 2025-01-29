export type Direction = "UP" | "RIGHT" | "DOWN" | "LEFT";

export type Coordinates = {
	x: number;
	y: number;
};

export type Merger = {
    toId: number;
    fromId: number;
};

export type TileState = {
	id: number;
	coordinates: Coordinates;
	power: number;
};

export type FieldState = {
	tiles: TileState[];
};
