"""External data providers for calendar risk events.

Each provider exposes an ``async def fetch_events(...) -> list[dict]`` that
returns dicts keyed with **snake_case** DB column names (``port_id``,
``start_date``, ``end_date``), ready for direct ORM insertion.
"""
