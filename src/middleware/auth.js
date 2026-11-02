import { jwtVerify } from "jose";

import { config } from "../config/env.js";

const secret = new TextEncoder().encode(config.jwtSecret);

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret, {
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
    algorithms: ["HS256"],
  });

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Token is missing a subject.");
  }

  return {
    id: payload.sub,
    email: typeof payload.email === "string" ? payload.email : "",
    name: typeof payload.name === "string" ? payload.name : "",
  };
}

function readBearerToken(req) {
  const header = req.headers.authorization;

  if (!header || typeof header !== "string") return null;

  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export async function requireAuth(req, res, next) {
  const token = readBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = await verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export async function optionalAuth(req, res, next) {
  const token = readBearerToken(req);

  if (!token) return next();

  try {
    req.user = await verifyToken(token);
  } catch {
    req.user = null;
  }

  return next();
}
