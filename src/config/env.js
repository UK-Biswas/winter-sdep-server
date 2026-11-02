import "dotenv/config";

function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not set. Add it to the server .env file.`);
  }

  return value;
}

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer.");
}

const jwtSecret = required("JWT_SECRET");

if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long.");
}

export const config = {
  port,
  dbUser: required("DB_USER"),
  dbPass: required("DB_PASS"),
  dbName: process.env.DB_NAME?.trim() || "winter-sdep",
  jwtSecret,
  jwtIssuer: process.env.JWT_ISSUER?.trim() || "frosttogether-web",
  jwtAudience: process.env.JWT_AUDIENCE?.trim() || "frosttogether-api",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export function mongoUri() {
  return `mongodb+srv://${config.dbUser}:${config.dbPass}@cluster0.gd33szw.mongodb.net/`;
}
