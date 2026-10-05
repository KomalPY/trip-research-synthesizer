// Accommodation Search & Group Booking: agent instructions (skills S1 lodging-search and
// S2 suitability-budget-tagging, coordinated by A1) plus the deterministic checks the server
// applies to whatever the model returns. Underscore-prefixed so hosts don't expose it as a route.

export const MAX_ITEMS = 60;
export const MAX_BASES = 5;
export const MAX_OPTIONS = 5;
const STRETCH_CAP_PCT = 15;
const BUDGET_FRIENDLY_RATIO = 0.75;

// ---------- small helpers ----------

export function clip(v, n) {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "";
}
function list(v, n, len) {
  return Array.isArray(v) ? v.map((x) => clip(String(x), len)).filter(Boolean).slice(0, n) : [];
}
function url(v, httpsOnly) {
  try {
    const u = new URL(String(v));
    if (u.protocol === "https:" || (!httpsOnly && u.protocol === "http:")) return u.href.slice(0, 700);
  } catch (e) { /* not a URL */ }
  return "";
}
function num(v) {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}
export function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "option";
}
export function parseJsonLines(text) {
  const out = [];
  String(text).split("\n").forEach((line) => {
    line = line.trim().replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
    if (!line || line[0] !== "{") return;
    try { out.push(JSON.parse(line)); } catch (e) { /* skip partial lines */ }
  });
  return out;
}
export function totalNights(trip) {
  return Math.max(1, trip.days - 1);
}
function addDays(iso, d) {
  const t = new Date(iso + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString().slice(0, 10);
}

// ---------- prompts ----------

const PLAN_SYSTEM = `You decide where a travel group should sleep. You are given a trip and its approved activity shortlist (each activity has an area name and a loose day range).

Choose the lodging bases: the fewest sensible places to stay, usually 1 to 4, so that every activity is within a reasonable trip (roughly 60 to 75 minutes each way) of a base. An area that only holds day-trip activities is NOT a lodging base unless the activities there justify sleeping there. Do not create a base per area just because the shortlist groups by area.

Split the trip's nights across the bases; each base gets at least 1 night and the nights add up to exactly the total nights you are told. Prefer fewer moves for large groups or young children.

Output ONLY JSON Lines, one object per line, no other text:
{"type":"base","location":"town or neighborhood to search for lodging","nights":2,"activities":["exact activity names from the shortlist that this base serves"],"reason":"one short sentence"}`;

const SEARCH_RULES = `You are the lodging-search and suitability agent for a group trip. Use the web_search tool to find 3 to 5 real, currently listed places to stay in or near ONE lodging base, on Airbnb, Booking.com, and hotel websites. Search each source; do not rely on a single site.

Hard rules:
- Every option MUST have a real "link" taken from a search result. Never invent, guess or rebuild a URL. If you cannot find a real link for something, leave it out.
- Every option MUST have a price. Give price_value as the estimated TOTAL nightly cost in USD of the lodging needed to house the WHOLE group (all units added together if split). If the listing shows a per-room rate, work out the total. Say in price_text that it is an estimate to confirm for the dates, for example "~$310/night total (estimate; confirm for your dates)".
- Every option MUST have a rating: give rating_text exactly as the source shows it (stars or score and review count) and rating_value on a 0 to 5 scale.
- Never book, reserve or pay for anything. Never claim availability for the dates.
- Cancellation: state the policy you actually found. If you did not find it, write "Not found" and set non_refundable to null. Set non_refundable to true whenever the policy is non-refundable; never describe a policy as refundable unless a source says so.
- Prefer one unit that sleeps the whole group. When none exists, propose a specific split (for example "2 adjacent condos: 4 + 3 beds"), set units to the number of units, group_fit to "split", and say so in group_note.
- Distance: give approximate travel time from the option to the listed activities that belong to this base. Use time, not guesses at exact miles.
- Must-haves: read the traveler's accommodation preferences and pull out only what is about lodging. List what the option meets in "met" and what it misses or cannot confirm in "missed". Both arrays are required for every option. If there are no preferences, evaluate against: sleeps the whole group, and close to the activities.
- When nothing matches every must-have, still include the closest options and list what each one misses. Never return nothing.
- Market: set market to "normal" when you found at least 3 reasonable options, "thin" when fewer, and "none_nearby" when nothing is reasonably close (then show the next-closest options and say so in the note).
- Budget: the traveler may give a budget in free text. Work out target_nightly = budget per person per night multiplied by the group size, in USD. If the figure is a trip total or a different unit, convert it using the nights stated and explain in budget_interpretation. If no budget was given, target_nightly is null. Do not avoid options above the target, but do not include anything more than about 30 percent above it.
- Stretch pick: at most one option per base may be up to 15 percent over target_nightly AND clearly worth it (closer to the activities, fits the group in one unit, or a notably higher rating). Put its one-line reason in stretch_reason. Leave stretch_reason empty for every other option.
- Keep text terse. Fill every field.

Output ONLY JSON Lines, one object per line, no markdown and no commentary.

First line:
{"type":"meta","assumptions":"one or two short sentences","budget_interpretation":"how you read the budget, or empty","target_nightly":number or null}
Second line:
{"type":"location","location":"the base","market":"normal|thin|none_nearby","note":"short note, required when market is not normal, else empty"}
Then one line per option:
{"type":"option","name":"","kind":"hotel|apartment|house|resort|other","price_text":"","price_value":number,"rating_text":"","rating_value":number,"link":"https://...","photo":"direct https image URL from the listing, or empty","amenities":["up to 8"],"distance":"short","kid_friendly":"yes|no|unclear|n/a","kid_note":"short or empty","cancellation":"","non_refundable":true|false|null,"met":[],"missed":[],"stretch_reason":"","units":1,"group_fit":"single|split|unclear","group_note":"short or empty"}`;

const SEARCH_MORE_RULES = `Add only NEW options that satisfy the traveler's latest feedback. Do not repeat any option from the existing list. Keep all the same rules and output format. You may return fewer than 3 options this time; set market for the base as it stands overall.`;

function tripLines(trip) {
  return [
    "Destination: " + clip(trip.destination, 200),
    "Trip dates: " + trip.start + " to " + trip.end + " (" + trip.days + " days, " + totalNights(trip) + " nights)",
    "Group size: " + trip.size,
    "Who is traveling: " + (clip(trip.who || "", 600) || "not specified (assume a general adult group)"),
    "Trip notes: " + (clip(trip.notes || "", 800) || "none"),
    "Budget (free text, per person): " + (clip(trip.budget || "", 300) || "not given"),
    "Accommodation preferences: " + (clip(trip.prefs || "", 800) || "none given"),
  ].join("\n");
}

export function buildPlanMessages(trip, items) {
  const lines = items.map((i) => JSON.stringify({ name: clip(i.name, 120), area: clip(i.location || "", 120), days: clip(i.cluster || "", 40) }));
  return {
    system: PLAN_SYSTEM,
    user: ["TRIP", tripLines(trip), "", "Total nights to allocate: " + totalNights(trip), "", "APPROVED ACTIVITY SHORTLIST", lines.join("\n")].join("\n"),
  };
}

export function buildSearchMessages(trip, base, existing, feedback) {
  const more = Array.isArray(existing) && existing.length > 0;
  const parts = [
    "Today's date: " + new Date().toISOString().slice(0, 10),
    "",
    "TRIP",
    tripLines(trip),
    "",
    "LODGING BASE TO SEARCH: " + clip(base.location, 120),
    "Check-in " + base.check_in + ", check-out " + base.check_out + " (" + base.nights + " nights)",
    "Activities served from this base: " + ((base.activities || []).map((a) => clip(a, 120)).join("; ") || "general area"),
  ];
  if (more) {
    parts.push("", "OPTIONS ALREADY SHOWN (do not repeat)", existing.map((o) => "- " + clip(o.name, 120) + " (" + clip(o.link || "", 200) + ")").join("\n"));
    parts.push("", "TRAVELER FEEDBACK: " + clip(feedback || "", 800));
  }
  return { system: SEARCH_RULES + (more ? "\n\n" + SEARCH_MORE_RULES : ""), user: parts.join("\n") };
}

// ---------- deterministic checks on model output ----------

// Turns the model's chosen bases into validated bases with chained dates whose nights add up.
export function normalizeBases(raw, trip, items) {
  const total = totalNights(trip);
  const known = new Set(items.map((i) => clip(i.name, 120)));
  let bases = (raw || [])
    .filter((b) => b && b.type === "base" && clip(b.location, 120))
    .slice(0, Math.min(MAX_BASES, total))
    .map((b) => ({
      location: clip(b.location, 120),
      nights: Math.max(1, Math.round(num(b.nights) || 1)),
      activities: list(b.activities, 30, 120).filter((a) => known.has(a)),
      reason: clip(b.reason || "", 200),
    }));
  if (bases.length === 0) {
    bases = [{ location: clip(trip.destination, 120), nights: total, activities: [...known].slice(0, 30), reason: "Single base for the whole trip." }];
  }
  let sum = bases.reduce((s, b) => s + b.nights, 0);
  while (sum > total) {
    const big = bases.reduce((m, b) => (b.nights > m.nights ? b : m), bases[0]);
    if (big.nights > 1) big.nights -= 1; else bases.pop();
    sum = bases.reduce((s, b) => s + b.nights, 0);
  }
  if (sum < total) bases[bases.length - 1].nights += total - sum;
  let cursor = trip.start;
  bases.forEach((b) => {
    b.check_in = cursor;
    cursor = addDays(cursor, b.nights);
    b.check_out = cursor;
  });
  return bases;
}

// Validates options, applies the budget tiers, and enforces the "at most one stretch pick" rule.
export function normalizeOptions(rawLines, base, targetFromTrip) {
  const metaRaw = rawLines.find((l) => l && l.type === "meta") || {};
  const locRaw = rawLines.find((l) => l && l.type === "location") || {};
  const target = num(metaRaw.target_nightly) > 0 ? num(metaRaw.target_nightly) : null;
  const budgetGiven = !!targetFromTrip && target !== null;
  const dropped = [];
  const seen = new Set();

  let options = rawLines.filter((l) => l && l.type === "option").map((o) => {
    const name = clip(o.name, 140);
    const link = url(o.link, false);
    const price = num(o.price_value);
    const rating = num(o.rating_value);
    const ratingText = clip(o.rating_text || "", 80);
    if (!name) { dropped.push("missing name"); return null; }
    if (!link) { dropped.push(name + ": no valid link"); return null; }
    if (!(price > 0)) { dropped.push(name + ": no price"); return null; }
    if (!ratingText || !(rating >= 0)) { dropped.push(name + ": no rating"); return null; }
    let id = slug(base.location + " " + name);
    if (seen.has(id)) { dropped.push(name + ": duplicate"); return null; }
    seen.add(id);
    const kid = ["yes", "no", "unclear", "n/a"].includes(o.kid_friendly) ? o.kid_friendly : "unclear";
    const fit = ["single", "split", "unclear"].includes(o.group_fit) ? o.group_fit : "unclear";
    const nonRef = o.non_refundable === true ? true : o.non_refundable === false ? false : null;
    return {
      id, location: base.location, name,
      kind: clip(o.kind || "other", 20),
      price_text: clip(o.price_text || "", 120) || "~$" + Math.round(price) + "/night total (estimate)",
      price_value: Math.round(price),
      rating_text: ratingText, rating_value: Math.min(5, rating),
      link, photo: url(o.photo, true),
      amenities: list(o.amenities, 8, 40),
      distance: clip(o.distance || "", 200),
      kid_friendly: kid, kid_note: clip(o.kid_note || "", 140),
      cancellation: clip(o.cancellation || "", 200) || "Not found",
      non_refundable: nonRef,
      met: list(o.met, 8, 100), missed: list(o.missed, 8, 100),
      stretch_reason: clip(o.stretch_reason || "", 200),
      units: Math.max(1, Math.round(num(o.units) || 1)),
      group_fit: fit, group_note: clip(o.group_note || "", 200),
    };
  }).filter(Boolean);

  // Budget tiers: only meaningful when a budget was actually given.
  options.forEach((o) => {
    o.over_pct = null; o.over_budget = false; o.tier = "none";
    if (!budgetGiven) return;
    o.over_pct = Math.round((o.price_value / target - 1) * 100);
    o.over_budget = o.price_value > target;
    if (o.price_value <= target * BUDGET_FRIENDLY_RATIO) o.tier = "budget";
    else if (o.price_value <= target) o.tier = "comfort";
    else o.tier = "over";
  });
  if (budgetGiven) {
    const candidates = options.filter((o) => o.over_pct > 0 && o.over_pct <= STRETCH_CAP_PCT && o.stretch_reason);
    candidates.sort((a, b) => b.rating_value - a.rating_value || a.price_value - b.price_value);
    if (candidates[0]) { candidates[0].tier = "stretch"; candidates[0].tier_reason = candidates[0].stretch_reason; }
  }
  options.forEach((o) => { delete o.stretch_reason; });

  // Keep at most MAX_OPTIONS, making sure the stretch pick survives the cut.
  if (options.length > MAX_OPTIONS) {
    const stretch = options.find((o) => o.tier === "stretch");
    let kept = options.filter((o) => o !== stretch).slice(0, stretch ? MAX_OPTIONS - 1 : MAX_OPTIONS);
    options = stretch ? kept.concat(stretch) : kept;
  }

  let market = ["normal", "thin", "none_nearby"].includes(locRaw.market) ? locRaw.market : "normal";
  let note = clip(locRaw.note || "", 300);
  if (options.length < 3 && market === "normal") {
    market = "thin";
    note = note || "Fewer than 3 reasonable options were found, so this is everything that fit.";
  }
  if (options.length === 0 && market !== "none_nearby") {
    market = "none_nearby";
    note = note || "No usable lodging was found near this base.";
  }
  return {
    meta: {
      assumptions: clip(metaRaw.assumptions || "", 300),
      budget_interpretation: clip(metaRaw.budget_interpretation || "", 300),
      target_nightly: target,
    },
    location: { location: base.location, market, note },
    options, dropped,
  };
}
