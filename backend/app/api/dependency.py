"""API dependencies — database session, auth, etc."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session, ensuring cleanup on exit."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
