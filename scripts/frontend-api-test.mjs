import { MongoClient } from "mongodb";
import "dotenv/config";

const base = process.env.TEST_BASE_URL || "http://localhost:3100";
const suffix = Date.now().toString(36);
const emailA = `frosttest-${suffix}-a@example.com`;
const emailB = `frosttest-${suffix}-b@example.com`;
const password = "TestPassword123!";

const results = [];
function check(name, actual, expected) {
  const ok = actual === expected;
  results.push({ name, ok, actual, expected });
}

function cookieHeader(response) {
  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function signUp(email, name) {
  const response = await fetch(`${base}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify({ email, password, name }),
  });

  const body = await response.json().catch(() => null);
  const cookie = cookieHeader(response);

  return { status: response.status, body, cookie };
}

async function call(method, path, { body, cookie } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      origin: base,
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: response.status, data, cookie: cookieHeader(response) || undefined };
}

const future = new Date();
future.setDate(future.getDate() + 30);
const date = future.toISOString().slice(0, 10);

const draft = {
  title: "Frontend Integration Test Drive",
  type: "Cleanup",
  date,
  location: "Test Park, Dhaka",
  image: "https://example.com/test.jpg",
  description: "A temporary event created by the end-to-end integration test.",
};

const a = await signUp(emailA, "Frost Test A");
check("sign-up A succeeds", a.status, 200);
check("sign-up A returns a session cookie", Boolean(a.cookie), true);

const b = await signUp(emailB, "Frost Test B");
check("sign-up B succeeds", b.status, 200);

let r = await call("GET", "/api/events");
check("public list through Next proxy", r.status, 200);
check("public list is an array", Array.isArray(r.data), true);

r = await call("POST", "/api/events", { body: draft });
check("create without session returns 401", r.status, 401);

r = await call("POST", "/api/events", { body: draft, cookie: a.cookie });
check("signed-in create returns 201", r.status, 201);
check("event belongs to signed-in user", r.data?.organizerEmail, emailA);
check("event is flagged as owned", r.data?.isOwner, true);
const eventId = r.data?.id;

r = await call("GET", `/api/events/${eventId}`, { cookie: a.cookie });
check("single event read", r.status, 200);
check("single event is owned", r.data?.isOwner, true);

r = await call("PUT", `/api/events/${eventId}`, {
  body: { title: "Frontend Integration Test Updated" },
  cookie: a.cookie,
});
check("owner update through Next proxy", r.status, 200);
check("update persisted", r.data?.title, "Frontend Integration Test Updated");

r = await call("PUT", `/api/events/${eventId}`, {
  body: { title: "Hijacked" },
  cookie: b.cookie,
});
check("other user update returns 403", r.status, 403);

r = await call("DELETE", `/api/events/${eventId}`, { cookie: b.cookie });
check("other user delete returns 403", r.status, 403);

r = await call("POST", `/api/events/${eventId}/join`, { cookie: a.cookie });
check("join through Next proxy", r.status, 200);
check("join count is 1", r.data?.joinedCount, 1);
check("joinedAt is set", typeof r.data?.joinedAt, "string");

r = await call("GET", "/api/events", { cookie: a.cookie });
const listed = Array.isArray(r.data)
  ? r.data.find((event) => event.id === eventId)
  : null;
check("authenticated list includes joinedAt", typeof listed?.joinedAt, "string");

r = await call("GET", "/api/events/joined", { cookie: a.cookie });
check(
  "joined endpoint includes the event",
  Array.isArray(r.data) && r.data.some((event) => event.id === eventId),
  true
);

r = await call("GET", "/api/events/mine", { cookie: a.cookie });
check(
  "mine endpoint includes the event",
  Array.isArray(r.data) && r.data.some((event) => event.id === eventId),
  true
);

r = await call("DELETE", `/api/events/${eventId}/join`, { cookie: a.cookie });
check("leave through Next proxy", r.status, 200);
check("leave count is 0", r.data?.joinedCount, 0);

r = await call("POST", "/api/auth/update-user", {
  body: { name: "Frost Test A Updated" },
  cookie: a.cookie,
});
check("profile update succeeds", r.status, 200);

r = await call("GET", "/api/auth/get-session", {
  cookie: r.cookie || a.cookie,
});
check("profile name persisted", r.data?.user?.name, "Frost Test A Updated");

r = await call("DELETE", `/api/events/${eventId}`, { cookie: a.cookie });
check("owner delete through Next proxy", r.status, 200);

r = await call("GET", `/api/events/${eventId}`, { cookie: a.cookie });
check("deleted event returns 404", r.status, 404);

console.log("");
for (const result of results) {
  console.log(
    `${result.ok ? "PASS" : "FAIL"}  ${result.name} (got ${result.actual}, expected ${result.expected})`
  );
}
console.log(
  `\n${results.filter((result) => result.ok).length}/${results.length} checks passed`
);

// Clean up the temporary Better Auth users and anything they created.
const client = new MongoClient(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gd33szw.mongodb.net/`
);

try {
  await client.connect();
  const db = client.db(process.env.DB_NAME || "winter-sdep");
  const users = db.collection("user");
  const testUsers = await users
    .find({ email: { $in: [emailA, emailB] } })
    .toArray();
  const ids = testUsers.map((user) => String(user._id));

  await db.collection("events").deleteMany({ organizerEmail: { $in: [emailA, emailB] } });
  await db.collection("session").deleteMany({ userId: { $in: ids } });
  await db.collection("account").deleteMany({ userId: { $in: ids } });
  await users.deleteMany({ _id: { $in: ids } });

  console.log(`Cleaned up ${ids.length} test user(s).`);
} finally {
  await client.close();
}

if (results.some((result) => !result.ok)) process.exitCode = 1;
