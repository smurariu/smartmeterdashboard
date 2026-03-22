# SmartMeter Dashboard

Real-time P1 smart meter dashboard built with **Node.js + Socket.IO + Tabler UI**.
Polls your meter's HTTP JSON endpoint and streams live data to all connected browsers.

## Features
- Live power gauge (animated arc)
- Electricity import T1 / T2 breakdown
- Gas meter with timestamp
- Historical sparkline charts (last 60 samples)
- WiFi signal bars
- Power event counters
- Active tariff indicator

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set your meter URL and start
DATA_URL=http://192.168.1.1/api/v1/data node server.js

# Open http://localhost:3000
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATA_URL` | `http://192.168.1.1/api/v1/data` | Your meter HTTP endpoint |
| `PORT` | `3000` | HTTP server port |
| `POLL_INTERVAL` | `5000` | Poll interval in milliseconds |

## Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --production
ENV DATA_URL=http://192.168.1.1/api/v1/data
EXPOSE 3000
CMD ["node", "server.js"]
```

## Project Structure

```
smartmeter-dash/
├── server.js          # Express + Socket.IO server, polls meter
├── public/
│   └── index.html     # Full dashboard (Tabler + Chart.js + Socket.IO client)
└── package.json
```

## Compatible Meters
Any P1/DSMR meter that exposes JSON over HTTP — tested with **ISKRA 2M550E** and similar.
