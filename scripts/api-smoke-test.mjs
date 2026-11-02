import { SignJWT } from "jose";
import "dotenv/config";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const base = "http://localhost:5000";

async function token(sub, email, name) {
  return new SignJWT({ email, name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(sub)
    .setIssuer(process.env.JWT_ISSUER || "frosttogether-web")
    .setAudience(process.env.JWT_AUDIENCE || "frosttogether-api")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

async function call(method, path, { body, bearer } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const owner = await token("test-owner-id", "owner@example.com", "Test Owner");
const other = await token("test-other-id", "other@example.com", "Other User");

const results = [];
function check(name, actual, expected) {
  const ok = actual === expected;
  results.push({ name, ok, actual, expected });
}

let r = await call("POST", "/api/events", {
  body: {
    title: "Integration Test Drive",
    type: "Cleanup",
    date: "2026-12-25",
    location: "Test Park, Dhaka",
    image: "https://example.com/test.jpg",
    description: "A temporary event created by the integration test script.",
  },
  bearer: owner,
});
check("create requires valid token / returns 201", r.status, 201);
const id = r.data?.id;
check("created event has string id", typeof id, "string");
check("created event joinedCount is 0", r.data?.joinedCount, 0);
check("created event isOwner", r.data?.isOwner, true);

r = await call("GET", `/api/events/${id}`);
check("public get single event", r.status, 200);

r = await call("POST", "/api/events", {
  body: {
    title: "No Auth Drive",
    type: "Cleanup",
    date: "2026-12-25",
    location: "Test Park",
    image: "https://example.com/test.jpg",
    description: "This request must be rejected without a token.",
  },
});
check("create without token returns 401", r.status, 401);

r = await call("PUT", `/api/events/${id}`, {
  body: { title: "Integration Test Drive Updated" },
  bearer: owner,
});
check("owner can update", r.status, 200);
check("update applied", r.data?.title, "Integration Test Drive Updated");

r = await call("PUT", `/api/events/${id}`, {
  body: { title: "Hijacked title" },
  bearer: other,
});
check("non-owner update returns 403", r.status, 403);

r = await call("DELETE", `/api/events/${id}`, { bearer: other });
check("non-owner delete returns 403", r.status, 403);

r = await call("POST", `/api/events/${id}/join`, { bearer: owner });
check("join succeeds", r.status, 200);
check("join increments count", r.data?.joinedCount, 1);
check("join sets joinedAt", typeof r.data?.joinedAt, "string");

r = await call("GET", "/api/events/joined", { bearer: owner });
check("joined list includes event", Array.isArray(r.data) && r.data.some((e) => e.id === id), true);

r = await call("DELETE", `/api/events/${id}/join`, { bearer: owner });
check("leave succeeds", r.status, 200);
check("leave decrements count", r.data?.joinedCount, 0);

r = await call("GET", "/api/events/mine", { bearer: owner });
check("mine list includes event", Array.isArray(r.data) && r.data.some((e) => e.id === id), true);

r = await call("DELETE", `/api/events/${id}`, { bearer: owner });
check("owner can delete", r.status, 200);

r = await call("GET", `/api/events/${id}`);
check("deleted event returns 404", r.status, 404);

r = await call("POST", "/api/events", {
  body: { title: "bad", type: "Nope", date: "xx", location: "", image: "x", description: "short" },
  bearer: owner,
});
check("invalid payload returns 400", r.status, 400);

console.log("");
for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.name} (got ${result.actual}, expected ${result.expected})`);
}
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed`);

if (results.some((r) => !r.ok)) process.exitCode = 1;
