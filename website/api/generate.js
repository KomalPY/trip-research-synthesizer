// Optional backend for live generation (Vercel-style serverless function).
// Set ANTHROPIC_API_KEY in your host's environment variables. Never put the key in the browser code.
// Calls the real Anthropic API with the web_search tool enabled, so results are grounded in
// actual search rather than written from the model's own knowledge. Generation can take up to
// about a minute — the host must allow a long function timeout.

import { buildMessages } from "./prompt.js";

export const config = { maxDuration: 60 };

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || ""; // e.g. https://your-site.example (blank = any)
const STAGES = new Set(["draft", "revise-draft", "enrich", "revise-final"]);
const MAX_TEXT = 4000;
const MAX_ITEMS = 60;

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function validTrip(trip) {
  return trip && typeof trip === "object"
    && typeof trip.destination === "string" && trip.destination.trim() && trip.destination.length <= 200
    && typeof trip.start === "string" && typeof trip.end === "string"
    && Number.isFinite(trip.days) && trip.days > 0 && trip.days <= 60
    && Number.isFinite(trip.size) && trip.size > 0 && trip.size <= 100
    && typeof (trip.who || "") === "string" && (trip.who || "").length <= MAX_TEXT
    && typeof (trip.notes || "") === "string" && (trip.notes || "").length <= MAX_TEXT;
}

export default async function handler(req, res) {
  if (ALLOWED_ORIGIN) res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (ALLOWED_ORIGIN && req.headers.origin && req.headers.origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const body = req.body || {};
  const { stage, trip, meta, items, feedback, feedbackLog } = body;

  if (!STAGES.has(stage)) return badRequest(res, "Invalid stage");
  if (!validTrip(trip)) return badRequest(res, "Invalid trip details");

  const revising = stage === "revise-draft" || stage === "revise-final";
  if (revising) {
    if (typeof feedback !== "string" || !feedback.trim() || feedback.length > MAX_TEXT) {
      return badRequest(res, "Feedback is required for a revision");
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
      return badRequest(res, "A draft to revise is required");
    }
  }
  if (stage === "enrich" && (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS)) {
    return badRequest(res, "An approved draft is required");
  }
  if (feedbackLog && (!Array.isArray(feedbackLog) || feedbackLog.length > 20)) {
    return badRequest(res, "Invalid feedback history");
  }

  let system, user;
  try {
    ({ system, user } = buildMessages({ stage, trip, meta, items, feedback, feedbackLog }));
  } catch (e) {
    return badRequest(res, "Could not build the request");
  }

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 8000,
        system,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
        messages: [{ role: "user", content: user }],
      }),
    });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach the model" });
  }

  if (upstream.status === 429) return res.status(429).json({ error: "Rate limited" });
  if (!upstream.ok) return res.status(502).json({ error: "Upstream error" });

  const data = await upstream.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return res.status(200).json({ text });
}
