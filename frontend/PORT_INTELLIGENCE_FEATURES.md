# Port Intelligence — Feature List & Real-Data Integration Guide

> **Scope:** Frontend only (`frontend/src/pages/PortIntelligence.tsx` and `frontend/src/data/portIntelligenceData.ts`).  
> This document maps every piece of static mock data in the Port Intelligence section to production-grade real-time data sources, along with the full request/response schemas needed to make the integration happen.

---

## Table of Contents

1. [Port Intelligence Overview](#1-port-intelligence-overview)
2. [Tab 1 — Port Data](#2-tab-1--port-data)
3. [Tab 2 — Risk Calendar](#3-tab-2--risk-calendar)
4. [Tab 3 — Analytics](#4-tab-3--analytics)
5. [Tab 4 — Risk Zones](#5-tab-4--risk-zones)
6. [Cross-Cutting Concerns](#6-cross-cutting-concerns)
7. [Recommended Integration Architecture](#7-recommended-integration-architecture)

---

## 1. Port Intelligence Overview

The Port Intelligence page (`/port-intelligence`) is divided into four tabs:

| Tab | Key Content | Current State |
|-----|-------------|---------------|
| **Port Data** | Port profiles, berth/anchorage costs, equipment availability, congestion level | 100 % static mock data |
| **Risk Calendar** | Holidays, weather events, strikes, war-risk alerts, customs delays | 100 % static mock data |
| **Analytics** | Cost comparison charts, congestion bar charts, risk-score rankings | Derived from static port data |
| **Risk Zones** | Active war-risk and piracy maritime zones | 100 % static mock data |

**Goal:** Replace all static data with real-time data from external APIs so the platform is production-ready and trustworthy for commercial maritime operations.

---

## 2. Tab 1 — Port Data

### 2.1 Features

| # | Feature | Current Behaviour | Target (Production) |
|---|---------|-------------------|---------------------|
| P1 | Search ports by name / country / UNLOCODE | Filters static list | Searches real port database |
| P2 | View anchorage & berth costs per port | Hardcoded USD values | Live tariff data from port authority / commercial API |
| P3 | View equipment availability (cranes, forklifts, trucks …) | Hardcoded unit counts | Real-time equipment availability feed from port operator |
| P4 | View estimated cargo-handling time | Hardcoded hours | Average derived from recent historical AIS dwell-time data |
| P5 | View congestion level (Low / Moderate / High / Critical) | Hardcoded label | Computed from live vessel-queue count via AIS API |
| P6 | Edit port data (port_employee role) | Saves to component state (lost on refresh) | PATCH to backend REST API → persisted in database |
| P7 | Add new port | Saves to component state | POST to backend API |
| P8 | Risk score per port | Computed from static events | Computed server-side from live event feed |

### 2.2 Data Fields Required (per Port)

```typescript
interface PortEntry {
  id: string;                    // UNLOCODE e.g. "NLRTM"
  name: string;                  // "Rotterdam"
  country: string;               // "Netherlands"
  region: string;                // "Europe - North"
  code: string;                  // UNLOCODE
  lat: number;
  lng: number;
  anchorageCostPerDay: number;   // USD
  berthCostPerHour: number;      // USD
  equipment: EquipmentItem[];
  estimatedHandlingTimeHrs: number;
  congestionLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  lastUpdatedBy: string;
  lastUpdatedAt: string;         // ISO 8601
}

interface EquipmentItem {
  type: 'Crane' | 'Forklift' | 'Truck' | 'Reach Stacker' | 'Straddle Carrier';
  totalUnits: number;
  availableUnits: number;
  status: 'Operational' | 'Partial' | 'Under Maintenance';
  hireRatePerHour: number;       // USD
}
```

### 2.3 Real Data Sources

#### A. Port Congestion — MarineTraffic API

| Property | Value |
|----------|-------|
| **Provider** | MarineTraffic |
| **URL** | `https://services.marinetraffic.com/api/` |
| **Cost** | Paid — credits-based; ~$0.001–$0.005 per call. Free tier limited to 1 000 credits/month. |
| **Best For** | Vessel positions, port congestion (vessel queue count), AIS data |
| **Auth** | API key (`APIKEY` query parameter) |
| **Docs** | https://www.marinetraffic.com/en/ais-api-services |

**Request — Expected Arrivals at a Port:**

```
GET https://services.marinetraffic.com/api/expectedarrivals/v:8/{APIKEY}
    ?portid=1&timespan=24&protocol=json
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `portid` | integer | MarineTraffic internal port ID |
| `timespan` | integer | Hours ahead to query (e.g. 24) |
| `protocol` | string | `json` or `csv` |

**Response (abbreviated):**

```json
{
  "DATA": [
    {
      "MMSI": "244650492",
      "IMO": "9832741",
      "SHIP_NAME": "MV ATLANTIC STAR",
      "SHIPTYPE": 70,
      "ETA": "2026-03-06T08:00:00",
      "DESTINATION": "NLRTM",
      "DRAUGHT": 12.8,
      "SPEED": 14.2
    }
  ]
}
```

> **Congestion derivation:** Count vessels in the `DATA` array to compute queue length, then map to Low / Moderate / High / Critical thresholds (e.g. <5 = Low, 5–15 = Moderate, 15–25 = High, >25 = Critical).

---

#### B. Port Costs & Tariffs — PortCalls API / Portcast

| Property | Value |
|----------|-------|
| **Provider** | Portcast (portcast.io) |
| **URL** | `https://api.portcast.io/` |
| **Cost** | Paid — contact for enterprise pricing. 14-day free trial available. |
| **Best For** | Port call data, ETA predictions, berth schedules |
| **Auth** | Bearer token (`Authorization: Bearer <token>`) |
| **Docs** | https://portcast.io/api-docs |

> **Note:** Berth/anchorage tariffs are generally **not available** via open APIs — they are published in port authority tariff schedules (PDFs). For production, the recommended approach is to seed the backend database from tariff documents and update them manually or via a scraping pipeline when port authorities publish new rates. The frontend edit feature (port_employee role) provides a manual update interface for this purpose.

**Alternative (free, limited): UN/LOCODE database**

- **URL:** https://unece.org/trade/uncefact/unlocode-0  
- **Cost:** Free  
- **Format:** CSV download (not a live API)  
- **Use:** Seed port name, country, region, and coordinates.

**Request — Portcast Port Call History:**

```
GET https://api.portcast.io/v1/port-calls
    ?port_unlocode=NLRTM&date_from=2026-02-01&date_to=2026-03-01
Authorization: Bearer <token>
```

**Response (abbreviated):**

```json
{
  "port_calls": [
    {
      "vessel_imo": "9832741",
      "vessel_name": "MV Atlantic Star",
      "port_unlocode": "NLRTM",
      "arrival_time": "2026-02-20T06:14:00Z",
      "departure_time": "2026-02-20T22:30:00Z",
      "berth_name": "ECT Delta Terminal",
      "handling_hours": 16.3
    }
  ],
  "total": 142
}
```

> **Handling time derivation:** Average `handling_hours` across recent port calls to replace the static `estimatedHandlingTimeHrs`.

---

#### C. Equipment Availability — Port Operator APIs (Custom / Internal)

> There is **no universal public API** for port equipment availability. In a production system, this data comes from the Port Management Information System (PMIS) of each terminal operator.

**Options:**

| Option | Description | Cost |
|--------|-------------|------|
| **Terminal operator PMIS integration** | PSA (Singapore), Eurogate (Hamburg), APM Terminals — each exposes proprietary APIs to contracted partners | Enterprise / partner agreement |
| **Manual data entry (current approach)** | Port employees update via the in-app edit form | Free — already implemented |
| **IoT / sensor data** | Crane and equipment telematics providers (e.g. Liebherr, Konecranes) expose operational APIs | Hardware + software licensing |

**Recommended for MVP:** Keep the manual edit-form approach but add a backend persistence layer so data is not lost on page refresh.

---

### 2.4 API Request/Response Schema — Internal Backend (recommended)

When the backend is ready, the frontend should consume an internal REST API rather than calling external APIs directly.

**GET /api/ports**

```
GET /api/ports?search=rotterdam&region=Europe

Response 200:
{
  "ports": [
    {
      "id": "NLRTM",
      "name": "Rotterdam",
      "country": "Netherlands",
      "region": "Europe - North",
      "code": "NLRTM",
      "lat": 51.9,
      "lng": 4.5,
      "anchorageCostPerDay": 1200,
      "berthCostPerHour": 85,
      "equipment": [
        {
          "type": "Crane",
          "totalUnits": 12,
          "availableUnits": 9,
          "status": "Operational",
          "hireRatePerHour": 350
        }
      ],
      "estimatedHandlingTimeHrs": 18,
      "congestionLevel": "Moderate",
      "lastUpdatedBy": "P. van Dijk",
      "lastUpdatedAt": "2026-02-25T14:30:00Z"
    }
  ],
  "total": 1
}
```

**PATCH /api/ports/:id**

```
PATCH /api/ports/NLRTM
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "anchorageCostPerDay": 1250,
  "berthCostPerHour": 90,
  "congestionLevel": "High"
}

Response 200:
{
  "id": "NLRTM",
  "anchorageCostPerDay": 1250,
  "berthCostPerHour": 90,
  "congestionLevel": "High",
  "lastUpdatedBy": "P. van Dijk",
  "lastUpdatedAt": "2026-03-05T09:00:00Z"
}
```

---

## 3. Tab 2 — Risk Calendar

### 3.1 Features

| # | Feature | Current Behaviour | Target (Production) |
|---|---------|-------------------|---------------------|
| C1 | Display port-specific and global risk events | Static list of 10 hardcoded events | Live events fetched from weather, maritime alert, and public holiday APIs |
| C2 | Filter events by type (holiday / weather / strike / war_risk / customs_delay) | Filters static list | Filters live data |
| C3 | Event detail view (expand card) | Shows hardcoded detail text | Shows live advisory text from source API |
| C4 | Add new event (port_employee role) | Saves to component state | POST to backend, persisted in database |
| C5 | Delete event (port_employee role) | Removes from component state | DELETE to backend |
| C6 | Severity badge (Low / Moderate / High / Critical) | Hardcoded | Derived from API alert level |

### 3.2 Data Fields Required (per Calendar Event)

```typescript
interface CalendarEvent {
  id: string;
  type: 'holiday' | 'weather' | 'strike' | 'war_risk' | 'customs_delay';
  title: string;
  description: string;
  detail: string;
  portId: string | null;    // null = global / multi-port
  region: string;
  startDate: string;        // ISO date "YYYY-MM-DD"
  endDate: string;          // ISO date "YYYY-MM-DD"
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
}
```

### 3.3 Real Data Sources

#### A. Public Holidays — Nager.Date API

| Property | Value |
|----------|-------|
| **Provider** | Nager.Date |
| **URL** | `https://date.nager.at/api/v3/` |
| **Cost** | **Free** — open source, no API key required |
| **Coverage** | 100+ countries |
| **Docs** | https://date.nager.at/Api |

**Request:**

```
GET https://date.nager.at/api/v3/PublicHolidays/2026/NL
```

**Response:**

```json
[
  {
    "date": "2026-04-05",
    "localName": "Eerste paasdag",
    "name": "Easter Sunday",
    "countryCode": "NL",
    "fixed": false,
    "global": true,
    "counties": null,
    "launchYear": null,
    "types": ["Public"]
  }
]
```

**Mapping to `CalendarEvent`:**

| CalendarEvent field | Source field |
|---------------------|--------------|
| `type` | `"holiday"` (constant) |
| `title` | `name` |
| `description` | `"Public holiday in " + countryCode` |
| `detail` | Custom message about port slowdown |
| `portId` | Mapped from `countryCode` to port ID |
| `startDate` | `date` |
| `endDate` | `date` |
| `severity` | `"Low"` (default for holidays) |

---

#### B. Weather Warnings — OpenWeatherMap API

| Property | Value |
|----------|-------|
| **Provider** | OpenWeatherMap |
| **URL** | `https://api.openweathermap.org/data/3.0/` |
| **Cost** | Free up to 1 000 calls/day. Paid plans from $40/month for higher limits and One Call API 3.0. |
| **Auth** | API key (`appid` query parameter) |
| **Docs** | https://openweathermap.org/api |

**Request — One Call API (weather alerts near a port):**

```
GET https://api.openweathermap.org/data/3.0/onecall
    ?lat=51.9&lon=4.5&exclude=minutely,hourly,daily,current&appid={API_KEY}&units=metric
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `lat` | float | Port latitude |
| `lon` | float | Port longitude |
| `exclude` | string | Comma-separated parts to exclude |
| `appid` | string | API key |
| `units` | string | `metric` or `imperial` |

**Response (alerts section):**

```json
{
  "alerts": [
    {
      "sender_name": "NWS Philadelphia - Mount Holly",
      "event": "Cyclone Warning",
      "start": 1741564800,
      "end": 1741737600,
      "description": "Category 2 cyclone expected. Sustained winds 95kt. Storm surge up to 3m.",
      "tags": ["Tropical"]
    }
  ]
}
```

**Mapping to `CalendarEvent`:**

| CalendarEvent field | Source field |
|---------------------|--------------|
| `type` | `"weather"` |
| `title` | `event` |
| `description` | First 100 chars of `description` |
| `detail` | Full `description` |
| `portId` | Port ID matching the queried `lat`/`lon` |
| `startDate` | `new Date(start * 1000).toISOString().slice(0,10)` |
| `endDate` | `new Date(end * 1000).toISOString().slice(0,10)` |
| `severity` | Derived from wind speed: <34kt=Low, 34-64kt=Moderate, 64-96kt=High, >96kt=Critical |

---

#### C. Maritime Weather — Stormglass API

| Property | Value |
|----------|-------|
| **Provider** | Stormglass.io |
| **URL** | `https://api.stormglass.io/v2/` |
| **Cost** | Free up to 10 daily requests. Paid from $29/month. |
| **Auth** | `Authorization: <API_KEY>` header |
| **Docs** | https://docs.stormglass.io |

**Request — Weather Forecast for Port Coordinates:**

```
GET https://api.stormglass.io/v2/weather/point
    ?lat=51.9&lng=4.5&params=waveHeight,windSpeed,swellHeight&start=2026-03-05T00:00:00Z&end=2026-03-08T00:00:00Z
Authorization: <API_KEY>
```

**Response (abbreviated):**

```json
{
  "hours": [
    {
      "time": "2026-03-05T00:00:00+00:00",
      "waveHeight": { "sg": 1.8 },
      "windSpeed": { "sg": 14.2 },
      "swellHeight": { "sg": 2.1 }
    }
  ]
}
```

---

#### D. Maritime Advisories & War Risk — UKMTO / MARAD Advisories (via scraping or RSS)

| Property | Value |
|----------|-------|
| **Provider** | US Maritime Administration (MARAD) |
| **URL** | https://www.maritime.dot.gov/msci |
| **Cost** | **Free** |
| **Format** | RSS feed and HTML advisories — no REST API |
| **Auth** | None |

| Property | Value |
|----------|-------|
| **Provider** | UK Maritime Trade Operations (UKMTO) |
| **URL** | https://www.ukmto.org |
| **Cost** | **Free** |
| **Format** | PDF reports and email distribution list |

| Property | Value |
|----------|-------|
| **Provider** | MAST (Maritime & Aerospace Security Tracking) |
| **URL** | https://www.maritime-awareness.co.uk |
| **Cost** | Paid — enterprise subscription |
| **Format** | REST API + GeoJSON |

**MARAD RSS Feed Request:**

```
GET https://www.maritime.dot.gov/msci/rss.xml
```

**Response (RSS item):**

```xml
<item>
  <title>MARAD 2026-005 — Red Sea / Gulf of Aden — Houthi Threat</title>
  <link>https://www.maritime.dot.gov/msci/2026-005</link>
  <pubDate>Fri, 01 Jan 2026 00:00:00 +0000</pubDate>
  <description>
    JWC has maintained the Red Sea / Gulf of Aden as a Listed Area.
    War risk insurance premiums remain elevated. Recommend Cape of Good Hope routing.
  </description>
</item>
```

**Mapping to `CalendarEvent`:**

| CalendarEvent field | Source field |
|---------------------|--------------|
| `type` | `"war_risk"` |
| `title` | RSS `<title>` |
| `description` | First 120 chars of `<description>` |
| `detail` | Full `<description>` |
| `portId` | `null` (global) |
| `region` | Parsed from title |
| `startDate` | `<pubDate>` converted to `YYYY-MM-DD` |
| `endDate` | Unknown — default to 90 days from start |
| `severity` | `"Critical"` for war risk zones |

---

#### E. Strike & Labour Action News — GDelt Project (free) or NewsAPI

| Property | Value |
|----------|-------|
| **Provider** | GDelt Project |
| **URL** | `https://api.gdeltproject.org/api/v2/doc/doc` |
| **Cost** | **Free** |
| **Auth** | None |
| **Docs** | https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/ |

**Request:**

```
GET https://api.gdeltproject.org/api/v2/doc/doc
    ?query=port+strike+dock+workers&mode=ArtList&maxrecords=25&format=json
    &startdatetime=20260301000000&enddatetime=20260310000000
```

**Response:**

```json
{
  "articles": [
    {
      "url": "https://...",
      "title": "Santos Dock Workers Launch 72-Hour Strike",
      "seendate": "20260302120000",
      "domain": "reuters.com",
      "language": "English",
      "sourcecountry": "Brazil"
    }
  ]
}
```

> **Note:** GDelt provides links only — editorial extraction of `description` and `detail` requires summarising article content (e.g. using an LLM call to the AI backend already in the app).

---

#### F. Customs Delays — European Union TARIC API

| Property | Value |
|----------|-------|
| **Provider** | European Commission — TAXUD |
| **URL** | `https://ec.europa.eu/taxation_customs/dds2/taric/` |
| **Cost** | **Free** |
| **Format** | XML API |
| **Auth** | None |
| **Docs** | https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp |

> For general customs delay alerts (not EU-specific), no universal free API exists. The recommended approach is:
> 1. Subscribe to port authority email/RSS alerts for customs announcements.
> 2. Allow port employees to manually add customs delay events via the existing in-app form.

---

## 4. Tab 3 — Analytics

### 4.1 Features

| # | Feature | Current Behaviour | Target (Production) |
|---|---------|-------------------|---------------------|
| A1 | Port Cost Comparison bar chart (anchorage, berth, equipment) | Rendered from static port data | Rendered from live `/api/ports` data |
| A2 | Port Congestion Level cards | Rendered from static congestion field | Updated from live AIS vessel-queue data |
| A3 | Port Risk Score bar chart | Computed from static events | Computed server-side from live events |
| A4 | Equipment Bottleneck Alerts | Computed from static equipment data | Computed from live equipment data |
| A5 | Recommended / Avoid port lists | Derived from static risk scores | Derived from live risk scores |

### 4.2 Data Derivation Logic

All analytics data is **derived** from Port Data (Tab 1) and Risk Calendar (Tab 2). No additional external APIs are needed — once those two tabs consume live data, the analytics will automatically reflect real-world conditions.

#### Risk Score Computation (current algorithm — keep in production)

```typescript
function getPortRiskScore(portId: string): number {
  const events = calendarEvents.filter(e => e.portId === portId || e.portId === null);
  let score = 0;
  events.forEach(e => {
    if (e.severity === 'Critical') score += 30;
    else if (e.severity === 'High') score += 20;
    else if (e.severity === 'Moderate') score += 10;
    else score += 5;
  });
  const port = portEntries.find(p => p.id === portId);
  if (port) {
    if (port.congestionLevel === 'Critical') score += 25;
    else if (port.congestionLevel === 'High') score += 15;
    else if (port.congestionLevel === 'Moderate') score += 8;
  }
  return Math.min(score, 100);
}
```

**Recommendation:** Move this computation to the backend so it runs on server-fetched live data and is returned via `/api/ports/:id/risk-score`.

---

## 5. Tab 4 — Risk Zones

### 5.1 Features

| # | Feature | Current Behaviour | Target (Production) |
|---|---------|-------------------|---------------------|
| R1 | Display active war-risk zones | 4 hardcoded zones | Live zones from maritime security API |
| R2 | Display active risk advisories (war + critical events) | Filtered from static calendar events | Live from advisory API + live calendar events |
| R3 | Severity badge and region tag | Hardcoded | From API response |

### 5.2 Data Fields Required (per Risk Zone)

```typescript
interface RiskZone {
  id: string;
  name: string;
  type: 'war_risk' | 'piracy' | 'restricted';
  region: string;
  severity: 'High' | 'Critical';
  description: string;
  active: boolean;
}
```

### 5.3 Real Data Sources

#### A. Piracy & Armed Robbery — IMB Piracy Reporting Centre

| Property | Value |
|----------|-------|
| **Provider** | ICC International Maritime Bureau (IMB) |
| **URL** | https://www.icc-ccs.org/piracy-reporting-centre |
| **Cost** | **Free** (reports available as PDFs and via email subscription) |
| **Format** | No REST API — PDF quarterly reports and live incident map |
| **Recommended Integration** | Parse weekly PDF report via document-extraction service |

**Incident data structure (from IMB PDF):**

```
Date: 2026-02-14
Position: 04°00'N 002°00'E (Gulf of Guinea)
Vessel: Bulk Carrier
Incident Type: Armed Robbery
Details: Pirates boarded vessel, stole ship's cash and crew valuables.
```

**Mapping to `RiskZone`:**

| RiskZone field | Source |
|----------------|--------|
| `type` | `"piracy"` for armed robbery/piracy incidents |
| `region` | Parsed position description |
| `severity` | `"High"` for armed robbery, `"Critical"` for crew taken |
| `description` | `Details` field |
| `active` | `true` if incident within last 30 days |

---

#### B. War Risk Zones — JWC Listed Areas

| Property | Value |
|----------|-------|
| **Provider** | Lloyd's Market Association / Joint War Committee (JWC) |
| **URL** | https://www.lmalloyds.com/LMA/Market_Operations/Marine_Joint_War_Committee/Marine_Joint_War_Committee.aspx |
| **Cost** | **Free** (published PDF) |
| **Format** | PDF document listing — no REST API |
| **Recommended Integration** | PDF parsing + manual seeding into backend database |

**Current JWC Listed Areas (as of 2026):**
- Red Sea / Gulf of Aden
- Black Sea (Western)
- Strait of Hormuz
- Gulf of Guinea

> **Note:** The JWC updates its list roughly quarterly or following major geopolitical events. A backend cron job can check for PDF updates and parse new areas.

---

#### C. Comprehensive Maritime Threat Data — Dryad Global API

| Property | Value |
|----------|-------|
| **Provider** | Dryad Global |
| **URL** | https://dryadglobal.com |
| **Cost** | Paid — enterprise pricing |
| **Format** | REST API + GeoJSON polygons |
| **Auth** | API key |
| **Docs** | Contact vendor |

**Request — Active Risk Zones:**

```
GET https://api.dryadglobal.com/v1/risk-zones?active=true
Authorization: ApiKey <key>
```

**Response:**

```json
{
  "risk_zones": [
    {
      "id": "dg-rz-001",
      "name": "Red Sea / Gulf of Aden",
      "threat_type": "war_risk",
      "region": "Middle East",
      "severity": "Critical",
      "description": "Ongoing Houthi attacks on commercial shipping. JWC listed area.",
      "active": true,
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[43.0, 12.0], [45.0, 12.0], [45.0, 15.0], [43.0, 15.0], [43.0, 12.0]]]
      },
      "updated_at": "2026-03-01T00:00:00Z"
    }
  ]
}
```

**Mapping to `RiskZone`:**

| RiskZone field | Source field |
|----------------|-------------|
| `id` | `id` |
| `name` | `name` |
| `type` | `threat_type` |
| `region` | `region` |
| `severity` | `severity` |
| `description` | `description` |
| `active` | `active` |

---

#### D. Free Alternative — ACLED (Armed Conflict Location & Event Data)

| Property | Value |
|----------|-------|
| **Provider** | ACLED |
| **URL** | `https://api.acleddata.com/acled/read` |
| **Cost** | **Free** for academic and non-commercial use; paid for commercial use |
| **Auth** | API key + email |
| **Docs** | https://apidocs.acleddata.com |

**Request:**

```
GET https://api.acleddata.com/acled/read
    ?key=<API_KEY>&email=<EMAIL>&region=Middle+East&event_type=Battles&limit=50&fields=event_date|event_type|location|latitude|longitude|notes
```

**Response:**

```json
{
  "status": 200,
  "count": 50,
  "data": [
    {
      "event_date": "2026-03-01",
      "event_type": "Battles",
      "location": "Red Sea",
      "latitude": "14.5",
      "longitude": "43.2",
      "notes": "Houthi forces launched drone attack on commercial vessel."
    }
  ]
}
```

---

## 6. Cross-Cutting Concerns

### 6.1 API Cost Summary

| Section | API Provider | Tier | Est. Monthly Cost |
|---------|-------------|------|-------------------|
| Port Congestion | MarineTraffic | Paid | $50–$500/month (credits) |
| Port ETA / Handling Time | Portcast | Paid | Contact vendor |
| Port Coordinates | UN/LOCODE | Free | $0 |
| Weather Alerts | OpenWeatherMap One Call API | Free (up to 1k calls/day) | $0–$40/month |
| Marine Weather | Stormglass | Free (10 req/day) / Paid | $0–$29/month |
| Public Holidays | Nager.Date | Free | $0 |
| Strike News | GDelt Project | Free | $0 |
| War Risk Zones | MARAD RSS | Free | $0 |
| Piracy Reports | IMB | Free (PDF parsing) | $0 + dev time |
| Maritime Risk Zones | Dryad Global | Paid | Enterprise |
| Conflict Data | ACLED | Free (non-commercial) | $0 |
| EU Customs Delays | EC TARIC | Free | $0 |

**Estimated minimum viable production cost:** ~$50–$100/month (MarineTraffic + OpenWeatherMap).

### 6.2 Caching Strategy

All external API calls should be cached by the backend to avoid hitting rate limits and to keep the UI fast:

| Data Type | Recommended Cache TTL |
|-----------|----------------------|
| Port congestion (vessel queue) | 15 minutes |
| Weather alerts | 1 hour |
| Public holidays | 24 hours (pre-seeded annually) |
| War risk zones | 6 hours |
| Piracy incidents | 6 hours |
| Port tariffs / costs | 7 days |

### 6.3 Data Flow Architecture

```
External APIs
     │
     ▼
Backend Cron Jobs (scheduled data fetchers)
     │
     ▼
PostgreSQL / MongoDB (cached + enriched data)
     │
     ▼
Backend REST API  (/api/ports, /api/events, /api/risk-zones)
     │
     ▼
Frontend (PortIntelligence.tsx) — replaces static imports with API calls
```

### 6.4 Error States

The frontend should handle the following error states gracefully:

| Scenario | Recommended UI Behaviour |
|----------|--------------------------|
| API unavailable | Show last-cached data with a "Data may be outdated" banner |
| Empty result set | Show "No data available for this region" placeholder |
| API rate limit exceeded | Serve cached data; log alert for ops team |
| Network timeout | Retry up to 3 times with exponential backoff |

---

## 7. Recommended Integration Architecture

### Phase 1 — Backend Persistence (Immediate Priority)

Replace in-memory state with database-backed API calls so that:
- Port edits by `port_employee` role are persisted across sessions.
- Added / deleted events are persisted.
- Endpoints: `GET /api/ports`, `PATCH /api/ports/:id`, `GET /api/events`, `POST /api/events`, `DELETE /api/events/:id`.

### Phase 2 — Free API Integration

Integrate the zero-cost data sources first to validate the integration pattern:
1. **Nager.Date** → auto-populate holiday events for all port countries.
2. **MARAD RSS** → auto-populate war-risk events.
3. **OpenWeatherMap** → auto-populate weather alerts for each port's coordinates.

### Phase 3 — Paid API Integration

Add MarineTraffic for real-time congestion after Phase 2 is stable.

### Phase 4 — Full Risk Zone Map

Replace the static `riskZones` array with a live feed from Dryad Global or a parsed IMB report, and render zones as GeoJSON polygons on a Leaflet/MapLibre map overlay.

---

*Document generated: 2026-03-05 | Covers: `frontend/src/pages/PortIntelligence.tsx`, `frontend/src/data/portIntelligenceData.ts`*
