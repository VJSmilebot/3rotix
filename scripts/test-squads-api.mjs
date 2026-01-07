// scripts/test-squads-api.mjs
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal(filename = ".env.local") {
  const p = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(p)) return;

  const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();

    // strip surrounding quotes if present
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    // don't overwrite env vars you set in the shell
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();


import { createClient } from "@supabase/supabase-js";


const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Supabase envs (from your project)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Optional but highly recommended for auto-creating confirmed users:
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function die(msg) {
  console.error(`\n❌ ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`✅ ${msg}`);
}
function warn(msg) {
  console.log(`⚠️  ${msg}`);
}

function randStr(n = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function makeCreds() {
  // Using a reserved domain style; deliverability doesn't matter if we admin-confirm.
  const email = `test+${Date.now()}_${randStr(6)}@example.com`;
  const password = `T3st!${randStr(10)}_${Date.now()}`;
  return { email, password };
}

async function fetchJson(path, { method = "GET", token, body } = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-json response
  }

  return { res, text, json };
}

async function assertStatus(label, got, expected) {
  if (got !== expected) die(`${label}: expected ${expected}, got ${got}`);
  ok(`${label}: ${got}`);
}

async function adminCreateConfirmedUser({ email, password }) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return { created: false };

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) die(`Admin createUser failed: ${error.message}`);
  if (!data?.user?.id) die("Admin createUser succeeded but no user id returned");
  return { created: true, userId: data.user.id };
}

async function anonSignUpUser({ email, password }) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) die(`signUp failed: ${error.message}`);

  // If email confirmation is required, user might be unconfirmed and signIn will fail.
  return { userId: data?.user?.id || null };
}

async function signIn({ email, password }) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) die(`signIn failed for ${email}: ${error.message}`);

  const token = data?.session?.access_token;
  if (!token) die(`No access_token returned for ${email}`);

  return { token };
}

async function ensureUser(creds) {
  // Prefer admin confirmed user creation (no email confirmation issues)
  if (SUPABASE_SERVICE_ROLE_KEY) {
    await adminCreateConfirmedUser(creds);
    ok(`Created confirmed user (admin): ${creds.email}`);
  } else {
    warn("No SUPABASE_SERVICE_ROLE_KEY found. Falling back to anon signUp().");
    warn("If your Supabase requires email confirmation, signIn may fail.");
    await anonSignUpUser(creds);
    ok(`Created user (anon signUp): ${creds.email}`);
  }

  const { token } = await signIn(creds);
  ok(`Signed in: ${creds.email}`);
  return token;
}

async function main() {
  console.log("\n=== 3ROTIX Squad API Test ===");
  console.log(`BASE_URL: ${BASE_URL}`);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    die("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env.");
  }

  // Generate 2 test users (user2 optional for join/leave)
  const user1 = makeCreds();
  const user2 = makeCreds();

  console.log("\n--- Test Users Generated ---");
  console.log(`User1 email: ${user1.email}`);
  console.log(`User1 pass : ${user1.password}`);
  console.log(`User2 email: ${user2.email}`);
  console.log(`User2 pass : ${user2.password}`);
  console.log("----------------------------\n");

  const token1 = await ensureUser(user1);
  const token2 = await ensureUser(user2);

  // 1) Public: list squads
  {
    const r = await fetchJson("/api/squads");
    await assertStatus("GET /api/squads (public)", r.res.status, 200);
  }

  // 2) Auth: create squad
  const squadName = `Test Squad ${Date.now()}`;
  let squadId, squadSlug;

  {
    const r = await fetchJson("/api/squads/create", {
      method: "POST",
      token: token1,
      body: { name: squadName, description: "API test squad", maxMembers: 10, isPrivate: false },
    });

    await assertStatus("POST /api/squads/create (authed)", r.res.status, 201);

    const squad = r.json?.squad;
    if (!squad?.id || !squad?.slug) {
      console.log("Response:", r.json || r.text);
      die("Create squad did not return squad.id and squad.slug");
    }

    squadId = squad.id;
    squadSlug = squad.slug;
    ok(`Created squad: ${squadName} (${squadId}, slug=${squadSlug})`);
  }

  // 3) Public: by-slug
  {
    const r = await fetchJson(`/api/squads/by-slug/${encodeURIComponent(squadSlug)}`);
    await assertStatus("GET /api/squads/by-slug/:slug (public)", r.res.status, 200);
  }

  // 4) Authed: my squads includes it
  {
    const r = await fetchJson("/api/squads/my", { token: token1 });
    await assertStatus("GET /api/squads/my (authed)", r.res.status, 200);

    if (!Array.isArray(r.json)) die("/api/squads/my did not return an array");
    if (!r.json.some((s) => s?.id === squadId)) die("Created squad not found in /api/squads/my");
    ok("Created squad appears in /api/squads/my");
  }

  // 5) User2 join
  {
    const r = await fetchJson(`/api/squads/${encodeURIComponent(squadId)}/join`, {
      method: "POST",
      token: token2,
    });
    await assertStatus("POST /api/squads/:id/join (user2)", r.res.status, 200);
    ok("User2 joined squad");
  }

  // 6) User2 leave
  {
    const r = await fetchJson(`/api/squads/${encodeURIComponent(squadId)}/leave`, {
      method: "POST",
      token: token2,
    });
    await assertStatus("POST /api/squads/:id/leave (user2)", r.res.status, 200);
    ok("User2 left squad");
  }

  // 7) Owner leave should fail
  {
    const r = await fetchJson(`/api/squads/${encodeURIComponent(squadId)}/leave`, {
      method: "POST",
      token: token1,
    });

    if (r.res.status === 400) ok("Owner cannot leave (expected 400)");
    else {
      console.log("Response:", r.json || r.text);
      die(`Expected owner leave to fail with 400, got ${r.res.status}`);
    }
  }

  console.log("\n🎉 All squad API tests completed.\n");
}

main().catch((e) => die(e?.message || String(e)));
