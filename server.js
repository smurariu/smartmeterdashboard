/**
 * SmartMeter Dashboard Server
 * - Polls your HTTP data source every 5s
 * - Broadcasts updates via Socket.IO
 * - Serves the dashboard HTML
 *
 * Usage:
 *   npm install express socket.io node-fetch
 *   DATA_URL=http://your-meter-ip/api/v1/data node server.js
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// ── Config ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const DATA_URL = process.env.DATA_URL || "http://192.168.178.38/api/v1/data"; // ← change this
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL || "500", 10);

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// Keep last known state so new clients get data immediately on connect
let lastData = null;
const history = {
  timestamps: [],
  power: [],
  t1: [],
  t2: [],
};
const HISTORY_MAX = 60; // keep last 60 samples

// ── Polling ───────────────────────────────────────────────────────────────────
async function fetchData() {
  try {
    // Dynamic import for node-fetch (ESM) or fallback to require
    let fetchFn;
    try {
      fetchFn = require("node-fetch");
    } catch {
      const mod = await import("node-fetch");
      fetchFn = mod.default;
    }

    const res = await fetchFn(DATA_URL, { timeout: 4000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Append to history
    const now = new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    history.timestamps.push(now);
    history.power.push(data.active_power_w ?? 0);
    history.t1.push(data.total_power_import_t1_kwh ?? 0);
    history.t2.push(data.total_power_import_t2_kwh ?? 0);

    if (history.timestamps.length > HISTORY_MAX) {
      history.timestamps.shift();
      history.power.shift();
      history.t1.shift();
      history.t2.shift();
    }

    lastData = data;
    io.emit("meter:update", { data, history });
  } catch (err) {
    console.error("[poll]", err.message);
    io.emit("meter:error", { message: err.message });
  }
}

// ── Socket.IO ─────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("[ws] client connected:", socket.id);
  if (lastData) socket.emit("meter:update", { data: lastData, history });
  socket.on("disconnect", () => console.log("[ws] client disconnected:", socket.id));
});

// ── Start ─────────────────────────────────────────────────────────────────────
fetchData();
setInterval(fetchData, POLL_INTERVAL_MS);

server.listen(PORT, () => {
  console.log(`SmartMeter Dashboard running → http://localhost:${PORT}`);
  console.log(`Polling ${DATA_URL} every ${POLL_INTERVAL_MS}ms`);
});
