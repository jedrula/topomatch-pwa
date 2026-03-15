#!/usr/bin/env node
/**
 * firestore-inspect.js
 *
 * Inspect any Firestore document from the command line.
 * Uses Application Default Credentials (gcloud auth application-default login).
 *
 * Usage:
 *   node scripts/firestore-inspect.js <collection>/<docId>           # inspect doc
 *   node scripts/firestore-inspect.js <collection>/<docId> <field>  # drill into a field
 *   node scripts/firestore-inspect.js <collection>/<docId> <field> --full  # no truncation
 *   node scripts/firestore-inspect.js <collection> --list [--limit=20]     # list docs in collection
 *
 * Examples:
 *   node scripts/firestore-inspect.js analysisDiagnostics/5502b47b-f98b-454b-bf8d-8a48d3d3117c
 *   node scripts/firestore-inspect.js analysisDiagnostics/5502b47b-f98b-454b-bf8d-8a48d3d3117c steps
 *   node scripts/firestore-inspect.js analysisDiagnostics/5502b47b-f98b-454b-bf8d-8a48d3d3117c match.pairs
 *   node scripts/firestore-inspect.js analysisDiagnostics --list --limit=5
 */

const admin = require("firebase-admin");

// ── Init with ADC ──────────────────────────────────────────────────────────────
admin.initializeApp({ projectId: "topomatch-pwa" });
const db = admin.firestore();

// ── CLI args ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FULL = args.includes("--full");
const JSON_MODE = args.includes("--json");
const LIST = args.includes("--list");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1]) : 20;
const cleanArgs = args.filter((a) => !a.startsWith("--"));

const [pathArg, fieldArg] = cleanArgs;

if (!pathArg) {
  console.error(
    "Usage: node scripts/firestore-inspect.js <collection>[/<docId>] [field.path] [--full] [--list] [--limit=N]",
  );
  process.exit(1);
}

// ── Formatting helpers ─────────────────────────────────────────────────────────
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";

function color(c, s) {
  return c + s + RESET;
}

function formatValue(val, indent = 0, full = FULL) {
  const pad = " ".repeat(indent);
  const pad2 = " ".repeat(indent + 2);

  if (val === null || val === undefined) return color(DIM, "null");
  if (typeof val === "boolean") return color(YELLOW, String(val));
  if (typeof val === "number") return color(GREEN, String(val));
  if (typeof val === "string") {
    const display =
      !full && val.length > 200 ? val.slice(0, 200) + color(DIM, `…(${val.length} chars)`) : val;
    return color(CYAN, JSON.stringify(display));
  }
  if (val && typeof val === "object" && val._seconds !== undefined) {
    // Firestore Timestamp
    return color(MAGENTA, new Date(val._seconds * 1000).toISOString());
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return color(DIM, "[]");
    const MAX = full ? Infinity : 10;
    const shown = val.slice(0, MAX);
    const lines = shown.map((item, i) => {
      const formatted = formatValue(item, indent + 2, full);
      return `${pad2}${color(DIM, `[${i}]`)} ${formatted}`;
    });
    if (val.length > MAX) {
      lines.push(
        `${pad2}${color(DIM, `… ${val.length - MAX} more items (use --full to show all)`)}`,
      );
    }
    return `${color(DIM, "[")} ${color(DIM, val.length + " items")}\n${lines.join("\n")}\n${pad}${color(DIM, "]")}`;
  }
  if (typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length === 0) return color(DIM, "{}");
    const lines = keys.map((k) => {
      const formatted = formatValue(val[k], indent + 2, full);
      return `${pad2}${color(BOLD, k)}: ${formatted}`;
    });
    return `{\n${lines.join("\n")}\n${pad}}`;
  }
  return String(val);
}

function printDoc(id, data, fieldPath) {
  let target = data;

  if (fieldPath) {
    const parts = fieldPath.split(".");
    for (const part of parts) {
      if (target === undefined || target === null) {
        console.error(color(RED, `Field "${fieldPath}" not found (missing at "${part}")`));
        process.exit(1);
      }
      target = target[part];
    }
    console.log(`\n${color(BOLD, `${id} → ${color(CYAN, fieldPath)}`)}\n`);
    console.log(formatValue(target, 0));
    console.log();
    return;
  }

  console.log(`\n${color(BOLD + BLUE, "━".repeat(72))}`);
  console.log(`${color(BOLD, "Document:")} ${color(CYAN, id)}`);
  console.log(`${color(BOLD + BLUE, "━".repeat(72))}\n`);

  const keys = Object.keys(data).sort();
  for (const key of keys) {
    const val = data[key];
    // Summarize large arrays at top level unless field was explicitly requested
    const summary =
      !FULL && Array.isArray(val)
        ? ` ${color(DIM, `(${val.length} items — pass field name or --full to expand)`)}`
        : "";
    const formatted =
      !FULL && Array.isArray(val) && val.length > 3
        ? color(DIM, `[array: ${val.length} items]`) + summary
        : formatValue(val, 0);
    console.log(`${color(BOLD, key)}: ${formatted}`);
  }
  console.log(`\n${color(DIM, `Fields: ${keys.length}`)}\n`);
}

// ── Convert Firestore Timestamp to plain object for display ───────────────────
function normalize(val) {
  if (val === null || val === undefined) return val;
  if (val && typeof val.toDate === "function") {
    return { _seconds: val.seconds, _nanos: val.nanoseconds };
  }
  if (Array.isArray(val)) return val.map(normalize);
  if (typeof val === "object") {
    const out = {};
    for (const k of Object.keys(val)) out[k] = normalize(val[k]);
    return out;
  }
  return val;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const parts = pathArg.split("/");

  // LIST mode: just a collection name
  if (LIST || parts.length === 1) {
    const collection = parts[0];
    console.log(
      `\n${color(BOLD, `Listing collection: ${color(CYAN, collection)}`)} (limit ${LIMIT})\n`,
    );
    const snap = await db.collection(collection).limit(LIMIT).get();
    if (snap.empty) {
      console.log(color(DIM, "(empty collection)"));
    } else {
      snap.forEach((doc) => {
        const data = normalize(doc.data());
        const preview = Object.entries(data)
          .slice(0, 4)
          .map(([k, v]) => {
            const s =
              typeof v === "object" ? JSON.stringify(v).slice(0, 40) : String(v).slice(0, 40);
            return `${color(DIM, k)}=${color(CYAN, s)}`;
          })
          .join("  ");
        console.log(`  ${color(BOLD, doc.id)}  ${preview}`);
      });
      console.log(`\n${color(DIM, `Showing ${snap.size} docs`)}\n`);
    }
    return;
  }

  // DOC mode: collection/docId
  if (parts.length >= 2) {
    const collection = parts[0];
    const docId = parts.slice(1).join("/"); // handle sub-collections
    const ref = db.doc(`${collection}/${docId}`);
    const snap = await ref.get();

    if (!snap.exists) {
      console.error(color(RED, `Document not found: ${pathArg}`));
      process.exit(1);
    }

    const data = normalize(snap.data());

    if (JSON_MODE) {
      const target = fieldArg ? fieldArg.split(".").reduce((o, k) => o?.[k], data) : data;
      console.log(JSON.stringify(target, null, 2));
      return;
    }

    printDoc(snap.id, data, fieldArg);
    return;
  }

  console.error(color(RED, "Invalid path. Use <collection>/<docId> or <collection> --list"));
  process.exit(1);
}

main().catch((err) => {
  console.error(color(RED, "Error: ") + err.message);
  if (err.code === "app/no-app" || err.message.includes("credential")) {
    console.error(
      color(YELLOW, "\nTip: Run  gcloud auth application-default login  to authenticate"),
    );
  }
  process.exit(1);
});
