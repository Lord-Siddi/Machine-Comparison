// backend/server.js
//
// Minimal standalone server for this PoC. If you already have an Express
// app, just `app.use(require('./compareRoute'))` there instead of running
// this file.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compareRoute = require("./compareRoute");

const app = express();

// 1. Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 2. Timeout middleware (60s)
app.use((req, res, next) => {
  res.setTimeout(60000, () => {
    console.error(`[TIMEOUT] Request timed out: ${req.method} ${req.url}`);
    if (!res.headersSent) {
      res.status(503).json({ error: "Service unavailable: request timed out." });
    }
  });
  next();
});

// 3. CORS configuration supporting FRONTEND_URL environment variable
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow if no origin (e.g. curl, server-to-server) or if FRONTEND_URL is not set (allowing all for development/testing)
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// 4. Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use(compareRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Compare PoC backend running on port ${PORT}`);
});

