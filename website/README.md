# Trip Shortlister website

Static site: `index.html` (landing), `planner.html` (planner), `stay.html` (the page a group opens to compare places to stay), `css/`, `js/`, `img/`, plus optional serverless functions in `api/`.

## What works without any backend
Upload this folder to Netlify, Vercel, GitHub Pages or any static host. Without a backend, these work fully:
- **See an example result** in the planner (a researched Salt Lake City shortlist, with photos)
- **`stay.html?demo=1`**, a demo of the lodging comparison and voting page, using clearly labeled placeholder data (votes and comments live in the browser only)

**Generate the itinerary** and the lodging step show a message that they need the backend.

## Turn on live generation (optional)
The functions in `api/` use Vercel's format (`api/package.json` marks them as ES modules). Files starting with `_` are helpers, not routes.

| Function | What it does | Needs |
|---|---|---|
| `api/generate.js` | Shortlist: real web search, draft, revise, enrich | `ANTHROPIC_API_KEY` |
| `api/accommodations.js` | Where to stay: picks lodging bases from the approved shortlist, then searches Airbnb, Booking.com and hotel sites once per base, tags budget tiers | `ANTHROPIC_API_KEY` |
| `api/poll.js` | Shared comparison link, thumbs up/down votes, name-attributed comments | Upstash Redis (below) |

Instructions live server-side (`api/prompt.js`, `api/_accommodation.js`). The pages only send trip details, the current draft, and feedback.

1. Deploy the folder to Vercel (or port the functions to your host).
2. Set `ANTHROPIC_API_KEY`. Optionally set `ALLOWED_ORIGIN` to your site's URL.
3. For the shareable comparison and voting, add **Upstash Redis** from the Vercel Marketplace to the project (Vercel KV was retired and became Upstash Redis). It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`; plain `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` also work. Without it, the lodging comparison still shows for the trip owner, but there is no share link or voting.
4. Function time: each lodging search covers one place to stay and is allowed up to 120 seconds. Vercel Hobby with fluid compute (the default for new projects) allows up to 300.

**Cost and abuse.** Anyone who can reach the site can spend your API credits through these functions, and a lodging search is the costly one (up to 10 web searches per place to stay). Set a spending limit on the key and add rate limiting before sharing the link widely. Share links are unguessable (72 bits) and expire 5 days after the last vote or comment, but anyone holding one can vote and comment.

## How the lodging step works
1. After the shortlist is approved, a planning call (no web search) chooses where to sleep and splits the trip's nights. The shortlist's areas are not used directly, because they often include day-trip spots.
2. One search per place to stay, run one after another. Each returns 3 to 5 options with price, rating, link, amenities, distance, cancellation and a must-have check.
3. The server checks every option: no real link, price or rating means it is dropped; budget tiers are computed from the budget (per person, times group size); at most one "Stretch pick", capped at 15% over; a place with fewer than 3 options is flagged as a thin market, never silently shortened.
4. The comparison is saved under a share link. The owner can ask for different options per place; new ones are added and nothing is removed.

Budget tiers: **Budget-friendly** is at or under 75% of the target nightly rate, **Comfort** is up to 100%, **Stretch pick** is up to 15% over (with a stated reason), and anything further over is flagged as over budget.

Prices, ratings and availability come from web search snippets. They are estimates for the whole group per night, and the page tells people to confirm on the listing. Nothing is ever booked.

## Photos
Openly licensed images from Wikimedia Commons, with credits in `js/data.js` and shown on the pages. They cover Salt Lake City only. Keep the credits if you add more. Lodging photos are only shown when a listing's image URL was found; otherwise the "View and book" link is the way to see photos.

## Local preview
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000 (static features only; the `api/` functions need a host such as Vercel, or `vercel dev`).
