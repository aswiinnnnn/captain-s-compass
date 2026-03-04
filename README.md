# Captain's Compass — AquaMinds

Enterprise fleet operations platform for real-time voyage optimization, risk management, and intelligent bidding.

## Project Structure

```
captain-s-compass/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Python FastAPI
└── docker-compose.yml # PostgreSQL
```

## Quick Start

### 1. Start PostgreSQL (optional — only for DB features)

```bash
docker-compose up -d
```

### 2. Start the backend

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### 3. Start the frontend

```bash
cd frontend
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

