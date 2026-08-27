# AI 3D Hill Climb Game
A browser-based **3D Hill Climb Racing game** built with React, TypeScript, and Vite. The project combines interactive vehicle controls, procedural terrain, game-state management, HUD elements, and a 3D-style racing environment to create an engaging hill-climbing experience.

## Features
* 3D hill-climbing gameplay
* Interactive truck/vehicle controls
* Procedurally generated terrain
* Physics-oriented vehicle movement
* Accelerate and brake controls
* Vehicle balancing while climbing hills
* Real-time game HUD
* Game overlays and UI states
* Dynamic world environment
* Modular game architecture
* Responsive browser-based interface

## Tech Stack
* **React** — User interface and game components
* **TypeScript** — Type-safe game logic
* **Vite** — Development server and build tooling
* **CSS** — Game interface and visual styling
* **HTML5** — Browser-based game foundation

## Game Architecture
The project is organized into separate modules for gameplay, vehicle behavior, terrain, controls, world rendering, and UI.
```text
AI-3D-Hill-Climb-Game/
├── App.tsx
├── Game.tsx
├── HUD.tsx
├── Overlays.tsx
├── Truck.tsx
├── World.tsx
├── controls.ts
├── terrain.ts
├── vehicle.ts
├── store.ts
├── cn.ts
├── index.css
├── index.html
├── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Core Components
**Game.tsx**
Handles the main game experience and coordinates gameplay components.
**Truck.tsx**
Controls the vehicle representation and truck-related gameplay behavior.
**World.tsx**
Manages the game environment and world elements.
**terrain.ts**
Contains terrain-generation and hill-related logic.
**vehicle.ts**
Contains vehicle-related gameplay and movement logic.
**controls.ts**
Handles player input and game controls.
**HUD.tsx**
Displays real-time gameplay information and interface elements.
**Overlays.tsx**
Handles game overlays and different UI states.
**store.ts**
Provides centralized game-state management.

## Controls
The game is designed around simple vehicle controls.
| Action          | Control          |
| --------------- | ---------------- |
| Accelerate      | Keyboard control |
| Brake / Reverse | Keyboard control |
| Balance Vehicle | Keyboard control |
> Check the implementation in `controls.ts` for the current key bindings.

## Gameplay
The objective is to drive the truck across uneven hills while maintaining control and keeping the vehicle balanced.
The terrain creates changing slopes that require the player to manage acceleration and vehicle movement carefully. The game continuously updates the vehicle and world state while displaying relevant information through the HUD.

## Getting Started
### Prerequisites
Install the following:
* Node.js
* npm

### Installation
Clone the repository:
```bash
git clone https://github.com/jatin-2525/AI-3D-Hill-Climb-Game.git
```

Navigate to the project:
```bash
cd AI-3D-Hill-Climb-Game
```

Install dependencies:
```bash
npm install
```

### Run the Development Server
Start the development server:
```bash
npm run dev
```

Vite will provide a local URL, typically:
```text
http://localhost:5173
```

Open the URL in your browser to play the game.

## Production Build
Create an optimized production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Development
The project uses a component-based architecture so that individual systems can be modified independently.
For example:
* Modify `vehicle.ts` to work on vehicle behavior.
* Modify `terrain.ts` to change terrain generation.
* Modify `controls.ts` to change keyboard controls.
* Modify `HUD.tsx` to update the gameplay interface.
* Modify `Truck.tsx` to change vehicle presentation or behavior.
* Modify `World.tsx` to modify the game environment.

## Future Improvements
* [ ] Add multiple vehicles
* [ ] Add multiple environments
* [ ] Add coins and collectible items
* [ ] Add scoring and distance tracking
* [ ] Add vehicle upgrades
* [ ] Add fuel mechanics
* [ ] Add checkpoints
* [ ] Add sound effects
* [ ] Add background music
* [ ] Add improved vehicle physics
* [ ] Add mobile touch controls
* [ ] Add leaderboard/high-score system
* [ ] Add AI-controlled opponents
* [ ] Add more advanced terrain generation

## Learning Objectives
This project demonstrates practical experience with:
* React component architecture
* TypeScript development
* Vite-based frontend development
* Interactive game development
* Game-state management
* Vehicle movement systems
* Procedural terrain concepts
* Keyboard input handling
* Real-time UI updates
* Modular software architecture

## Author
**Jatin Kumar Singhal**
GitHub: https://github.com/jatin-2525

## License
This project is intended for educational and personal use.
