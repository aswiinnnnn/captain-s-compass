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
│   ├── schemas/      # Pydantic v2 models (organized by domain)
│   │   ├── auth.py
│   │   ├── bidding.py
│   │   ├── calender.py
│   │   ├── chat.py
│   │   ├── common.py
│   │   ├── fleet.py
│   │   ├── ports.py
│   │   └── voyage.py
│   ├── services/     # Business logic
│   │   ├── bidding_service.py
│   │   ├── chat_service.py
│   │   ├── fleet_service.py
│   │   ├── port_service.py
│   │   ├── voyage_service.py
│   │   └── calender/
│   ├── models/       # SQLAlchemy ORM models (split by entity)
│   │   ├── base.py
│   │   ├── port.py
│   │   ├── calendar_event.py
│   │   ├── provider_cache.py
│   │   └── __init__.py
│   ├── providers/    # External data (mock/live)
│   │   └── mock_data/  # JSON stub files
│   ├── db/           # Database configuration + session
│   │   ├── base_class.py
│   │   ├── db_base.py
│   │   └── session.py
│   ├── config.py     # pydantic-settings
│   └── main.py       # Entry point
├── alembic/          # Database migrations
│   ├── env.py        # Alembic environment configuration
│   ├── script.py.mako # Migration template
│   └── versions/     # Migration files
├── alembic.ini       # Alembic configuration
├── tests/            # pytest tests
└── requirements.txt
```

## Schema Organization

All Pydantic schemas follow a consistent structure with clear sections:

1. **Shared properties** - Base properties used across schemas
2. **Properties to receive via API on creation** - Create request models
3. **Properties to receive in DB on creation** - Database creation models
4. **Properties to receive via API on update** - Update request models
5. **Properties to receive in DB on update** - Database update models
6. **Additional properties to return via API** - Response models
7. **Additional properties stored in DB** - Database storage models
8. **Property for pagination** - Pagination information
9. **Schema to get from the DB** - Base models with `from_attributes = True` for ORM mapping

Example schema structure:
```python
class PortCreateSchema(BaseModel):
    """Port creation schema."""
    name: str
    country: str
    # ... other fields

class PortInDBBase(BaseModel):
    """Port base model from DB."""
    id: str
    name: str
    # ... other fields
    
    class Config:
        from_attributes = True
```

## Database Migrations

Alembic is configured to automatically detect model changes and generate migrations.

### Creating migrations

```bash
# Auto-generate a migration based on model changes
alembic revision --autogenerate -m "Add new column to ports"

# Create an empty migration for manual editing
alembic revision -m "Custom migration"
```

### Applying migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Apply a specific number of migrations
alembic upgrade +2

# Rollback to previous migration
alembic downgrade -1
```

### Viewing migration history

```bash
alembic current

# Show migration history
alembic history
```
