# Captain's Compass — Backend

Python FastAPI backend for the AquaMinds fleet operations platform.

## Prerequisites

- Python 3.11+
- Docker (for PostgreSQL)

## Quick Start

### 1. Create virtual environment

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Start PostgreSQL

```bash
# From the project root
docker-compose up -d
```

### 4. Run migrations

```bash
cd backend
alembic upgrade head
```

### 5. Start the server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The API docs will be available at **http://localhost:8000/docs**

### 6. Start the frontend

```bash
# From the project root
npm run dev
```

The frontend runs on **http://localhost:8080** and proxies `/api/*` to the backend.

## Configuration

Copy `.env.example` to `.env` and adjust values:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_MODE` | `mock` | `mock` for JSON data, `live` for real providers |
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string |
| `SECRET_KEY` | `dev-secret-key...` | Secret key for future auth features |
| `CORS_ORIGINS` | `http://localhost:8080` | Comma-separated allowed origins |

## API Endpoints

All endpoints are under the `/api` prefix.

| Group | Endpoints | Description |
|-------|-----------|-------------|
| Health | `GET /api/health` | System health check |
| Auth | `POST /api/auth/login` | Captain authentication |
| Fleet | `GET /api/fleet/vessels`, `GET /api/fleet/vessels/{id}` | Fleet vessel data |
| Bidding | `GET /api/bidding/canals`, `GET /api/bidding/history` | Canal transit bidding |
| Voyage | `GET /api/voyage/ports`, `POST /api/voyage/routes` | Voyage planning |
| Ports | `GET /api/ports`, `GET /api/ports/events` | Port intelligence |
| Chat | `POST /api/chat/message` | AI chatbot |
| Marine | `GET /api/marine/summary` | Aggregated dashboard |

Full interactive docs at `/docs` (Swagger UI).

## Testing

```bash
cd backend
pytest tests/ -v
```

## Linting

```bash
cd backend
ruff check .
```

## Architecture

```
backend/
├── app/
│   ├── api/          # FastAPI routers
│   ├── schemas/      # Pydantic v2 models
│   ├── services/     # Business logic
│   ├── providers/    # External data (mock/live)
│   │   └── mock_data/  # JSON stub files
│   ├── db/           # SQLAlchemy models + session
│   ├── config.py     # pydantic-settings
│   └── main.py       # Entry point
├── alembic/          # DB migrations
├── tests/            # pytest tests
└── requirements.txt
```
