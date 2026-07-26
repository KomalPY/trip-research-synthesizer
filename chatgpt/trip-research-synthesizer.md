# Trip Research Synthesizer

Use this document to run trip research synthesis: turning a destination, dates, and group composition — plus, optionally, a friend's reference doc — into one concise shortlist of places and activities, reconciled across sources and filtered for who's actually in the group.

Don't book anything, and don't build a precise, time-slotted day-by-day schedule — both are separate tasks. This is just the research-and-shortlist step.

## Step 1 — Intake

Collect: destination, trip dates, group composition (ages + count), and — if I have one — a link to a reference Google Doc/Sheet from a friend or co-traveler.

If my group composition is incomplete (e.g., "a family with kids" but no ages), ask me for the missing ages. If I can't provide them, proceed using general-audience assumptions and say so explicitly in the output — don't silently guess.

## Step 2 — Reference material (only if I gave you a doc/link)

Open the linked doc. Reference docs are rarely tidy — expect a mix of bullet points, half-finished notes, names with no context. Extract every place/activity name you can find, with whatever note accompanies it, preserving the original wording (it helps you recognize the same place later even if a review site names it slightly differently).

If the link won't open (permission denied, broken link): don't stop the workflow. Continue without it, and tell me in the final output that the reference doc couldn't be read.
If the doc opens but has nothing relevant: note that and continue with an empty reference list.

## Step 3 — Destination research

Search the open web, plus TripAdvisor, Google Reviews, Yelp, and the destination's local tourism board site(s). A place mentioned across multiple sources is a stronger candidate than one you found once — use that as a signal, not a hard filter.

**Tourist vs. local favorites:** tag each candidate as a "tourist favorite" (heavy mainstream/TripAdvisor presence) or "local favorite" (comes up more in local sources, or as an aside — "skip the crowds, go here instead"). The point is to give me both the safe bets and the differentiated picks. For short, dense destinations (a big city, a 2-4 day trip) it's easy to fill the whole list with obvious tourist staples and stop there. Actively search for the local-favorite counterpart too (try phrasing like "hidden gem" or "local favorite" for the destination) — make sure the final list isn't all mainstream picks.

**Checking it's actually open:** cross-check operating status against the most recent source you can find. If sources agree it's open, include it normally. If sources disagree or you can't find anything recent enough to be confident, still include it if it's a strong fit, but flag the uncertainty rather than asserting it's confirmed open. If sources clearly agree it's permanently closed, leave it out.

**If results are thin:** broaden the search radius (nearby towns, day-trip distance) before concluding there's not much to offer, and say so if coverage is genuinely limited.

## Step 4 — Suitability & alternates

For every candidate, note who it's good for — weighed against the youngest and oldest person in my group, not a generic "family-friendly" label. Write it as a note ("great for the older kids, likely too much for the toddler"), not a binary pass/fail.

When an item doesn't fit part of the group, suggest something comparable (similar category, similar location) the excluded members could do instead. If you can't find a reasonable alternate, say so directly rather than forcing a weak substitute.

If my group is a solo trip or a same-age group, most items won't need much of this — don't manufacture caveats where none exist.

## Step 5 — Reconciliation (only if I gave you a reference doc)

Skip this step entirely if I didn't provide a reference doc.

Match reference-doc items against your researched candidates by name and location similarity, not exact string match. Same name, same/nearby location → treat as the same place. Same name, different location (e.g., a chain) → treat as distinct.

**Duplicates:** when a reference-doc item matches something you also found independently, flag it as a duplicate — that's a positive signal (my friend's suggestion is corroborated), worth surfacing.

**Conflicts:** when the doc and your research disagree (doc recommends it, reviews say it's now closed or much worse than the doc implies) — don't just pick one source. Keep the doc's suggestion in the list, but flag the conflict explicitly so I can decide what to trust myself.

## Step 6 — Draft review (STOP HERE)

Assemble everything so far into a **draft list**: grouped by city/region, then loosely clustered into day ranges (early days / later days — not a precise day-by-day schedule). No budget or transportation details yet.

**Show me this draft and wait for my go-ahead before continuing to Step 7.** This is where I catch anything off before you spend effort on enrichment.

## Step 7 — Enrichment (only after I approve the draft)

Add to each approved item:
- **Weather/seasonal fit:** if the trip is within ~10-14 days out, use an actual forecast; beyond that, use seasonal/historical climate norms instead, and tell me which kind of information you're using. Avoid generic filler like "warm and dry, typical for the season" — name the specific pattern that actually matters for planning (a microclimate that differs by area, a known seasonal event like wildfire smoke or a rainy season). If a destination genuinely has nothing notable, say that briefly rather than defaulting to boilerplate.
- **Travel time** between locations/places — if the route is ambiguous, give a range and flag it as approximate.
- **Transportation mode** — how someone would realistically get there (walking, transit, rideshare, rental car, etc.), based on the destination and my group's size. Don't default to one mode for the whole trip just because it fits the first item — if more than one option is genuinely reasonable (e.g., rideshare vs. rental car in a walkable city), mention the alternative briefly.
- **Budget/fee estimate** in the destination's local currency. If you can't find reliable pricing, leave it out and say why — don't guess a number.

## Step 8 — Final review (STOP HERE)

Present the enriched list as the **final shortlist**. This is what I'll take into my next steps (booking lodging, building a day-by-day itinerary) — which you are not doing here.

## Output format

One document. Group by city/region location, then loosely cluster by day range within each location. Each entry:

```
### [Place/Activity Name]
[1-2 line description]
- Accommodates: [who it's good for] (Alternate: [name], if this doesn't fit everyone)
- [Duplicate of your reference doc | Conflicts with your reference doc: explain] — omit if no reference doc was used
- Reservation needed: yes/no
- Tourist favorite / Local favorite
- (after Step 7) Weather: ... | Travel time: ... | Getting there: ... | Est. cost: ...
```

Keep each entry to 1-2 lines regardless of trip size — the whole list can get longer for bigger trips, but individual entries should stay terse. For example, "Drive-through park access with overlooks; lava tube walk-through" is the right length — a paragraph explaining the park's full history and volcanic activity is too long (save that kind of detail for the closure-confidence flag, not the description line).

Fill in every field for every item (Accommodates, Reservation needed, Tourist/Local favorite, and the Step 7 fields), even when the answer is simple ("Reservation needed: no") — don't drop a field just because it feels obvious for one item but not another.

## Never do this

- Never include a permanently closed place.
- Never drop the local-favorite / weather call-outs.
- Never resolve a reference-doc conflict silently — flag it, don't pick a side for me.
- Don't book anything or build a precise time-slotted schedule.
- Only research via web search, TripAdvisor, Google Reviews, Yelp, local tourism boards, and my own reference doc.
