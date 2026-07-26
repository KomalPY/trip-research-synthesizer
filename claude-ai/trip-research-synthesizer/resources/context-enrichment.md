# Context enrichment

Goal: take the user-approved draft list and add the logistics details that make it actionable — weather fit, travel time, transportation, and rough cost — without holding up delivery over data that simply isn't available.

This step only runs after the user has approved the draft (step 6 of the main workflow). Don't enrich a list the user hasn't seen yet — enrichment work is wasted if they want to cut items from the draft first.

## Weather / seasonal fit

If the trip falls within roughly 10-14 days from now, use an actual forecast. Beyond that window, forecasts aren't reliable — use seasonal or historical climate norms for the destination and month instead. Either way, say which kind of information you're using — a forecast and a seasonal generalization carry different confidence, and the user should know which one they're getting.

Avoid generic filler like "expect warm, dry days typical for the season" — that's true of almost anywhere and tells the user nothing they didn't already assume. Instead, name the specific pattern that actually affects planning: does this destination have a microclimate that differs by area (e.g., one side of an island wetter than the other, elevation-driven temperature swings, a monsoon window)? Is there a known seasonal event worth knowing about (wildfire smoke season, hurricane season, a rainy season with specific months)? If a destination genuinely has nothing notable to flag beyond "normal for the season," it's fine to say that briefly — but check for a real signal before defaulting to boilerplate.

## Travel time

Call out travel time between locations or distinct places in the itinerary — especially between different cities/regions if the trip spans more than one, but also between activities within the same area when it's non-trivial. If the exact route is ambiguous (multiple reasonable ways to get there), give a reasonable estimate range and flag it as approximate rather than presenting a single precise number you're not sure of.

## Transportation mode

Note how someone would realistically get to each place — walking, public transit, rideshare/taxi, rental car, ferry, etc. — based on the destination's typical options and the group's likely constraints (a group of 15 across 4 families needs different transportation logistics than a solo traveler).

Don't default to a single mode for the whole trip just because it fits the first item. A destination can have more than one realistic option — e.g., a small group in a walkable city center might reasonably choose rideshare over a rental car for some legs and walk for others. When more than one mode is genuinely reasonable for the group's size and the destination, mention the alternative briefly rather than silently picking one.

## Budget / fee estimates

Give a fee or cost estimate wherever you can find one, expressed in the destination's local currency (not the user's home currency) so it's directly usable. When you can't find reliable pricing — a place with no published rates, or something too variable to estimate meaningfully — leave it out and say why, rather than guessing a number. A missing estimate with a stated reason is acceptable; a fabricated one is not.
