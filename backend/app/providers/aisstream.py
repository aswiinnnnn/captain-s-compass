import asyncio
import websockets
import json
from datetime import datetime, timezone

# Store collected ships in memory, updated every 15 mins
_ais_ships_cache: list[dict] = []
_collection_active = False

async def fetch_ais_once(collect_duration: int = 30):
    global _ais_ships_cache, _collection_active
    
    _collection_active = True
    session_cache = {}
    
    try:
        async with websockets.connect("wss://stream.aisstream.io/v0/stream", open_timeout=60) as websocket:
            subscribe_message = {
                "APIKey": "8bc201eb8969884e72c815f9c4a7ee078009ee6f",  # Required!
                "BoundingBoxes": [[[-90, -180], [90, 180]]],  # Required!
                "FilterMessageTypes": ["PositionReport"]  # Optional!
            }

            subscribe_message_json = json.dumps(subscribe_message)
            await websocket.send(subscribe_message_json)
            
            start_time = datetime.now(timezone.utc)
            
            async for message_json in websocket:
                # Check if collection duration has expired
                elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
                if elapsed > collect_duration:
                    print(f"[{datetime.now(timezone.utc)}] Collection period ended. Collected {len(session_cache)} unique ships.")
                    break
                
                message = json.loads(message_json)
                message_type = message["MessageType"]

                if message_type == "PositionReport":
                    ais_message = message["Message"]["PositionReport"]
                    
                    # Extract relevant ship data
                    ship_data = {
                        "mmsi": str(ais_message.get("UserID", "")),
                        "latitude": float(ais_message.get("Latitude", 0.0)),
                        "longitude": float(ais_message.get("Longitude", 0.0)),
                        "speed": float(ais_message.get("Speed", 0.0)),  # Speed in knots
                        "heading": float(ais_message.get("Heading", 0.0)),  # Heading in degrees
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                    
                    # Store/update ship data (most recent position wins)
                    mmsi = ship_data["mmsi"]
                    session_cache[mmsi] = ship_data
                    
            if session_cache:
                # Sort by timestamp and update the global cache
                ships = sorted(session_cache.values(), key=lambda x: x["timestamp"], reverse=True)
                _ais_ships_cache = ships
                
    except Exception as e:
        print(f"AISStream connection error: {e}")
    finally:
        _collection_active = False


async def start_ais_polling(interval_minutes: int = 15, collect_duration: int = 30):
    """Run fetch_ais_once in a loop every interval_minutes. Updates cache every time."""
    while True:
        print(f"[{datetime.now(timezone.utc)}] Starting AIS data fetch for {collect_duration} seconds...")
        await fetch_ais_once(collect_duration=collect_duration)
        print(f"[{datetime.now(timezone.utc)}] Sleeping for {interval_minutes} minutes before next AIS fetch...")
        await asyncio.sleep(interval_minutes * 60)


def get_ais_ships(limit: int = 50) -> list[dict]:
    """
    Get current session's collected AIS ships from the memory cache.
    
    Args:
        limit: Maximum number of ships to return (default 50)
    
    Returns:
        List of ship dictionaries, sorted by timestamp (newest first)
    """
    print(f"[{datetime.now(timezone.utc).isoformat()}] get_ais_ships called, requesting limit {limit}")
    result = _ais_ships_cache[:limit] if limit else _ais_ships_cache
    print(f"[{datetime.now(timezone.utc).isoformat()}] get_ais_ships returning {len(result)} ships (from {len(_ais_ships_cache)} total in cache)")
    return result


def is_collection_active() -> bool:
    """Check if AISStream collection is currently running."""
    return _collection_active


if __name__ == "__main__":
    asyncio.run(start_ais_polling(interval_minutes=1, collect_duration=15))