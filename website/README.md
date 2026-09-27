# Trip Shortlister website

Static site: `index.html` (landing), `planner.html` (planner), `css/`, `js/`, `img/`.

## Deploy (static, works immediately)
Upload this folder to Netlify, Vercel, GitHub Pages or any static host. Without the backend, the planner's **See an example result** works fully; **Generate the itinerary** shows a message that it needs the backend.

## Turn on live generation (optional)
`api/generate.js` is a serverless function in Vercel's format that calls the Anthropic API with the real `web_search` tool enabled — it's a grounded, real research call, the same kind of call the standalone `demo/` prototype in this repo made, just packaged as a backend for this site instead of a local Express server. The actual skill instructions live server-side in `api/prompt.js`, adapted from the skill's own `resources/*.md`; the planner UI (`js/planner.js`) only sends the trip details, the current draft (when revising), and feedback — never the instructions themselves.

1. Deploy the folder to Vercel (or port the function to your host's format; `api/package.json` marks it as an ES module).
2. Set the environment variable `ANTHROPIC_API_KEY`. Optionally set `ALLOWED_ORIGIN` to your site's URL.
3. Check that your plan allows a function to run about 60 seconds. Generation takes up to a minute, since it's doing real search.

Anyone who can reach the site can spend your API credits through this function. Set a spending limit on the key, and add rate limiting before sharing the link widely.

## Photos
Openly licensed images from Wikimedia Commons, with credits in `js/data.js` and shown on the pages. They cover Salt Lake City only. Keep the credits if you add more.

## Local preview
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000
