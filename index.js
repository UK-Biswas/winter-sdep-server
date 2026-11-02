import "dotenv/config";

import cors from "cors";
import express from "express";

import { config } from "./src/config/env.js";
import { closeMongoDB, connectToMongoDB, getDb } from "./src/db/mongo.js";
import { errorHandler, notFound } from "./src/middleware/error.js";
import eventsRouter from "./src/routes/events.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        config.corsOrigins.includes("*") ||
        config.corsOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    service: "FrostTogether API",
    status: "ok",
    docs: "/api/health",
  });
});

app.get("/api/health", async (req, res) => {
  await getDb().command({ ping: 1 });

  res.json({ status: "ok", database: config.dbName });
});

app.use("/api/events", eventsRouter);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectToMongoDB();

  const server = app.listen(config.port, () => {
    console.log(`FrostTogether API listening on http://localhost:${config.port}`);
  });

  async function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down...`);

    server.close(async () => {
      await closeMongoDB();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Failed to start the server:", error);
  process.exit(1);
});
