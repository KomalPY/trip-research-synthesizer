// Accommodation Search endpoint (serverless, Vercel-style). Set ANTHROPIC_API_KEY in the host's
// environment. Three modes, all POST:
//   plan   - chooses the lodging bases and nights from the approved activity shortlist (no web search)
//   search - finds and annotates 3-5 options for ONE base (web search)
//   more   - same as search, but for a base that already has options, using the group's feedback
// One search call per base keeps every request well inside the function time limit.

import {
  MAX_ITEMS, clip, parseJsonLines, buildPlanMessages, buildSearchMessages,
  normalizeBases, normalizeOptions,
} from "./_accommodation.js";

export const config = { maxDuration: 120 };

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "";
const MODES = new Set(["plan", "search", "more"]);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function bad(res, message) { return res.status(400).json({ error: message }); }
function str(v, max) { return typeof v === "string" && v.length <= max; }

function validTrip(t) {
  return t && typeof t === "object"
    && str(t.destination, 200) && t.destination.trim()
    && typeof t.start === "string" && ISO.test(t.start) && typeof t.end === "string" && ISO.test(t.end)
    && Number.isFinite(t.days) && t.days >= 1 && t.days <= 60
    && Number.isFinite(t.size) && t.size >= 1 && t.size <= 100
    && str(t.who || "", 600) && str(t.notes || "", 1000)
    && str(t.budget || "", 300) && str(t.prefs || "", 1000);
}

async function callClaude(system, user, withSearch) {
  const messages = [{ role: "user", content: user }];
  let text = "";
  for (let round = 0; round < 3; round++) {
    const body = { model: "claude-sonnet-5", max_tokens: 6000, system, messages };
    if (withSearch) body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 10 }];
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
    });
    if (r.status === 429) throw Object.assign(new Error("rate"), { status: 429 });
    if (!r.ok) throw Object.assign(new Error("upstream"), { status: 502 });
    const data = await r.json();
    text += (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") + "\n";
    if (data.stop_reason !== "pause_turn") return text;
    messages.push({ role: "assistant", content: data.content });
  }
  return text;
}

export default async function handler(req, res) {
  if (ALLOWED_ORIGIN) res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (ALLOWED_ORIGIN && req.headers.origin && req.headers.origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(501).json({ error: "Backend not configured" });

  const { mode, trip, items, base, existing, feedback } = req.body || {};
  if (!MODES.has(mode)) return bad(res, "Invalid mode");
  if (!validTrip(trip)) return bad(res, "Invalid trip details");

  try {
    if (mode === "plan") {
      if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) return bad(res, "An approved shortlist is required");
      const { system, user } = buildPlanMessages(trip, items);
      const text = await callClaude(system, user, false);
      return res.status(200).json({ bases: normalizeBases(parseJsonLines(text), trip, items) });
    }

    if (!base || !str(base.location, 120) || !base.location.trim() || !ISO.test(base.check_in || "") || !ISO.test(base.check_out || "")
        || !Number.isFinite(base.nights) || base.nights < 1 || base.nights > 60) {
      return bad(res, "Invalid lodging base");
    }
    if (mode === "more") {
      if (!str(feedback, 800) || !feedback.trim()) return bad(res, "Feedback is required");
      if (!Array.isArray(existing) || existing.length > 20) return bad(res, "Existing options are required");
    }
    const { system, user } = buildSearchMessages(trip, base, mode === "more" ? existing : null, feedback);
    const text = await callClaude(system, user, true);
    const result = normalizeOptions(parseJsonLines(text), { location: clip(base.location, 120) }, !!clip(trip.budget || "", 300));
    return res.status(200).json(result);
  } catch (e) {
    if (e && e.status === 429) return res.status(429).json({ error: "Rate limited" });
    return res.status(502).json({ error: "Could not reach the model" });
  }
}
