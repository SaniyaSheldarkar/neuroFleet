# NeuroFleetX – AI-Driven Urban Mobility Optimization System

> Full-stack college demo project | React 19 + Spring Boot + Flask + MySQL

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 19, Tailwind CSS, Recharts        |
| Backend    | Spring Boot 3.2 (Java 17), JWT, WebSocket |
| Database   | MySQL 8                                 |
| AI Service | Python 3.10+, Flask                     |
| Maps       | Canvas-based simulation (Leaflet-ready) |
| Auth       | JWT Role-based (Admin/Manager/Driver/Customer) |

---

## Folder Structure

```
neurofleetx/
├── frontend/                  # React 19 app
│   ├── public/index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.js / index.css
│   │   ├── context/AuthContext.jsx
│   │   ├── utils/api.js
│   │   ├── components/Layout.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── DashboardPage.jsx
│   │       ├── FleetPage.jsx
│   │       ├── MapPage.jsx
│   │       ├── BookingPage.jsx
│   │       ├── RoutePage.jsx
│   │       └── MaintenancePage.jsx
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                   # Spring Boot app
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/neurofleetx/
│       │   ├── NeuroFleetXApplication.java
│       │   ├── config/  (SecurityConfig, WebSocketConfig)
│       │   ├── controller/ (Auth, Vehicle, Booking, Maintenance, Telemetry, Analytics)
│       │   ├── dto/     (AuthRequest, AuthResponse, RegisterRequest)
│       │   ├── entity/  (User, Vehicle, Booking, MaintenanceAlert)
│       │   ├── repository/ (JPA repos)
│       │   ├── security/   (JwtUtil, JwtAuthFilter)
│       │   └── service/    (UserDetailsServiceImpl)
│       └── resources/application.properties
│
├── ai-service/                # Flask AI microservice
│   ├── app.py                 # Dijkstra + vehicle recommendation
│   └── requirements.txt
│
└── database/
    └── schema.sql             # Full MySQL schema + seed data
```

---

## Quick Start

### Prerequisites
- Node.js 18+, npm
- Java 17+, Maven
- Python 3.10+, pip
- MySQL 8 running locally

---

### 1. Database Setup

```bash
mysql -u root -p < database/schema.sql
```

> This creates `neurofleetx` DB, all tables, and demo seed data.
> Default password for all demo users: **password123**

---

### 2. Backend (Spring Boot)

```bash
cd backend

# Edit src/main/resources/application.properties:
# spring.datasource.password=YOUR_MYSQL_PASSWORD

mvn clean install -DskipTests
mvn spring-boot:run
```

Backend runs on **http://localhost:8080**

#### Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@neurofleetx.com | password123 | ADMIN |
| manager@neurofleetx.com | password123 | FLEET_MANAGER |
| driver@neurofleetx.com | password123 | DRIVER |
| customer@neurofleetx.com | password123 | CUSTOMER |

---

### 3. AI Service (Flask)

```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

AI service runs on **http://localhost:5000**

#### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/optimize-route` | Dijkstra route with traffic weights |
| POST | `/recommend-vehicle` | AI vehicle recommendation |
| GET  | `/health` | Service health check |

---

### 4. Frontend (React)

```bash
cd frontend
npm install
npm start
```

Frontend runs on **http://localhost:3000**

> The app works fully with **fallback demo data** if the backend/AI service is not running — ideal for demo purposes.

---

## Features

### ✅ Authentication
- JWT login/register with role-based dashboards
- Demo login buttons on the login page

### ✅ Fleet Management
- Add/Edit/Delete vehicles
- Status management: Available / In Use / Maintenance
- Per-vehicle health bars (engine, tyres, fuel/battery)

### ✅ Live Map
- Canvas-animated real-time vehicle tracking
- IN_USE vehicles move every 2 seconds (simulated telemetry)
- Click vehicle to see details
- WebSocket `/topic/vehicles` for backend push

### ✅ AI Route Optimisation
- Dijkstra algorithm over simulated city graph (12 nodes)
- Traffic-weighted edges (random 1.0–2.5× multiplier)
- Best + Alternate routes with ETA, distance, path
- AI tips panel

### ✅ Predictive Maintenance
- Circular health gauges per vehicle
- Time-series line chart (engine, tyres, battery, fuel)
- Alert table with severity badges
- One-click health check → auto-generates alerts if thresholds crossed

### ✅ Booking System
- AI vehicle recommender (passengers, distance, EV preference)
- Full booking form with datetime picker
- Status management (Pending → Confirmed → In Progress → Completed)
- Fare auto-calculated

### ✅ Admin Dashboard
- KPI cards (total vehicles, active trips, revenue, bookings)
- Trips-per-hour area chart
- Weekly revenue bar chart
- Vehicle utilisation horizontal bar chart

---

## WebSocket (Real-Time)

Backend publishes to:
- `/topic/telemetry` — per-vehicle telemetry every 3s
- `/topic/vehicles`  — all vehicles array every 3s

Frontend connects via SockJS + STOMP at `http://localhost:8080/ws`

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login |
| POST | `/api/auth/register` | ❌ | Register |
| GET | `/api/vehicles` | ✅ | List all vehicles |
| POST | `/api/vehicles` | ADMIN/MANAGER | Create vehicle |
| PUT | `/api/vehicles/{id}` | ADMIN/MANAGER | Update vehicle |
| DELETE | `/api/vehicles/{id}` | ADMIN | Delete vehicle |
| GET | `/api/bookings` | ✅ | All bookings |
| POST | `/api/bookings` | ✅ | Create booking |
| GET | `/api/maintenance/alerts/active` | ✅ | Active alerts |
| POST | `/api/maintenance/check/{id}` | ✅ | Run health check |
| GET | `/api/analytics/kpis` | ✅ | Dashboard KPIs |
| GET | `/api/telemetry/all` | ✅ | All vehicle telemetry |

---

## Notes for Demo

1. Run all 3 services simultaneously for full integration
2. The frontend shows **fallback demo data** when backend is offline
3. Vehicle positions update live on the map without needing WebSocket
4. Use the demo account buttons on the login screen for quick role switching
5. Run `POST /api/maintenance/check/{vehicleId}` (e.g. vehicle 4) to trigger alerts
