"""Test for fleet mock provider endpoint."""

from __future__ import annotations


def test_fleet_vessels_returns_12(client):
    response = client.get("/api/fleet/vessels")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 12


def test_fleet_vessel_has_required_fields(client):
    response = client.get("/api/fleet/vessels")
    assert response.status_code == 200
    vessel = response.json()[0]
    required_fields = [
        "id", "name", "imo", "type", "departurePort", "destinationPort",
        "speed", "heading", "draft", "fuelRemaining", "cargo", "position",
        "eta", "etaDate", "voyageId", "riskScore", "riskLevel", "status",
        "delayHours", "delayFactors", "financialExposure", "demurrageCostPerDay",
        "chartered",
    ]
    for field in required_fields:
        assert field in vessel, f"Missing field: {field}"


def test_fleet_vessel_by_id(client):
    response = client.get("/api/fleet/vessels/vessel-1")
    assert response.status_code == 200
    assert response.json()["name"] == "MV Atlantic Meridian"


def test_fleet_vessel_not_found(client):
    response = client.get("/api/fleet/vessels/nonexistent")
    assert response.status_code == 404


def test_fleet_vessel_routes(client):
    response = client.get("/api/fleet/vessels/vessel-1/routes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert len(data[0]) == 2  # [lat, lng]


def test_fleet_smart_options(client):
    response = client.get("/api/fleet/vessels/vessel-1/smart-options")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Should always have a "wait" option
    ids = [o["id"] for o in data]
    assert "wait" in ids


def test_bidding_canals(client):
    response = client.get("/api/bidding/canals")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    assert data[0]["id"] == "suez"


def test_auth_login_success(client):
    response = client.post("/api/auth/login", json={"email": "captain.a@voyageguard.com", "password": "demo123"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Capt. Jameson Miller"
    assert "password" not in data


def test_auth_login_failure(client):
    response = client.post("/api/auth/login", json={"email": "wrong@test.com", "password": "wrong"})
    assert response.status_code == 401
