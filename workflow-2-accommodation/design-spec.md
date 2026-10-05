---
workflow: accommodation-search-group-booking
requirements_file: workflow-2-accommodation/requirements.md
spec_version: 2.1
definition_type: Outcome-Driven
mechanism: Agent
involvement: Augmented
platform: Trip Shortlister website (existing custom site, continues the Workflow 1 build)
platform_mode: code
packaging: Loose Files
counts:
  domains: 5
  skills: 3
  agents: 1
  integrations: 2
---

# Accommodation Search & Group Booking Coordination — Design Spec

## Source

**Workflow Requirements:** `workflow-2-accommodation/requirements.md`

This Design Spec consumes the Workflow Requirements as canonical input. Outcome, Metadata, Context Inventory, Acceptance Criteria, Example Scenarios, and Human Gates are defined there — not restated here. Read the Workflow Requirements alongside this spec when building.

---

## Layer 1 — Architecture

## Execution Pattern

**Agent** — outcome-driven workflow; autonomy is Autonomous by definition. A single agent orchestrates lodging search, annotation, and page assembly across however many locations the trip spans, delegating to two AI skills (lodging search, suitability/budget-tier tagging). A third skill is deterministic backend infrastructure the generated page itself calls after the agent finishes — not something the agent invokes. There is no separate intake step: the agent reads its budget/preference inputs directly from the same trip-intake state Workflow 1 already collected.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Lens | Individual | Personal/family trip planning; no organizational stakeholders |
| Platform | Trip Shortlister website (existing custom site) | User's explicit direction: continue the standalone site built for Workflow 1 rather than a separate AI-platform skill |
| Platform Mode | code | Custom static site + serverless backend, not a no-code platform |
| Orchestration | Agent | Outcome-driven workflow — Autonomous by definition |
| Involvement | Augmented | Single human gate: the group reviews, votes, and comments on the poll page before anyone books |
| Packaging | Loose Files | Extends the existing site's codebase directly (a new section on the existing intake form, new API endpoints) rather than shipping as a portable skill/plugin/agent bundle |
| Trigger | Immediately follows user approval of the Trip Research Synthesis final shortlist, in the same site session, with no separate input step — runs automatically using whatever was entered in the "Accommodation preferences" section (budget per person, accommodation requirements) shown as part of Workflow 1's own initial intake form | Manual per-trip trigger, chained directly off Workflow 1's own human gate — no scheduling infrastructure needed, and no extra step for the user between the two workflows |

### Autonomy Statement

This is an outcome-driven workflow. Autonomy is **Autonomous** — the agent determines its own execution path (which locations to search, how many rounds of search per location, how to reconcile budget against must-haves) based on the Outcome, Inputs, Rules & Constraints, and Acceptance Criteria defined in the Workflow Requirements.

## Integration Options

### Web Search / Browsing (Domain D1)

**Curated (recommended):**

| Block | Option | Source URL | Trade-off |
|-------|--------|-----------|-----------|
| API (tool) | Anthropic `web_search` tool | https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool | Already wired into the site's existing backend (`website/api/generate.js` uses this exact tool for Workflow 1) — D1's endpoint reuses the identical pattern, just pointed at Airbnb/Booking.com/hotel sites instead of TripAdvisor/Yelp |

**Also available:**

| Block | Option | Source URL | Trade-off |
|-------|--------|-----------|-----------|
| API | Direct Airbnb/Booking.com partner APIs | Each site's own developer/partner program | More structured, reliable data — but needs partner approval and per-site API keys; meaningfully more setup than reusing web search |

*Recommendation: reuse the Anthropic `web_search` tool via the same backend pattern as Workflow 1 — no new integration to stand up.*

### Live Poll & Comment Store (Domain D4)

**Curated (recommended):**

| Block | Option | Source URL | Trade-off |
|-------|--------|-----------|-----------|
| API | Upstash Redis (added from the Vercel Marketplace; REST API) | https://vercel.com/docs/redis | Vercel KV itself was retired and became Upstash Redis, so this is the current form of the original recommendation. No extra hosting account if the backend stays on Vercel; simple hash and list commands fit votes and comments directly, and no client library is needed (plain `fetch`) |

**Also available:**

| Block | Option | Source URL | Trade-off |
|-------|--------|-----------|-----------|
| API | Upstash Redis REST API (direct) | https://upstash.com/docs/redis/features/restapi | Works from any host, not just Vercel — useful if the site ever moves; one more account/key to manage separately from the Vercel deploy |

*Recommendation: Upstash Redis via the Vercel Marketplace, matching the deployment path already documented in the site's README for Workflow 1's backend.*

## Model Recommendation

**Default capability:** reasoning-heavy — D1, D2, and D5 require judgment (search relevance, budget-tier calls, must-have and group-size fit), not just field extraction.

**Per-domain overrides:**
- D3 (page assembly): fast — mostly templating once D1/D2 output already exists.
- D4: no model needed — deterministic.

**Backend mapping** (the site calls the Anthropic API directly, same as Workflow 1 — no separate per-platform mapping needed since there's only one target):
- `claude-sonnet-5` — the model already used in `website/api/generate.js`; Build verifies the current model name before generating.

---

## Layer 2 — Decomposition

## Capability Domain Mapping

(Capability domains are derived by Design from the Workflow Requirements' Outcome, Inputs, Rules, and Acceptance Criteria — they are not present in the Workflow Requirements itself.)

| Domain | Description | Integration (use/build) | Intelligence | Build Output |
|--------|-------------|--------------------------|--------------|--------------|
| D1 | Per-Location Lodging Search — a short planning pass (no web search) chooses the lodging bases and splits the trip's nights from Workflow 1's approved shortlist, then searches Airbnb, Booking.com, and hotel sites per base for 3-5 candidates; handles thin-market and no-nearby-option cases explicitly. *(Build correction: the original design deduplicated the shortlist's `location` field, but those areas include day-trip spots that nobody sleeps in, so the bases need a judgment call.)* | API (tool): `web_search` (use) | Model: reasoning; Context: C1, C2, C3 | New skill: S1 |
| D2 | Suitability, Budget-Tier & Group-Fit Annotation — must-have satisfy/miss, Budget-friendly/Comfort/Stretch-pick tagging (using the per-person budget from C4, scaled by group size), non-refundable flag, single-vs-split-unit logic | — | Model: reasoning; Context: C4 (budget/preferences), group composition | New skill: S2 |
| D3 | Poll & Comparison Page Assembly — groups options by location, renders every required field, embeds the poll/comment widget, generates the share-id the live sync uses | — | Model: fast | Handled by agent |
| D4 | Group Poll & Comment Sync — live backend: thumbs up/down + name-attributed comments per option, short-lived KV store, polling so every open copy of the page converges | API: lightweight KV store (build) | Model: none (deterministic) | New skill: S3 |
| D5 | Feedback-Driven Re-Search — re-invokes D1/D2 for one location with an added requirement pulled from group comments, appends new options rather than starting over | — | Model: reasoning | Handled by agent (re-runs S1/S2) |

### Autonomy Statement

This is an outcome-driven workflow. Autonomy is Autonomous — the agent system determines its own execution path based on the Outcome, Inputs, Rules & Constraints, and Acceptance Criteria defined in the Workflow Requirements.

*(Orchestrator Prompt Outline omitted — mechanism is Agent, so the agent itself is the orchestrator.)*

## Data Readiness Summary

| Context ID | Current State | Required Action | Affects Domains |
|---|---|---|---|
| C1 | Exists, Yes | None — already produced and structured (per-item `location` field) by Workflow 1's own output | D1 |
| C3 | Partial | Rely on the Anthropic `web_search` tool rather than direct per-site API integrations; some booking sites may restrict automated access — acceptable per Rules & Constraints (thin-market disclosure is an explicit, allowed outcome, not a failure) | D1 |
| C4 | Exists once the site adds the "Accommodation preferences" section to Workflow 1's intake form; Yes | Build adds the section (budget per person, accommodation requirements) to the existing intake form — no new step, no new page | D2 |

(C2 — user-provided trip details — is fully AI-accessible; no action required.)

## Recommended Implementation Order

### Quick Wins (implement first)
1. **S1 — lodging-search** — the foundational research capability; delivers standalone value (a comparison list) even before annotation, page assembly, or the poll are wired up.

### Core (implement second)
1. **S2 — suitability-budget-tagging** — depends on S1's candidate list.
2. **D3 — page assembly** (handled by agent) — combines S1 + S2 output into the single HTML page.
3. **A1 — accommodation-search-coordinator** — wires S1 → S2 → D3 together, reading budget/preferences straight from Workflow 1's intake state (C4), and handles D5 (feedback-driven re-search).

### Future Enhancement (optional)
1. **S3 — group-poll-sync** — the live vote/comment backend; the page is fully useful (viewable, shareable, bookable via the direct links) without it — voting/commenting is what it adds on top.
2. **Multi-agent Parallel pattern** — not needed now (see Layer 1 discussion — real trips top out around 2-4 locations); revisit only if per-trip location counts grow large enough that a single agent's search time becomes a real problem.

---

## Layer 3 — Component Blueprints

## Skill Candidates

### S1 — lodging-search

| Field | Detail |
|---|---|
| **ID** | S1 |
| **Name** | lodging-search |
| **Description** | This skill should be used when the accommodation search workflow needs to find candidate lodging options — from Airbnb, Booking.com, and hotel sites — for a specific location and date range, handling thin markets and no-nearby-option cases explicitly rather than silently returning fewer results. |
| **Purpose** | Gathers 3-5 (or fewer, if the market is genuinely thin) candidate lodging listings per location with all required per-option fields. |
| **Covers Domains** | D1 |
| **Inputs** | Location/region name; per-location date range; group size |
| **Outputs** | Candidate list per location: price, star rating, direct property link, photos, amenities, distance to nearby activities (from C1), kid-friendly flag, cancellation policy |
| **Decision Logic** | Prefer listings appearing across multiple sources or with a strong review signal; describe distance to the activity shortlist's locations; if fewer than 3 reasonable options exist, show what's available and note the market is thin rather than forcing a count; if no options exist near a location at all, say so explicitly and show the next-closest available options instead of omitting the location silently. |
| **Failure Modes** | No listings found near a location → broaden search radius before concluding coverage is thin; note the limitation in the output. Booking site blocks automated access → fall back to the other sources in the Rules & Constraints' source list; note if a field (e.g., price) couldn't be confirmed rather than guessing. |
| **Required Tools** | API (tool): Anthropic `web_search` (use) |
| **Depends On** | None |
| **Stateful?** | No |

### S2 — suitability-budget-tagging

| Field | Detail |
|---|---|
| **ID** | S2 |
| **Name** | suitability-budget-tagging |
| **Description** | This skill should be used when the accommodation search workflow needs to annotate a candidate lodging list with must-have satisfy/miss notes, a budget-tier tag, a non-refundable flag, and single-unit-vs-split-unit guidance for the group. |
| **Purpose** | Turns a raw candidate list into a decision-ready comparison by evaluating each option against the group's stated needs and budget. |
| **Covers Domains** | D2 |
| **Inputs** | Candidate list (from S1); group size/composition; budget per person and accommodation preferences (both optional, from C4 — Workflow 1's intake state, not a separate box) |
| **Outputs** | Annotated list: must-have satisfy/miss breakdown, budget tier (Budget-friendly / Comfort / Stretch pick), non-refundable flag, group-fit note (single unit, or a specific suggested split with reasoning) |
| **Decision Logic** | Convert the per-person budget to an effective target nightly rate by multiplying by the whole trip's group size (e.g., $150/person × 6 people = a $900/night target for a single unit that fits everyone) — this is what each option's price is actually compared against. When no option fully matches every must-have (drawn from the accommodation-preferences free text — read only what's actually about lodging, e.g. ignore an unrelated hiking note if the same field ever carries activity content), include the closest options and flag what's missing rather than excluding them. Budget tiers: "Budget-friendly" at/under the target rate, "Comfort" within it at the pricier end, "Stretch pick" only when a budget was given, capped at ~15% over the target, with a one-line reason it earns the stretch (proximity, amenities, fits the full group in one unit). Prefer a single unit that fits the whole group; when none exists, suggest a specific split-unit combination — compared against the same whole-group target rate, not re-scaled per unit — and say so explicitly, never silently. |
| **Failure Modes** | No budget given → skip Stretch-pick tagging entirely, tag only Budget-friendly/Comfort by relative price within the shown options. No reasonable split-unit combination exists → say so directly rather than forcing a weak suggestion. |
| **Required Tools** | None |
| **Depends On** | S1 |
| **Stateful?** | No |

### S3 — group-poll-sync

| Field | Detail |
|---|---|
| **ID** | S3 |
| **Name** | group-poll-sync |
| **Description** | This skill should be used when the generated comparison page needs to record and serve live thumbs-up/down votes and name-attributed comments per lodging option, so every group member viewing the shared page sees the same up-to-date tally without any of it persisting beyond the active session. |
| **Purpose** | Provides the shared, short-lived backend state that makes the embedded poll/comment mechanism work across separate devices. |
| **Covers Domains** | D4 |
| **Inputs** | Share-id (generated at page assembly, D3); a vote (thumbs up/down) or a comment (name + text) submitted by a viewer |
| **Outputs** | Live per-option tally (upvotes, downvotes) and comment list, served to every open copy of the page |
| **Decision Logic** | Deterministic, no model involved: increment/toggle vote counts per option per viewer; append comments with name + timestamp; every open page polls this store every few seconds for updates; entries expire a few days after the share-id's last activity. |
| **Failure Modes** | Store unreachable → page still displays the last-known tally client-side and shows a "reconnecting" note rather than failing silently. Duplicate votes from the same viewer → last vote per person per option wins (a toggle, not an accumulator), tracked by the locally remembered name/device. |
| **Required Tools** | API: lightweight KV store (build — e.g., Vercel KV) |
| **Depends On** | D3 (needs the share-id the assembled page generates) |
| **Stateful?** | Yes — the one stateful component in this workflow, by design; everything else runs fresh per invocation |

## Agent Configuration

### A1 — accommodation-search-coordinator

| Field | Detail |
|---|---|
| **ID** | A1 |
| **Name** | accommodation-search-coordinator |
| **Description** | Use this agent when the user has approved a Trip Research Synthesis shortlist and the accommodation search step should run — automatically right after approval, using whatever budget and accommodation preferences were given in Workflow 1's own intake form, or again later when group feedback on the poll page indicates the current lodging options need to be revised for one or more locations. |
| **Mission** | Produce a single, decision-ready lodging comparison — 3-5 options per location, annotated for must-have fit, budget tier, and group fit — ready to render into the shareable poll page. |
| **Responsibilities** | Read the distinct locations off the approved activity shortlist; read the budget-per-person and accommodation-preferences fields from Workflow 1's intake state (C4) — both may be empty, since they're optional; delegate to S1 per location to gather candidates; delegate to S2 to annotate each candidate (converting the per-person budget to a target nightly rate); assemble the annotated results into the structure the page-assembly step (D3) renders; on a feedback-driven re-run, re-invoke S1/S2 for only the affected location with the added requirement folded in, and merge the new options into the existing set rather than discarding what's there. |
| **Output Format** | A structured per-location list, mirroring Workflow 1's JSON-Lines pattern: one meta line, then one line per lodging option carrying location, price, rating, link, photos, amenities, distance, kid-friendly flag, cancellation policy, must-have satisfy/miss, budget tier, and group-fit note. |
| **Tone & Style** | Concise, plain language, no filler — matches Workflow 1's per-item brevity standard. |
| **Constraints** | Never book, reserve, or pay for anything. Never omit the must-have satisfy/miss note for any listed option. Never silently exclude a location or shorten its option count without a stated reason (thin market / no nearby options). Never present a known non-refundable policy without flagging it. Only research via web search, Airbnb, Booking.com, and hotel sites. |
| **Model** | reasoning-heavy |
| **Memory Scope** | none — each search run is fresh; the only state that persists within a trip's session lives in S3, not in the agent |
| **Tools** | Anthropic `web_search` tool |
| **Skills** | S1, S2 |
| **Trigger Examples** | See below |

**Trigger Examples:**

<example>
Context: When first describing a multi-family Hawaii trip to Workflow 1, the user filled in the "Accommodation preferences" section with "$150/night per person" and "would love a yard for the kids." The trip spans three towns.
user: [clicks "Looks good" on the Workflow 1 final shortlist]
assistant: "I'll use the accommodation-search-coordinator agent to search lodging for each of the three areas from your shortlist, using the $150/person budget and the yard preference you gave at the start, and put together a comparison your group can vote on."
<commentary>No separate input step — approving the Workflow 1 shortlist is the only trigger; budget and preferences were already captured earlier.</commentary>
</example>

<example>
Context: User left the "Accommodation preferences" section blank when describing the trip — both fields are optional.
user: [clicks "Looks good" on the Workflow 1 final shortlist]
assistant: "Searching lodging near each of your trip's locations now — no budget or specific preferences were given, so I'll show the general spread of good options per area."
<commentary>Both fields are optional per the Workflow Requirements; the agent still runs automatically, just without budget-tier Stretch-pick tagging (which requires a stated budget).</commentary>
</example>

<example>
Context: The group has been voting and commenting on the poll page, and two people commented that none of the Kona-area options have a pool, which matters for the group.
user: [comment on the poll page: "none of these have a pool — that's kind of a must for us"]
assistant: "I'll re-run the accommodation-search-coordinator agent for the Kona area with 'pool' added as a requirement, and add any new matches to the comparison without removing what's already there."
<commentary>Feedback-driven re-search (D5) — re-invokes the same agent scoped to one location, appending rather than replacing.</commentary>
</example>

*(No Multi-Agent Configuration — single-agent design; see Layer 1's Execution Pattern for why parallel agents weren't chosen.)*

## Prerequisites

1. The site's backend (already deployed per Workflow 1's setup) needs its `ANTHROPIC_API_KEY` environment variable in place — reused directly, no separate key needed.
2. An Upstash Redis database for S3, added from the Vercel Marketplace — new prerequisite not needed for Workflow 1's backend.
3. A function runtime long enough for one lodging search (allowed up to 120 seconds each; Vercel Hobby with fluid compute allows up to 300). Trips with several places to stay run one search per place, one after another, so no single request has to cover the whole trip.

## Deployment Plan

| Artifact | Target Location | Deployment Steps |
|---|---|---|
| S1 + S2 + A1 | `website/api/accommodations.js` + `website/api/_accommodation.js` (instructions and deterministic checks), following the same pattern as `api/generate.js` + `api/prompt.js` | Built; deploys alongside the existing site (same Vercel project, no separate deploy) |
| Intake form change | Existing `planner.html` intake form | Built: an "Where you'll stay (optional)" section with budget per person and accommodation preferences, alongside the existing fields; no new step or page |
| D3 (page assembly, site logic) | `website/js/planner.js`, `website/js/lodging.js`, `website/stay.html` + `website/js/stay.js` | Built: "Looks good, find places to stay" runs the search and renders the comparison; the same view powers the shared `stay.html?share=ID` page the group opens |
| S3 | `website/api/poll.js` + `website/api/_redis.js` + an Upstash Redis database | Built; add the Redis database from the Vercel Marketplace to turn on sharing and voting |

**Packaging note:** Everything ships as more files in the same `website/` codebase already built for Workflow 1 — no separate skill upload, no new platform account beyond the Redis database. This is a direct continuation, not a new product.

**Recommended for frequent use:** No action needed — it's already part of the same site people can revisit any time.

---

## Cross-Layer Sections

## Evaluation Inputs

Acceptance Criteria, Example Scenarios, and Human Gates are sourced from the Workflow Requirements file (`workflow-2-accommodation/requirements.md`). Do not duplicate them here — Test (Step 5) reads them from that file directly.

## Deferred to Build

Resolved during Build:
- [x] KV provider: Upstash Redis via the Vercel Marketplace, over its REST API (Vercel KV was retired). Reads `KV_REST_API_*` or `UPSTASH_REDIS_REST_*` variables.
- [x] Timeout: one search call per lodging base, up to 120 seconds each (Hobby with fluid compute allows 300).
- [x] Polling interval: every 6 seconds while the page is visible; paused when the tab is hidden.
- [x] Remembered name: stored in the browser's localStorage only. A vote's identity is the typed name (not case-sensitive), so it is a convenience, not security; anyone with the link can vote under any name.
- [x] Model: `claude-sonnet-5` with the `web_search_20250305` tool, the same as Workflow 1.

## Build Notes

Decisions Build made that the spec left open or got wrong:
- **Lodging bases need a judgment call (D1).** Planning call chooses where to sleep and splits the nights; day-trip areas are not searched. See the correction in the D1 row.
- **One search per base, run sequentially,** rather than one request for the whole trip. This stays a single agent (A1) as designed; it just runs once per base, which also lets a failed base be retried alone.
- **Budget tiers are computed by the server, not the model.** Target nightly rate = budget per person x group size. Budget-friendly is at or under 75% of the target, Comfort is up to 100%, Stretch pick is up to 15% over with a stated reason (at most one per base), and anything further over is flagged as over budget. The 75% line is Build's reading of "Budget-friendly vs. Comfort", which the requirements did not define.
- **Server-side guards.** Options without a real http(s) link, a price, or a rating are dropped; fewer than 3 options flips the base to "thin market" with a note; zero options flips it to "nothing nearby".
- **A shared page needs the comparison itself stored,** not just votes. The saved snapshot lives under an unguessable share id for 5 days after the last activity; only the owner's key can replace it.
- **No booking, ever.** Every option links out to the listing; the page says prices are estimates to confirm.
- **Photos** are shown only when a listing's image URL was found; they stay hidden until loaded.

*(No Stakeholders section — Individual lens.)*

## Self-Test Summary

### Structure
- ✓ Frontmatter present with all required fields
- ✓ Source section names Workflow Requirements file
- ✓ Architecture Decisions table complete (7 rows)
- ✓ Capability Domain Mapping complete with all 5 domain IDs (D1–D5)
- ✓ Autonomy Statement present (Autonomous, outcome-driven)
- ✓ All Integration column entries follow the `block: tool (use/build)` format
- ✓ All Build Output values use canonical forms (`New skill: SN` / `Handled by agent`)
- ✓ Packaging value uses a canonical form (`Loose Files`)

### Skill Candidates
- ✓ Every `New skill: SN` reference (S1–S3) has a matching entry
- ✓ Every skill has all 12 fields
- ✓ Every skill Name conforms to format rules (lowercase-hyphen, ≤64 chars, no consecutive hyphens)
- ✓ Every skill Description starts with "This skill should be used when..." and is ≤1024 chars

### Agent Configuration
- ✓ A1 reference has a matching entry
- ✓ Agent has all 13 fields
- ✓ Agent Description starts with "Use this agent when..." and is ≤1024 chars
- ✓ Multi-Agent Configuration correctly omitted (only 1 agent defined)

### Cross-references
- ✓ Every tool in the Integration column has a matching Integration Options entry with a Source URL
- ✓ Every skill `Depends On` reference points to a defined skill ID or domain (S1; D3)

### Mechanism-specific
- ✓ Orchestrator Prompt Outline correctly omitted (mechanism is Agent)
- ✓ Agent Configuration present (mandatory for outcome-driven)

### Completeness
- ✓ Model Recommendation present with default capability and per-domain overrides
- ✓ Data Readiness Summary present (C1 ready, C3 flagged with required action)
- ✓ Deployment Plan present with target location, deployment steps, and Packaging note
- ✓ Evaluation Inputs present (pointer only, not duplicated)
- ✓ Deferred to Build present

**One noted deviation:** this spec's Platform is a custom-built site rather than a registry AI platform (ChatGPT, Claude.ai, etc.), per the user's explicit direction to continue the site already built for Workflow 1. Platform Mode is therefore `code`, and the Model Recommendation's "per-platform mapping" is replaced with a single "backend mapping," since there's only one target rather than several AI platforms to map across.
