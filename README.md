# 2048 Game in React

Welcome to the 2048 Game built with React! This project is a fun and interactive implementation of the popular sliding puzzle game, 2048. The objective of the game is to slide numbered tiles on a grid to combine them and get maximum score.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Gameplay](#gameplay)

## Features

- Responsive design that adapts to different screen sizes.
- Smooth animations for tile movements and merges.
- High score tracking using local storage.
- Touch and keyboard controls for easy gameplay.
- Game over detection and restart functionality.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **GSAP**: A powerful animation library for creating smooth animations.
- **TypeScript**: A superset of JavaScript that adds static types.
- **CSS**: For styling the game interface.

## Installation

To get started with the project, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/SilentCodeSamurai/2048.git
   ```

2. Navigate to the project directory:

   ```bash
   cd 2048
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and go to `http://localhost:5173` to see the game in action!

## Usage

- Use the arrow keys on your keyboard to move the tiles in the desired direction.
- You can also swipe on touch devices to move the tiles.
- The game will automatically generate a new tile after each turn.
- Try to combine the tiles to get maximum score!

## Gameplay

- The game starts with one tile on the board.
- Tiles with the same number will merge into one when they collide.
- The game ends when there are no more valid moves available.
- Your score increases with each merge, and the highest score is saved in local storage.
