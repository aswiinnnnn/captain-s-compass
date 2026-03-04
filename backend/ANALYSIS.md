# Captain's Compass — Frontend → Backend Analysis

> **Generated from**: Scan of `src/data/`, `src/pages/`, `src/components/`, `src/contexts/`
> **Date**: 2026-03-04

---

## 1. Frontend Pages & Data Dependencies

| Page | Route | Data Files Imported | Key Interfaces Used |
|------|-------|---------------------|---------------------|
| Landing | `/` | — (static) | — |
| Login | `/login` | `mockData.ts` | `Captain` |
| Dashboard | `/dashboard` → `/fleet` | `mockData.ts` | `Captain`, `CanalPort` |
| FleetOverview | `/fleet` | `fleetData.ts` | `FleetVessel`, `vesselRoutes` |
| BiddingDetail | `/bidding/:id` | `mockData.ts` | `CanalPort`, `PreviousBid`, `BidFactor`, `probabilityData` |
| RiskAnalysis | `/risk/:id` | `fleetData.ts` | `FleetVessel`, `MitigationStrategy` |
| VoyagePlanner | `/voyage-planner` | `voyagePlannerData.ts`, `portIntelligenceData.ts` | `Port`, `Vessel`, `VoyageRouteOption`, `PortEntry`, `CalendarEvent` |
| PortIntelligence | `/port-intelligence` | `portIntelligenceData.ts` | `PortEntry`, `EquipmentItem`, `CalendarEvent`, `RiskZone` |

### Shared Components

| Component | Data Used | Source |
|-----------|-----------|--------|
| `VoyageMap` | `canalsPorts`, `routeWaypoints`, `CanalPort` | `mockData.ts` |
| `ShipInfoPanel` | `Captain` | `mockData.ts` |
| `CanalPortCards` | `canalsPorts` | `mockData.ts` |
| `AIChatbot` | Internal chat state; consumes `canalName`, `bidAmount` as props | local state + `ChatContext` |
| `ChatContext` | `ChatMessage`, `getAIResponse()` | `mockData.ts` |

---

## 2. TypeScript Interfaces → Pydantic Schemas

### From `mockData.ts`

| TS Interface | Fields | Backend Schema |
|-------------|--------|----------------|
| `Captain` | id, name, email, password, shipName, shipType, cargoType, imo, currentSpeed, heading, draft, fuelRemaining, position{lat,lng}, eta, voyageId, departurePort, destinationPort | `CaptainSchema` |
| `CanalPort` | id, name, type('canal'\|'port'\|'strait'), description, distance, eta, requiresBidding, requiresBooking, congestionStatus, weatherRisk, rules[], historicalCongestion, position{lat,lng}, currentBidRange{min,max}, avgClearingPrice, queueLength, securityLevel | `CanalPortSchema` |
| `PreviousBid` | time, amount, result('Won'\|'Lost'\|'Expired'), clearingPrice, priority | `PreviousBidSchema` |
| `BidFactor` | name, value, impact('up'\|'down'\|'neutral'), description, weight | `BidFactorSchema` |
| `ChatMessage` | id, role('user'\|'ai'), content, timestamp, card?{type, confidence, amount} | `ChatMessageSchema` |
| `probabilityData` | Array of `{bid: number, probability: number}` | `BidProbabilitySchema` |

### From `fleetData.ts`

| TS Interface | Fields | Backend Schema |
|-------------|--------|----------------|
| `FleetVessel` | id, name, imo, type, departurePort, destinationPort, speed, heading, draft, fuelRemaining, cargo, position{lat,lng}, eta, etaDate, voyageId, riskScore, riskLevel, status, delayHours, delayFactors[], financialExposure, demurrageCostPerDay, chartered, charterRate? | `FleetVesselSchema` |
| `DelayFactor` | name, hours, severity, category, detail | `DelayFactorSchema` |
| `SmartOption` | id, label, description, tag, costLabel, costAmount, demurrageSave, netBenefit, reasoning | `SmartOptionSchema` |
| `MitigationStrategy` | id, label, description, tag, costLabel, costAmount, demurrageSave, netBenefit | `MitigationStrategySchema` |

### From `portIntelligenceData.ts`

| TS Interface | Fields | Backend Schema |
|-------------|--------|----------------|
| `PortEntry` | id, name, country, region, code, lat, lng, anchorageCostPerDay, berthCostPerHour, equipment[], estimatedHandlingTimeHrs, congestionLevel, lastUpdatedBy, lastUpdatedAt | `PortEntrySchema` |
| `EquipmentItem` | type, totalUnits, availableUnits, status, hireRatePerHour | `EquipmentItemSchema` |
| `CalendarEvent` | id, type, title, description, detail, portId, region, startDate, endDate, severity | `CalendarEventSchema` |
| `RiskZone` | id, name, type, region, severity, description, active | `RiskZoneSchema` |

### From `voyagePlannerData.ts`

| TS Interface | Fields | Backend Schema |
|-------------|--------|----------------|
| `Port` | id, name, country, code, lat, lng, variants[] | `VoyagePortSchema` |
| `Vessel` | id, name, type, draft, imo | `VesselSchema` |
| `Waypoint` | lat, lng, name? | `WaypointSchema` |
| `VoyageRouteOption` | id, tag, subtitle, color, from, to, departureUTC, arrivalUTC, distanceNM, avgSOG, sailingTime, fuelMT, fuelCostUSD, euaETS, co2Tons, waypoints[], weatherRisk, ecaTransitNM | `VoyageRouteOptionSchema` |

---

## 3. Endpoint Design

### Auth

| Method | Path | Request | Response | Frontend Consumer |
|--------|------|---------|----------|-------------------|
| POST | `/api/auth/login` | `{email, password}` | `CaptainSchema` | `Login.tsx` |

### Fleet

| Method | Path | Request | Response | Frontend Consumer |
|--------|------|---------|----------|-------------------|
| GET | `/api/fleet/vessels` | — | `FleetVessel[]` | `FleetOverview.tsx` |
| GET | `/api/fleet/vessels/{id}` | — | `FleetVessel` | `RiskAnalysis.tsx` |
| GET | `/api/fleet/vessels/{id}/routes` | — | `[number, number][]` | `FleetOverview.tsx` |
| GET | `/api/fleet/vessels/{id}/smart-options` | — | `SmartOption[]` | `FleetOverview.tsx` |
| GET | `/api/fleet/vessels/{id}/mitigation` | — | `MitigationStrategy[]` | `RiskAnalysis.tsx` |

### Bidding / Canal Transit

| Method | Path | Request | Response | Frontend Consumer |
|--------|------|---------|----------|-------------------|
| GET | `/api/bidding/canals` | — | `CanalPort[]` | `Dashboard.tsx`, `VoyageMap`, `CanalPortCards` |
| GET | `/api/bidding/canals/{id}` | — | `CanalPort` | `BiddingDetail.tsx` |
| GET | `/api/bidding/history` | — | `PreviousBid[]` | `BiddingDetail.tsx` |
| GET | `/api/bidding/factors` | — | `BidFactor[]` | `BiddingDetail.tsx` |
| GET | `/api/bidding/probability` | — | `{bid, probability}[]` | `BiddingDetail.tsx` |

### Voyage Planning

| Method | Path | Request | Response | Frontend Consumer |
|--------|------|---------|----------|-------------------|
| GET | `/api/voyage/ports` | — | `Port[]` | `VoyagePlanner.tsx` |
| GET | `/api/voyage/vessels` | — | `Vessel[]` | `VoyagePlanner.tsx` |
| POST | `/api/voyage/routes` | `{from_port_id, to_port_id, vessel_id}` | `VoyageRouteOption[]` | `VoyagePlanner.tsx` |

### Port Intelligence

| Method | Path | Request | Response | Frontend Consumer |
|--------|------|---------|----------|-------------------|
| GET | `/api/ports` | — | `PortEntry[]` | `PortIntelligence.tsx`, `VoyagePlanner.tsx` |
| GET | `/api/ports/{id}` | — | `PortEntry` | `PortIntelligence.tsx` |
| PUT | `/api/ports/{id}` | `Partial<PortEntry>` | `PortEntry` | `PortIntelligence.tsx` (edit mode) |
| POST | `/api/ports` | `PortEntry` | `PortEntry` | `PortIntelligence.tsx` (add port) |
| GET | `/api/ports/events` | `?port_id=&type=` | `CalendarEvent[]` | `PortIntelligence.tsx`, `VoyagePlanner.tsx` |
| POST | `/api/ports/events` | `CalendarEvent` | `CalendarEvent` | `PortIntelligence.tsx` |
| DELETE | `/api/ports/events/{id}` | — | `204` | `PortIntelligence.tsx` |
| GET | `/api/ports/risk-zones` | — | `RiskZone[]` | `PortIntelligence.tsx` |
| GET | `/api/ports/{id}/risk-score` | — | `{score: number}` | `PortIntelligence.tsx` |

### Chat / AI

| Method | Path | Request | Response | Frontend Consumer |
|--------|------|---------|----------|-------------------|
| POST | `/api/chat/message` | `{message, context?{canalName, bidAmount}}` | `{response: string}` | `AIChatbot.tsx` / `ChatContext` |

### Marine Summary

| Method  | Path | Response | Frontend Consumer |
|---------|------|----------|-------------------|
| GET | `/api/marine/summary` | Aggregated dashboard KPIs | Future / summary widget |

### Health

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/health` | `{status: "ok", version, timestamp}` |

### Route waypoints (captain-specific)

| Method | Path | Response | Frontend Consumer |
|--------|------|----------|-------------------|
| GET | `/api/captain/route-waypoints` | `[number, number][]` | `VoyageMap` component |

---

## 4. Data Ownership

### App-owned data (→ PostgreSQL tables)
- `ports` — editable port records
- `calendar_events` — port events (holidays, strikes, weather)
- `voyages` — saved voyage plans (future feature)
- `user_preferences` — user settings (future)

### External provider data (→ Mock providers, swap to live later)
- Fleet vessel positions & status (AIS provider)
- Canal/port congestion & bidding (canal authority API)
- Weather risk data
- Bid factors & probability models

### Optional cache table
- `provider_cache(provider, key, payload, expires_at)` for caching external responses

---

## 5. Frontend Files → Endpoint Mapping

| Frontend File | Lines | Data Consumed | Backend Endpoint(s) |
|--------------|-------|---------------|---------------------|
| `src/pages/Login.tsx:3,14-20` | captains array, email/password matching | `POST /api/auth/login` |
| `src/pages/Dashboard.tsx:5,88` | Captain from localStorage, canalsPorts | `GET /api/bidding/canals` |
| `src/pages/FleetOverview.tsx:5` | fleetVessels, vesselRoutes | `GET /api/fleet/vessels`, `GET /api/fleet/vessels/{id}/routes` |
| `src/pages/BiddingDetail.tsx:3` | canalsPorts, previousBids, bidFactors | `GET /api/bidding/canals/{id}`, `GET /api/bidding/history`, `GET /api/bidding/factors`, `GET /api/bidding/probability` |
| `src/pages/RiskAnalysis.tsx:5` | fleetVessels, getMitigationStrategies | `GET /api/fleet/vessels/{id}`, `GET /api/fleet/vessels/{id}/mitigation` |
| `src/pages/VoyagePlanner.tsx:6-7` | ports, vessels, generateRouteOptions, portEntries, calendarEvents | `GET /api/voyage/ports`, `GET /api/voyage/vessels`, `POST /api/voyage/routes`, `GET /api/ports`, `GET /api/ports/events` |
| `src/pages/PortIntelligence.tsx:5-9` | portEntries, calendarEvents, riskZones, getPortRiskScore | `GET /api/ports`, `GET/PUT/POST /api/ports/*`, `GET/POST/DELETE /api/ports/events/*`, `GET /api/ports/risk-zones` |
| `src/components/VoyageMap.tsx:4` | canalsPorts, routeWaypoints | `GET /api/bidding/canals`, `GET /api/captain/route-waypoints` |
| `src/components/CanalPortCards.tsx:2` | canalsPorts | `GET /api/bidding/canals` |
| `src/components/ShipInfoPanel.tsx:1` | Captain (prop) | (passed from parent) |
| `src/components/AIChatbot.tsx` | internal state, canalName/bidAmount props | `POST /api/chat/message` |
| `src/contexts/ChatContext.tsx:2` | getAIResponse, ChatMessage | `POST /api/chat/message` |
