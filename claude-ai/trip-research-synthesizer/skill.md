---
name: trip-research-synthesizer
description: Synthesizes trip research into one grouped shortlist of places/activities from web search, reviews, and any reference doc, filtered for group ages. Use for any destination trip planning.
---

# Trip Research Synthesizer

Turn a destination, dates, and group composition — plus, optionally, a friend's reference doc — into one concise shortlist of places and activities, reconciled across sources and filtered for who's actually in the group.

## Why this matters

The expensive part of trip research isn't finding places — it's reconciling them: a friend's spreadsheet says one thing, a fresh search turns up something better or contradicts it, and every candidate has to be silently checked against "does this work for the 2-year-old *and* the 8-year-old." Doing that reconciliation explicitly, and flagging rather than hiding the judgment calls, is what makes the output trustworthy enough to act on.

## Workflow

### 1. Intake

Collect: destination, trip dates, group composition (ages + count), and — if the user has one — a link to a reference Google Doc/Sheet from a friend or co-traveler.

If group composition is incomplete (e.g., "a family with kids" but no ages), ask for the missing ages. If the user can't provide them, proceed using general-audience assumptions and say so explicitly in the output — don't silently guess.

### 2. Reference material (only if a doc/link was provided)

Read `resources/reference-doc-ingestion.md`, then open and normalize the linked doc into a list of prior suggestions. If the link can't be opened, don't block — continue without it and note in the final output that the reference doc couldn't be read.

### 3. Destination research

Read `resources/destination-research.md`, then search the web, TripAdvisor, Google Reviews, Yelp, and local tourism boards to build a candidate list of places and activities for the destination and dates.

### 4. Suitability & alternates

Read `resources/suitability-alternates.md`, then annotate each candidate with who it accommodates (weighed against the youngest and oldest in the group) and suggest an alternate wherever an item doesn't fit everyone.

### 5. Reconciliation (only if a reference doc was used in step 2)

Read `resources/cross-source-reconciliation.md`, then compare the reference doc's suggestions against the researched candidates — flag duplicates, and flag any conflict (e.g., the doc says a place is great, reviews say it's closed) without silently picking a side.

### 6. Draft review — pause here

Assemble everything so far into a **draft list**: grouped by city/region, then loosely clustered into day ranges (early days / later days — not a precise day-by-day schedule, that's a different workflow). No budget or transportation details yet.

**Stop and show this draft to the user. Wait for their go-ahead before continuing** — this is the point where they catch anything off before you spend effort on enrichment.

### 7. Enrichment (after the user approves the draft)

Read `resources/context-enrichment.md`, then add weather/seasonal notes, travel time between locations, transportation mode, and a budget/fee estimate (in the destination's local currency) to each approved item.

### 8. Final review — pause here

Present the enriched list as the **final shortlist**. This is the second and last pause point — the user takes this into their next steps (booking lodging, building a day-by-day itinerary), which are separate workflows this skill does not perform.

## Output format

One markdown document. Group by city/region location, then loosely cluster by day range within each location. Each entry is short:

```
### [Place/Activity Name]
[1-2 line description]
- Accommodates: [who it's good for] (Alternate: [name], if this doesn't fit everyone)
- [Duplicate of your reference doc | Conflicts with your reference doc: explain] — omit this line if no reference doc was used
- Reservation needed: yes/no
- Tourist favorite / Local favorite
- (after enrichment) Weather: ... | Travel time: ... | Getting there: ... | Est. cost: ...
```

Keep each entry terse — 1-2 lines of description regardless of trip size. The whole list can get longer for bigger, longer trips; individual entries should not.

**Example — too long:** "Hawaii Volcanoes National Park offers visitors the chance to explore Crater Rim Drive and Chain of Craters Road, with Nāhuku lava tube being a particularly popular stop, and the park has seen ongoing volcanic activity in recent years which travelers should be aware of when planning their visit to this iconic destination."
**Right length:** "Drive-through park access with overlooks; Nāhuku lava tube walk-through." (Save the volcanic-activity detail for the closure-confidence flag, not the description line.)

Every field in the entry template (Accommodates, Reservation needed, Tourist/Local favorite, and the enrichment fields) should be filled in for every item, even when the answer is simple ("Reservation needed: no") — don't fill it in for some items and drop it for others just because it feels obvious.

## Things to never do

- Never include a place that's permanently closed. Cross-check operating status against the most recent source you can find; if sources disagree or you're not sure, say so rather than asserting it's open.
- Never drop the local-favorite / weather call-outs, even under time pressure — they're part of what makes this useful over a generic search.
- Never resolve a reference-doc conflict silently. If the doc and your research disagree, keep the doc's suggestion but say what's in tension.
- Don't book anything, and don't build a precise, time-slotted day-by-day schedule — both are separate workflows downstream of this one.
- Only research via web search, TripAdvisor, Google Reviews, Yelp, local tourism boards, and the user's own reference doc.
