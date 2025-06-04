# Palette Duel

## 🌟 Short Description

Palette Duel is a real-time multiplayer online drawing game designed to test your artistic skills and quick thinking! Players join rooms, attempt to replicate a target image on their personal canvas, and engage in a fun, interactive experience with synchronized drawing updates. The game features a preparation phase, a timed drawing phase, and a scoring system to determine the most accurate artist.

## 🎮 Live Demo

**You can try out the full game experience at the following URL:**

[**https://web-app-final-three.vercel.app/**](https://web-app-final-three.vercel.app/)

## ✨ Features

* **Real-time Multiplayer:** Connect with friends or other players in rooms.
* **Synchronized Drawing:** See opponents' drawings update live on their dedicated canvases.
    * Supports incremental stroke updates.
    * Handles full canvas state synchronization for actions like undo, redo, and clear.
* **User Canvas & Tools:**
    * Grid-based drawing canvas.
    * Basic drawing tools: Pen, Eraser.
    * Color selection from a predefined palette and fetched game-specific colors.
    * Brush size selection.
    * Undo/Redo functionality.
* **Interactive Color Palette Modal:**
    * Dedicated canvas for mixing existing colors to create new ones.
    * Drag-and-drop color application.
    * Pixel-level color blending on the palette canvas.
    * Color picker to select colors from the palette canvas and add them to the user's selection.
* **Game Flow:**
    * User authentication (name and generated ID).
    * Anonymous matchmaking and passkey-based room joining.
    * Game preparation lobby with player lists and ready-up system.
    * Timed drawing rounds.
    * Target image display for players to draw.
    * Image overlay feature to help with tracing.
* **Scoring System (Backend):**
    * Players submit their final drawings (as base64 strings).
    * Backend compares submitted drawings to the target image using SSIM.
    * Displays scores and winner at the end of the game.

## 🔧 Tech Stack

* **Frontend:**
    * Vue 3 (Composition API)
    * Vite
    * Pinia (State Management)
    * Tailwind CSS (Styling)
    * Socket.IO Client
    * `@iconify/vue` (for icons)
* **Backend (HTTP API - Python, not in this repo):**
    * FastAPI
    * Pydantic (Data validation)
    * Pillow (PIL), NumPy, scikit-image (for image processing and SSIM scoring)
    * Uvicorn (ASGI server)
* **Backend (WebSocket Server - Node.js, not in this repo):**
    * Node.js
    * Express.js
    * Socket.IO
