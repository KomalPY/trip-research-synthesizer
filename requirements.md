# Trip Research Synthesis — Workflow Requirements

## Outcome
The workflow produces a single, easy-to-read shortlist document of places and activities for a trip, grouped first by city/region location and then loosely clustered into day ranges (not a precise day-by-day schedule). It runs whenever the user begins planning a trip and provides destination, dates, group composition, and any preference notes. The user consumes the output directly to finalize their trip plan and to feed the downstream Accommodation Search and Day-by-Day Itinerary workflows.

## Metadata

| Field | Value |
|---|---|
| Workflow Name | Trip Research Synthesis |
| Description | Consolidates a reference doc, web research, and reviews into one filtered shortlist tailored to the group's ages and size |
| Trigger | User starts planning a trip with a destination, trip dates, group composition, and optionally a reference doc/spreadsheet |
| Owner | Individual (self-service) |
| Lens | Individual |
| Definition Type | Outcome-Driven |
| Business Objective | Remove duplicated manual cross-referencing across a reference doc, web research, and reviews; this workflow is the upstream input for Accommodation Search and Day-by-Day Itinerary Builder |

---

## Inputs

- Destination
- Trip dates
- Group composition (ages and count of travelers)
- Preference notes, which may include a link to a reference Google Doc or Google Sheet from a friend or co-traveler

## Rules & Constraints

- **Must do:**
  - Group the shortlist by city/region location, then loosely cluster items into day ranges (e.g., "early days" / "later days") without assigning precise day order or time slots — precise sequencing is the Day-by-Day Itinerary Builder's job
  - Include a note on each item describing who it's accommodative of (age range, group type)
  - Suggest an alternate for any item that doesn't accommodate the full group
  - Flag items that duplicate the user-provided reference doc, only when a reference doc was provided
  - Flag items that require an advance reservation
  - Call out tourist-favorite and local-favorite items
  - Call out travel time between locations/places
  - Specify a fee or budget estimate wherever available, in the destination's local currency
  - Note the mode of transportation for each item
  - Factor in weather/seasonal constraints for the trip dates and destination — use an actual forecast when the trip falls within a standard forecast window (~10-14 days out), otherwise use seasonal/historical climate norms
  - Cross-check a place's operating status against the most recent available source before including it; if status is uncertain or conflicting across sources, flag that uncertainty rather than presenting it as confirmed open
  - When the reference doc conflicts with current research (e.g., an item reviews flag as closed or poorly rated), preserve the reference doc's suggestion but flag the conflict rather than silently favoring either source
  - If group composition is incomplete (e.g., ages not specified for some members), ask the user to clarify before researching, or proceed using general-audience assumptions and explicitly note that assumption in the output
  - If the reference doc link cannot be accessed, proceed with research from other sources and note in the output that the reference doc could not be read
  - Keep each item's notes terse (1-2 lines); total list length may grow with trip duration, group size, and number of locations, but individual entries stay concise
  - Present a draft list (places/activities only, without budget or transportation details) for user review before adding budget and transportation details
- **Must never do:**
  - Include permanently closed places
  - Omit local-favorite call-outs
  - Omit weather/seasonal considerations
- **Scope boundaries:** Produces a research shortlist with loose day clustering only — does not book accommodations, activities, or transportation, and does not assign precise time slots or order activities within a day (handled by the downstream Day-by-Day Itinerary Builder).
- **Tone / format / length:** Concise per item, not necessarily overall — each entry stays terse even as total list length scales with trip size; avoid exhaustive or long-winded per-item descriptions.
- **Source restrictions:** Research draws only from general web search, TripAdvisor, Google Reviews, Yelp, and local tourism board sites, plus any user-provided reference doc/sheet.

## Context Inventory

| ID | Artifact | Used By | Status | AI Accessible | Location / Source | Key Contents |
|---|---|---|---|---|---|---|
| C1 | User-provided reference notes/doc | All | Exists (optional per trip) | Partial | Google Doc or Google Sheet link, shared by the user | Prior suggestions from friends/co-travelers; format and structure vary by trip; if inaccessible, workflow proceeds without it and notes this in the output |
| C2 | General web search | All | Exists | Yes | Public web | Destination content, activities, points of interest |
| C3 | Review sites | All | Partial | Partial | TripAdvisor, Google Reviews, Yelp | Ratings, reviews, popularity signals; some sites restrict scraping/require API access |
| C4 | Local tourism board sites | All | Exists | Partial | Destination-specific tourism board websites | Local events, official recommendations; quality and structure vary by destination |

## Acceptance Criteria

### What good output looks like
A concise, easy-to-read document listing places and activities, grouped first by city/region location and then loosely clustered into day ranges. Each item notes who it's accommodative of and offers an alternate where it doesn't fit the full group. Duplicates against the reference doc are flagged (when a reference doc exists), items needing advance reservations are called out, and the list distinguishes tourist favorites from local favorites. Travel time between locations/places, budget/fee estimates (in local currency), and transportation modes are included wherever available, and weather/seasonal constraints are factored into recommendations.

### Dimensions that matter
- Age/group accommodation — each item notes suitability and offers alternates rather than forcing every item to fit everyone
- Duplicate detection — overlap with the user's reference doc is flagged when a reference doc is provided
- Reservation awareness — items requiring advance booking are called out
- Local vs. tourist balance — both types of favorites are represented
- Travel time awareness — travel time between locations/places is called out
- Budget transparency — fee/cost estimates included wherever obtainable, in local currency
- Transportation clarity — mode of transport noted per item
- Weather/seasonal fit — recommendations account for expected conditions during the trip dates, using forecast data when available and seasonal norms otherwise
- Closure confidence — operating status is cross-checked, and uncertainty is flagged rather than asserted as fact
- Length discipline — individual entries stay terse regardless of how total list length scales with trip size

### Minimum bar
Unacceptable if: local-favorite call-outs are missing entirely, any recommended activity turns out to be permanently closed, weather/seasonal constraints are not referenced at all, or a reference-doc conflict is silently resolved without flagging it. Missing budget estimates is acceptable when there's a valid reason (e.g., pricing not publicly available).

## Example Scenarios

| ID | Scenario | Input | What to look for in the output |
|---|---|---|---|
| E1 | Multi-family Hawaii trip | Big Island, Hawaii; group of 15 across 4 families; ages 1–16; 6 days | Most items carry explicit "accommodative of" notes and alternates given the wide age range; logistics/booking-size notes reflect the large group; travel time is called out between towns/areas on the island |
| E2 | Girls' trip, no kids | Arizona; group of 3; age 25; 4 days | No age-range filtering needed; output leans into tourist vs. local favorites and experience quality |
| E3 | Solo NYC trip | New York; solo traveler; age 35; 3 days | Tightly prioritized shortlist (not exhaustive) suited to a short duration; items are solo-friendly (no minimum-group-size activities) |

## Human Gates

| Where | What requires human input |
|---|---|
| Draft list review | User reviews the draft places/activities shortlist before the agent adds budget and transportation details |
| Final shortlist | User reviews the completed, filtered shortlist before using it for downstream planning (accommodation search, itinerary building) |
