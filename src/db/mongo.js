import { MongoClient } from "mongodb";

import { config, mongoUri } from "../config/env.js";

let client = null;
let db = null;

export async function connectToMongoDB() {
  if (db) return client;

  client = new MongoClient(mongoUri());
  await client.connect();
  db = client.db(config.dbName);

  await ensureIndexes(db);

  console.log(`Connected to MongoDB database "${config.dbName}".`);
  return client;
}

export async function ensureIndexes(database) {
  const events = database.collection("events");

  await Promise.all([
    events.createIndex({ date: 1 }),
    events.createIndex({ organizerId: 1 }),
    events.createIndex({ "joinedUsers.userId": 1 }),
    events.createIndex(
      { seedKey: 1 },
      { unique: true, sparse: true, name: "seedKey_unique_sparse" }
    ),
  ]);
}

export function getDb() {
  if (!db) {
    throw new Error("MongoDB has not been connected yet.");
  }

  return db;
}

export function getEventsCollection() {
  return getDb().collection("events");
}

export async function closeMongoDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
