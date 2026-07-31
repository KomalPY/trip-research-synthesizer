# Demo

A minimal local webpage that runs the Trip Research Synthesizer skill for real, via the Anthropic API with the `web_search_20250305` tool. Not deployed anywhere — this is a local-only demo (single user, no rate limiting).

## Run it

```
cd demo
npm install
cp .env.example .env
# edit .env and set your ANTHROPIC_API_KEY
npm start
```

Then open http://localhost:3100.

## How it works

- Fill in a destination, trip dates, group composition, and optionally paste reference notes from a friend.
- Submit to get a **draft list** (this can take up to a minute — it's doing real web search).
- Approve it, or ask for a refinement first — either way the conversation continues in the same session.
- Once approved, a second call adds weather/travel/cost enrichment and shows the **final shortlist**.

The full skill instructions (from `../skill.md` and `../resources/*.md`) are flattened into `prompt.js` as the system prompt, since this demo has no file-reading tool the way Claude Code does.
