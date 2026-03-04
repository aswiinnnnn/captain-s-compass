"""Provider-level cache helper using the ``ProviderCache`` model.

Provides a simple get/set interface backed by the ``provider_cache`` table
so that expensive external API calls can be memoised with a TTL.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.provider_cache import ProviderCache

logger = logging.getLogger(__name__)


async def get_cached(
    db: AsyncSession,
    provider: str,
    key: str,
) -> list[dict] | None:
    """Return the cached payload if it exists and hasn't expired, else ``None``."""
    result = await db.execute(
        select(ProviderCache).where(
            and_(
                ProviderCache.provider == provider,
                ProviderCache.key == key,
                ProviderCache.expires_at > datetime.utcnow(),
            )
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        return None
    logger.debug("Cache HIT for %s/%s", provider, key)
    return row.payload


async def set_cached(
    db: AsyncSession,
    provider: str,
    key: str,
    payload: list[dict],
    ttl_hours: int = 6,
) -> None:
    """Store (or overwrite) a cached payload with the given TTL."""
    expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)

    result = await db.execute(
        select(ProviderCache).where(
            and_(
                ProviderCache.provider == provider,
                ProviderCache.key == key,
            )
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.payload = payload
        existing.expires_at = expires_at
    else:
        entry = ProviderCache(
            provider=provider,
            key=key,
            payload=payload,
            expires_at=expires_at,
        )
        db.add(entry)

    await db.commit()
    logger.debug("Cache SET for %s/%s (TTL=%dh)", provider, key, ttl_hours)
