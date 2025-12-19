# 🐇 Coelho Is Back

A retro arcade-style time tracker with interactive 3D dice and bouncing emojis. Track your arrival and departure times in Porto with style!

## ✨ Features

- ⏱️ **Real-time stopwatch** - Track time since arrival in Porto
- 🎲 **3D animated dice** - Fully animated OpenGL dice with realistic physics (powered by Three.js)
- 🐇 **Interactive bouncing emojis** - Click anywhere to spawn bouncing rabbits and creatures
- 🎮 **Retro arcade aesthetic** - 80's game-inspired neon colors and pixel art styling
- 🗄️ **Persistent history** - SQLite database with Prisma stores your arrival/departure records
- 🎪 **Hidden easter eggs**:
  - Type `dnd` to activate Dungeon Master mode
  - Type `heal` to use a healing potion
  - Type `curse` to spawn cursed entities
  - Enter the Konami code (`↑↑↓↓←→←→BA`) for spell shield

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **3D Graphics**: Three.js + React Three Fiber + React Three Drei
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm
- **Deployment**: Fly.io

## 🛠️ Getting Started

First, install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🎯 Game Mechanics

- **Click anywhere** to spawn entities with random D&D-style rolls (1-20)
- **Roll 16+**: Spawns an animated 3D dice (1 in 4 chance)
- **Roll 20**: Critical success! Spawns extra sparkle effects
- **Roll 1**: Critical fail! Spawns cursed entities in DM mode
- **Max 20 entities** on screen for performance
- **Only 1 dice at a time** to prevent performance issues

## 📦 Build & Deploy

Build for production:

```bash
pnpm build
```

Deploy to Fly.io:

```bash
fly deploy
```

## 🗃️ Database

The app uses SQLite with Prisma. Schema includes:

- Arrival/departure timestamps
- Formatted time strings
- Type indicators (ARRIVAL/DEPARTURE)

## 📄 License

MIT
