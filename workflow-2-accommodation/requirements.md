# Accommodation Search & Group Booking Coordination — Workflow Requirements

## Outcome
The workflow produces a single shareable HTML page comparing 3-5 lodging options per location the trip involves (flexing to however many locations the trip spans), each annotated against the group's must-haves and budget, with a poll built in for the group to review, vote, and comment. It runs as the second step of the trip-planning multi-agent flow, immediately after Trip Research Synthesis, consuming that workflow's activity shortlist as input. The user and their group consume the output together to reach consensus before anyone books lodging directly through the linked properties.

## Metadata

| Field | Value |
|---|---|
| Workflow Name | Accommodation Search & Group Booking Coordination |
| Description | Shortlists lodging per location against group constraints and produces a shareable comparison-and-poll page so the group can reach consensus before booking |
| Trigger | Immediately follows user approval of the Trip Research Synthesis final shortlist, in the same site session — runs automatically with no separate input step, using the approved shortlist plus whatever was entered in the "Accommodation preferences" section (budget per person, accommodation requirements) shown as part of Workflow 1's own initial trip-intake form |
| Owner | Individual (self-service) |
| Lens | Individual |
| Definition Type | Outcome-Driven |
| Business Objective | Eliminate duplicated search-and-compare work across multiple lodging locations and shorten group consensus-building before booking; second stage in the upstream-dependent trip-planning chain (consumes Trip Research Synthesis output, precedes Day-by-Day Itinerary) |

---

## Inputs

- Trip dates and per-location date ranges (if lodging splits across locations)
- Group size and composition
- Budget per person (optional — free text, e.g. "$150/night per person"; scales by the whole group's size to a target nightly rate for a single unit that fits everyone)
- Accommodation preferences (optional — free text; covers amenities as well as things like accessibility needs, not just a fixed checklist)
- Activity shortlist output from Trip Research Synthesis (used to compute distance-to-activities and to confirm which locations/regions need lodging)

Budget per person and Accommodation preferences are collected together in a dedicated "Accommodation preferences" section shown as part of Workflow 1's own initial trip-intake form (destination, dates, group, notes) — not a separate step or page. Both are optional; the section exists so the user knows the option is there without having to fill it in before starting.

## Rules & Constraints

- **Must do:**
  - Shortlist 3-5 lodging options per location; flex the number of locations to however many the trip's activity shortlist spans
  - Show which of the group's must-haves each option satisfies vs. misses
  - When no full-match option exists for a location, include close-but-not-perfect options and flag what they miss, rather than returning nothing
  - Show slightly-over-budget options, flagged as over budget, rather than excluding them outright
  - Tag each option with a budget tier so the spread is legible at a glance: "Budget-friendly" (at or under budget), "Comfort" (within budget, pricier end), and — only when the user provided a budget — one "Stretch pick" capped at roughly 15% over budget, with a one-line reason it's worth the stretch (e.g., proximity to activities, fits the full group in one unit, notably higher rating)
  - Flag non-refundable cancellation policies on every option where known
  - Prefer a single unit that accommodates the full group; when no such property is available, suggest splitting across multiple units and note this explicitly
  - Include per option: price, star rating, direct property link, photos, amenities, distance to nearby activities (from the Trip Research Synthesis output), kid-friendly flags, and cancellation policy
  - If a location has no nearby lodging options, state that explicitly and show the next-closest available options rather than omitting the location silently
  - If a location's lodging market is thin (fewer than 3-5 reasonable options), show what's available and note that the market is thin rather than forcing a count
  - Generate a single shareable HTML page containing the comparison and an embedded poll/commenting mechanism for the group to review and react to within that session
  - Leave booking to the user — provide direct property links for the user/group to book through, rather than booking anything itself
- **Must never do:**
  - Book or reserve lodging on the user's behalf
  - Omit the must-have satisfy/miss breakdown for any listed option
  - Silently exclude a location or shorten its option count without noting why
  - Present a known non-refundable policy without flagging it
- **Scope boundaries:** Produces the comparison-and-poll page only. Does not book, reserve, or pay for lodging. Does not persist poll responses or comparison data beyond the session the page is viewed in — no cross-session memory or tracking. Does not build the day-by-day schedule (handled by the downstream Day-by-Day Itinerary workflow).
- **Tone / format / length:** Single HTML page; per-option entries stay scannable (comparable in brevity to Trip Research Synthesis's per-item notes) even as location count grows.
- **Source restrictions:** Lodging research draws from general web/Google browsing, Airbnb, Booking.com, and hotel sites.

## Context Inventory

| ID | Artifact | Used By | Status | AI Accessible | Location / Source | Key Contents |
|---|---|---|---|---|---|---|
| C1 | Trip Research Synthesis output | All | Exists (produced by upstream workflow) | Yes | Output of the trip-research-synthesizer agent (Workflow #1) | Activity/place shortlist grouped by city/region and loose day range — used to determine which locations need lodging and to compute distance-to-activities |
| C2 | User-provided trip details | All | Exists | Yes | Direct user input at workflow start | Trip dates, per-location date ranges, group size/composition (budget and accommodation preferences are covered separately in C4, not here) |
| C3 | Lodging search sources | Lodging search | Exists | Partial | Public web via Google browsing, Airbnb, Booking.com, hotel sites | Listings, pricing, amenities, photos, cancellation policy, star ratings; some sites may restrict automated access |
| C4 | Accommodation preferences section from Workflow 1's intake | Suitability & budget-tier annotation | Exists (once the site adds this section) | Yes | Same site session's stored form state, collected alongside Workflow 1's trip details | Budget per person (optional free text) and accommodation requirements (optional free text) |

## Acceptance Criteria

### What good output looks like
A single HTML page listing 3-5 lodging options per location (flexing to however many locations the trip spans), each showing price, star rating, a direct property link, photos, amenities, distance to nearby activities, kid-friendly flags, and cancellation policy. Each option explicitly notes which of the group's must-haves it satisfies vs. misses. Where no full match exists, close options appear flagged rather than being omitted. Slightly-over-budget options are shown flagged, not excluded. Non-refundable options are flagged. Where no single unit fits the full group, split-unit suggestions are offered. The page includes a poll/commenting mechanism so the group can review and react together in that session.

### Dimensions that matter
- Must-have transparency — every option states what it satisfies vs. misses
- Budget flexibility — over-budget options shown flagged, not silently excluded
- Cancellation clarity — non-refundable status flagged wherever known
- Group-fit handling — full-group unit preferred; split-unit suggested and noted when unavailable
- Location coverage — thin markets and no-nearby-option cases are disclosed, not silently shortened
- Proximity awareness — distance to activities (from Trip Research Synthesis output) included per option
- Budget-tier clarity — options read at a glance as budget-friendly, comfort, or (when applicable) a flagged stretch pick, not just a single over/under-budget boolean
- Shareability — single page, group-reviewable, with built-in voting/commenting

### Minimum bar
Unacceptable if: an option is listed without a price, star rating, or property link; a location has no nearby options and that isn't disclosed; an option is shown without a must-have satisfy/miss note; a known non-refundable policy isn't flagged; or lodging is booked without user action.

## Example Scenarios

| ID | Scenario | Input | What to look for in the output |
|---|---|---|---|
| E1 | Multi-family Hawaii trip | Big Island, Hawaii; group of 15 across 4 families; ages 1–16; 6 days; multiple towns/areas per Trip Research Synthesis output | Split-unit suggestions given group size; options grouped per town/area; distance-to-activity notes reflect travel between areas; kid-friendly and must-have flags prominent given wide age range |
| E2 | Girls' trip, no kids | Arizona; group of 3; age 25; 4 days | Likely single location; fewer must-haves to filter on; star rating and local-favorite lodging quality weigh more heavily than kid-friendly flags |
| E3 | Solo NYC trip | New York; solo traveler; age 35; 3 days | Single location, smaller/budget-friendly unit options; must-have list likely short; tight, prioritized shortlist rather than exhaustive |

## Human Gates

| Where | What requires human input |
|---|---|
| Comparison + poll page review | Once the HTML comparison-and-poll page is generated, the user and group review, vote, and comment on it before anyone books; this is the workflow's single human gate |
