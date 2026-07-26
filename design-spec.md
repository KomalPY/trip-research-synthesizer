---
workflow: trip-research-synthesis
requirements_file: outputs/trip-research-synthesis-requirements.md
spec_version: 2.1
definition_type: Outcome-Driven
mechanism: Agent
involvement: Augmented
platform: ChatGPT (browser) + Claude.ai (web/mobile) — dual-target
platform_mode: guided
packaging: Workspace Agent (ChatGPT) / Standalone Skill (Claude.ai)
counts:
  domains: 7
  skills: 5
  agents: 1
  integrations: 2
---

# Trip Research Synthesis — Design Spec

## Source

**Workflow Requirements:** `outputs/trip-research-synthesis-requirements.md`

This Design Spec consumes the Workflow Requirements as canonical input. Outcome, Metadata, Context Inventory, Acceptance Criteria, Example Scenarios, and Human Gates are defined there — not restated here. Read the Workflow Requirements alongside this spec when building.

---

## Layer 1 — Architecture

## Execution Pattern

**Agent** — this is an outcome-driven workflow; autonomy is Autonomous by definition, so the agent determines its own research-and-synthesis path rather than following a fixed script. A single agent orchestrates, delegating to five skills.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Lens | Individual | Personal/family trip planning; no organizational stakeholders |
| Platform | ChatGPT (browser) + Claude.ai (web/mobile) — dual-target | User wants both; same Layer 1-3 design, two separate Build outputs |
| Platform Mode | guided (both) | Both platforms are no-code/guided per the platform registry — simplifies Build, no code artifacts needed |
| Orchestration | Agent | Outcome-driven workflow — Autonomous by definition |
| Involvement | Augmented | Manual trigger per trip; two human gates keep the user in the loop |
| Packaging | Workspace Agent (ChatGPT) / Standalone Skill with embedded agent spec (Claude.ai) | ChatGPT bundles orchestration + skills + tools natively as a Workspace Agent; Claude.ai has no standalone sub-agent primitive, so the agent spec ships inside the skill's `agents/` folder |
| Trigger | User starts planning a trip with destination, dates, group composition, and optional reference doc | Manual, ad-hoc per trip — no scheduling infrastructure needed |

### Autonomy Statement

This is an outcome-driven workflow. Autonomy is **Autonomous** — the agent system determines its own execution path based on the Outcome, Inputs, Rules & Constraints, and Acceptance Criteria defined in the Workflow Requirements.

## Integration Options

### Google Drive / Docs / Sheets (Domain D2)

**Curated (recommended):**

| Block | Option | Source URL | Trade-off |
|-------|--------|-----------|-----------|
| Connector | Google Drive connector (native) | ChatGPT: https://help.openai.com/en/articles/20001143-chatgpt-workspace-agents-for-enterprise-and-business · Claude.ai: https://support.claude.com/en/articles/12512198-how-to-create-custom-skills | Easiest — no code, native to both guided-mode platforms |

**Also available:**

| Block | Option | Source URL | Trade-off |
|-------|--------|-----------|-----------|
| CLI | Google Workspace CLI | https://github.com/googleworkspace/cli | More flexible, but requires a code-mode environment — doesn't fit ChatGPT/Claude.ai guided mode |

*Recommendation: native Google Drive connector on both platforms.*

### Web Search, Review Sites & Tourism Boards (Domains D3, D6)

**Curated (recommended):**

| Block | Option | Source URL | Trade-off |
|-------|--------|-----------|-----------|
| Built-in browsing | Native web browsing (ChatGPT & Claude.ai) | ChatGPT: https://help.openai.com/en/articles/11752874-chatgpt-agent · Claude.ai: platform-native | Zero setup, already available in guided mode |

*Recommendation: rely on native browsing for web search, TripAdvisor, Google Reviews, Yelp, and local tourism boards; no custom integration to build.*

## Model Recommendation

**Default capability:** reasoning-heavy — the agent and skills S2/S3/S4 involve multi-source synthesis and judgment calls (age/group fit, conflict resolution).

**Per-step overrides:**
- S1 (reference-doc-ingestion), S5 (context-enrichment): fast — mostly extraction/lookup, less open-ended judgment.

**Per-platform mapping** (Build verifies current names):
- ChatGPT: `gpt-5` or `o3` (reasoning-heavy) / `gpt-4o-mini` (fast)
- Claude.ai: `opus` (reasoning-heavy) / `haiku` (fast)

---

## Layer 2 — Decomposition

## Capability Domain Mapping

(Capability domains are derived by Design from the Workflow Requirements' Outcome, Inputs, Rules, and Acceptance Criteria — they are not present in the Workflow Requirements itself.)

| Domain | Description | Integration (use/build) | Intelligence | Build Output |
|--------|-------------|-------------------------|--------------|--------------|
| D1 | Trip Intake & Clarification — parse destination/dates/group/notes; ask for clarification if group composition incomplete | — | Model: fast | Handled by agent |
| D2 | Reference Material Ingestion — open and parse the optional Google Doc/Sheet | Connector: Google Drive (use) | Model: fast; Context: C1 | New skill: S1 |
| D3 | Destination Research — web search + review sites + tourism boards → candidate places/activities | Built-in browsing (use) | Model: reasoning; Context: C2, C3, C4 | New skill: S2 |
| D4 | Suitability & Alternates Analysis — age/group-fit notes + alternates | — | Model: reasoning-heavy; Context: group composition | New skill: S3 |
| D5 | Cross-Source Reconciliation — duplicate/conflict flagging vs. reference doc | — | Model: reasoning; Context: reference doc + research findings | New skill: S4 |
| D6 | Context Enrichment — weather, travel time, transportation, budget (local currency) | Built-in browsing (use) | Model: fast/reasoning; Context: trip dates, locations | New skill: S5 |
| D7 | Draft & Final Assembly — group by location/day-range, manage both human gates | — | Model: fast; Context: all prior domain outputs | Handled by agent |

### Autonomy Statement

This is an outcome-driven workflow. Autonomy is Autonomous — the agent system determines its own execution path based on the Outcome, Inputs, Rules & Constraints, and Acceptance Criteria defined in the Workflow Requirements.

*(Orchestrator Prompt Outline omitted — mechanism is Agent, so the agent itself is the orchestrator.)*

## Data Readiness Summary

| Context ID | Current State | Required Action | Affects Domains |
|---|---|---|---|
| C1 | Partial | Connect a Google Drive account via the platform's native connector (ChatGPT Connectors / Claude.ai Connectors) so the agent can open the reference doc link | D2 |
| C3 | Partial | Rely on native browsing rather than direct API scraping; some review sites may restrict automated access — acceptable per Rules & Constraints (budget/fee estimates are optional when unavailable) | D3, D5, D6 |
| C4 | Partial | Same as C3 — rely on native browsing; quality/structure varies by destination | D3 |

(C2 — general web search — is fully AI-accessible; no action required.)

## Recommended Implementation Order

### Quick Wins (implement first)
1. **S2 — destination-research** — the foundational research capability every other skill depends on; delivers standalone value even before the rest is wired up.

### Core (implement second)
1. **S1 — reference-doc-ingestion** — needed to unlock duplicate/conflict detection (S4)
2. **S3 — suitability-alternates** — depends on S2's output
3. **S4 — cross-source-reconciliation** — depends on S1 and S2/S3
4. **A1 — trip-research-synthesizer agent** — wires S1–S4 together with intake (D1) and the draft review gate

### Future Enhancement (optional)
1. **S5 — context-enrichment** — the post-approval enrichment pass; can start manual and be automated once the core loop is validated

---

## Layer 3 — Component Blueprints

## Skill Candidates

### S1 — reference-doc-ingestion

| Field | Detail |
|---|---|
| **ID** | S1 |
| **Name** | reference-doc-ingestion |
| **Description** | This skill should be used when the trip research workflow needs to open and normalize a user-provided reference document or spreadsheet (Google Doc or Google Sheet) containing prior trip suggestions from a friend or co-traveler, so those suggestions can be cross-referenced against new research. |
| **Purpose** | Parses a linked Google Doc/Sheet into a normalized list of prior suggestions for downstream reconciliation. |
| **Covers Domains** | D2 |
| **Inputs** | Reference doc/sheet link (URL); trip destination (for context) |
| **Outputs** | Normalized list of place/activity names plus any notes already present in the doc |
| **Decision Logic** | Extract structured items from unstructured/semi-structured lists; preserve original phrasing/notes for later duplicate matching; if the doc contains no relevant content, return an empty list with a note. |
| **Failure Modes** | Link inaccessible/permission denied → proceed without it, flag in output that reference doc could not be read. Doc format unrecognized/empty → return empty list, note doc was empty or unreadable. |
| **Required Tools** | Connector: Google Drive (use) |
| **Depends On** | None |
| **Stateful?** | No |

### S2 — destination-research

| Field | Detail |
|---|---|
| **ID** | S2 |
| **Name** | destination-research |
| **Description** | This skill should be used when the trip research workflow needs to search the web, review sites, and local tourism boards to surface candidate places and activities for a given destination and trip dates. |
| **Purpose** | Gathers a broad candidate list of places/activities from web search, TripAdvisor, Google Reviews, Yelp, and local tourism boards. |
| **Covers Domains** | D3 |
| **Inputs** | Destination, trip dates, group composition (for relevance filtering hints) |
| **Outputs** | Candidate list of places/activities with source, rating/review signal, and city/region tag |
| **Decision Logic** | Prioritize items appearing across multiple sources; tag tourist-favorite vs. local-favorite based on review site provenance and mention frequency; cross-check operating status against the most recent source available. |
| **Failure Modes** | No results for a niche destination → broaden search radius, note limited availability. Conflicting operating-status signals → flag uncertainty rather than asserting open/closed. |
| **Required Tools** | Native web browsing (use) |
| **Depends On** | None |
| **Stateful?** | No |

### S3 — suitability-alternates

| Field | Detail |
|---|---|
| **ID** | S3 |
| **Name** | suitability-alternates |
| **Description** | This skill should be used when the trip research workflow needs to evaluate which places or activities from a candidate list are appropriate for the group's age range and composition, and to suggest an alternate for anything that doesn't fit the whole group. |
| **Purpose** | Annotates each candidate item with who it accommodates and provides alternates for poor fits. |
| **Covers Domains** | D4 |
| **Inputs** | Candidate list (from S2), group composition (ages/count) |
| **Outputs** | Annotated list with "accommodative of" notes and alternate suggestions where needed |
| **Decision Logic** | Evaluate against the youngest and oldest in the group; note partial fits (e.g., "great for older kids, may be too intense for toddlers") rather than binary include/exclude; alternates should be comparable in category and location. |
| **Failure Modes** | Group composition incomplete → ask user to clarify, or proceed with a general-audience assumption explicitly noted. No reasonable alternate exists → note item as "no direct alternate found" rather than fabricating one. |
| **Required Tools** | None |
| **Depends On** | S2 |
| **Stateful?** | No |

### S4 — cross-source-reconciliation

| Field | Detail |
|---|---|
| **ID** | S4 |
| **Name** | cross-source-reconciliation |
| **Description** | This skill should be used when the trip research workflow needs to compare the user's reference doc suggestions against newly researched candidates to flag duplicates and conflicting information. |
| **Purpose** | Detects overlaps between reference doc items and research results, and flags contradictions (e.g., closure status, rating mismatch). |
| **Covers Domains** | D5 |
| **Inputs** | Normalized reference doc list (from S1), candidate list (from S2/S3) |
| **Outputs** | Reconciled list with duplicate flags and conflict notes |
| **Decision Logic** | Match items by name/location similarity (fuzzy matching for naming variants); when the reference doc and research disagree (e.g., reviews say closed, doc says open), preserve the reference doc's suggestion but flag the conflict rather than silently resolving it. |
| **Failure Modes** | No reference doc provided → skip this skill's duplicate-flagging logic entirely (only applies when a reference doc exists). Ambiguous name match (same name, different location) → treat as distinct items, don't merge. |
| **Required Tools** | None |
| **Depends On** | S1, S2 |
| **Stateful?** | No |

### S5 — context-enrichment

| Field | Detail |
|---|---|
| **ID** | S5 |
| **Name** | context-enrichment |
| **Description** | This skill should be used when the trip research workflow needs to add weather and seasonal fit, travel time between locations, transportation mode, and budget or fee estimates to a finalized shortlist of places and activities, after the user has approved the draft. |
| **Purpose** | Enriches the approved draft list with logistics and cost details ahead of final delivery. |
| **Covers Domains** | D6 |
| **Inputs** | Approved draft list (post human gate), trip dates, destination, lodging locations (if known) |
| **Outputs** | Enriched list with weather note, travel time, transportation mode, and fee/budget estimate per item |
| **Decision Logic** | Use actual forecast if the trip is within ~10-14 days out, otherwise seasonal/historical climate norms; express fees in the destination's local currency; note when a valid budget estimate isn't obtainable rather than guessing. |
| **Failure Modes** | Fee/budget data unavailable → omit with a valid-reason note (acceptable per Minimum Bar, not a failure). Travel time unclear (e.g., ambiguous transit routes) → provide an estimate range, flag as approximate. |
| **Required Tools** | Native web browsing (use) |
| **Depends On** | S3 |
| **Stateful?** | No |

## Agent Configuration

### A1 — trip-research-synthesizer

| Field | Detail |
|---|---|
| **ID** | A1 |
| **Name** | trip-research-synthesizer |
| **Description** | Use this agent when the user wants to plan a trip and needs a consolidated shortlist of places and activities synthesized from web research, review sites, and any reference materials they've been given, filtered for their group's ages and size. This agent should be used at the start of trip planning — before booking accommodations or building a day-by-day itinerary — since its output feeds those downstream workflows. |
| **Mission** | Produce a concise, easy-to-read shortlist of trip places and activities, grouped by location and loosely by day range, reconciled across the user's reference material and fresh research, filtered for the group's composition. |
| **Responsibilities** | Parse trip intake and ask for clarification if group composition is incomplete; delegate to S1 when a reference doc is provided; delegate to S2 to gather candidates; delegate to S3 to annotate suitability/alternates; delegate to S4 to flag duplicates/conflicts; assemble and present the draft list for review (human gate 1); after approval, delegate to S5 to enrich with weather/travel/transport/budget; assemble and present the final shortlist for review (human gate 2). |
| **Output Format** | A single markdown document, grouped by city/region location then loosely clustered by day range; each item as a short entry with name, 1-2 line description, who it accommodates (+ alternate if needed), duplicate/conflict flags, reservation-needed flag, tourist/local-favorite tag, and (post-enrichment) weather note, travel time, transportation mode, and budget estimate in local currency. |
| **Tone & Style** | Concise, plain language, no filler; terse per-item notes even as the list grows with trip size. |
| **Constraints** | Never include permanently closed places; never omit local-favorite or weather/seasonal call-outs; never silently resolve a reference-doc conflict — always flag it; research only via web search, TripAdvisor, Google Reviews, Yelp, local tourism boards, and the user's reference doc; does not book anything or build a precise time-slotted day-by-day schedule (out of scope — handled by the downstream Day-by-Day Itinerary Builder). |
| **Model** | reasoning-heavy |
| **Memory Scope** | none — each trip is planned fresh, no cross-session state needed |
| **Tools** | Native web browsing (built-in), Google Drive connector |
| **Skills** | S1, S2, S3, S4, S5 |
| **Trigger Examples** | See below |

**Trigger Examples:**

<example>
Context: User is starting to plan a family trip and has been given a spreadsheet of suggestions by a friend.
user: "We're planning a trip to the Big Island of Hawaii for 15 people across 4 families, ages 1-16, for 6 days. Here's the spreadsheet my friend sent: [link]. Can you help me figure out what to do?"
assistant: "I'll use the trip-research-synthesizer agent to research the Big Island, cross-reference your friend's spreadsheet, and put together a filtered shortlist for your group."
<commentary>Destination, group composition, duration, and a reference doc were all provided — the trigger conditions for this agent.</commentary>
</example>

<example>
Context: User wants to plan a short solo trip with no reference material.
user: "I'm going to New York solo for 3 days next month, age 35. What should I do?"
assistant: "Let me use the trip-research-synthesizer agent to put together a tight, prioritized shortlist for your NYC trip."
<commentary>No reference doc is provided — the agent still runs, skipping reference-doc-dependent steps like duplicate flagging.</commentary>
</example>

<example>
Context: User asks a downstream question about booking, not research.
user: "Can you book this Airbnb for me?"
assistant: "That's outside what the trip-research-synthesizer agent does — it only produces the research shortlist, not bookings. I'll flag this as a separate accommodation-booking task instead."
<commentary>Booking is out of scope per the workflow's Scope Boundaries — the agent should not be invoked for this.</commentary>
</example>

*(No Multi-Agent Configuration — this is a single-agent design.)*

## Prerequisites

1. Connect a Google account via the platform's native connector (ChatGPT Connectors or Claude.ai Connectors) so the agent can open shared Google Docs/Sheets links.
2. Ensure the chosen platform's native web browsing capability is enabled (on by default for ChatGPT and Claude.ai in guided mode).
3. For ChatGPT: Workspace Agent creation requires a plan tier that supports Workspace Agents (Team/Enterprise/Business per OpenAI's own requirements) — confirm access before Build.
4. For Claude.ai: Skill upload requires the Skills feature to be enabled on the account/workspace.

## Deployment Plan

| Artifact | Target Location | Deployment Steps |
|---|---|---|
| A1 + S1–S5 (ChatGPT) | ChatGPT Workspace Agent | Build generates agent instructions + skill definitions; user creates a Workspace Agent in ChatGPT, pastes in instructions, attaches skills, connects the Google Drive connector |
| A1 + S1–S5 (Claude.ai) | Claude.ai Standalone Skill (zip upload) | Build generates a SKILL.md + `agents/` folder containing A1's spec; user zips and uploads via Customize > Skills; connects the Google Drive connector |

**Packaging note:** Each platform gets its own artifact bundle from the same Layer 1–3 design — ChatGPT as a Workspace Agent, Claude.ai as a Standalone Skill with an embedded agent spec. No plugin bundling needed; this is a single-agent, single-workflow design for personal (Individual lens) use.

**Recommended for frequent use:** Save as a Claude Project or ChatGPT Project for one-click reuse across trips.

---

## Cross-Layer Sections

## Evaluation Inputs

Acceptance Criteria, Example Scenarios, and Human Gates are sourced from the Workflow Requirements file (`outputs/trip-research-synthesis-requirements.md`). Do not duplicate them here — Test (Step 5) reads them from that file directly.

## Deferred to Build

- [ ] Exact Workspace Agent creation steps and plan-tier requirements on ChatGPT
- [ ] Exact Claude.ai skill zip packaging steps and `agents/` folder format
- [ ] Exact model version per platform (mapping above is guidance; Build verifies current names)
- [ ] Google Drive connector auth flow specifics on each platform

*(No Stakeholders section — Individual lens.)*

## Self-Test Summary

### Structure
- ✓ Frontmatter present with all required fields (adapted for dual-platform: platform/packaging fields list both target platforms explicitly)
- ✓ Source section names Workflow Requirements file
- ✓ Architecture Decisions table complete (7 rows)
- ✓ Capability Domain Mapping complete with all 7 domain IDs (D1–D7)
- ✓ Autonomy Statement present (Autonomous, outcome-driven)
- ✓ All Integration column entries follow the `block: tool (use/build)` format
- ✓ All Build Output values use canonical forms (`New skill: SN` / `Handled by agent`)
- ✓ Packaging value uses canonical forms per platform (`Workspace Agent` / `Standalone Skill`)

### Skill Candidates
- ✓ Every `New skill: SN` reference (S1–S5) has a matching entry
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
- ✓ Every skill `Depends On` reference points to a defined skill ID (S1–S5, or "None")

### Mechanism-specific
- ✓ Orchestrator Prompt Outline correctly omitted (mechanism is Agent)
- ✓ Agent Configuration present (mandatory for outcome-driven)

### Completeness
- ✓ Model Recommendation present with default capability and per-platform mapping
- ✓ Data Readiness Summary present (C1, C3, C4 flagged with required actions; C2 noted as ready)
- ✓ Deployment Plan present with target location, deployment steps, and Packaging note (per platform)
- ✓ Evaluation Inputs present (pointer only, not duplicated)
- ✓ Deferred to Build present

**One noted deviation:** this spec targets two platforms (ChatGPT + Claude.ai) rather than the standard single-platform template, per the user's explicit choice. Every platform-sensitive field (Platform, Packaging, Integration Options, Model Recommendation, Deployment Plan) lists both platforms separately rather than arbitrarily picking one.
