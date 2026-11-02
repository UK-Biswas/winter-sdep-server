import { MongoClient } from "mongodb";
import "dotenv/config";

const client = new MongoClient(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gd33szw.mongodb.net/`
);

try {
  await client.connect();
  const db = client.db(process.env.DB_NAME || "winter-sdep");
  console.log("events:", await db.collection("events").countDocuments());
  console.log("seeded:", await db.collection("events").countDocuments({ seedKey: { $exists: true } }));
  console.log("test leftovers:", await db.collection("events").countDocuments({ organizerEmail: /^frosttest-/ }));
  console.log("users:", await db.collection("user").countDocuments());
  console.log("test users:", await db.collection("user").countDocuments({ email: /^frosttest-/ }));
} finally {
  await client.close();
}
