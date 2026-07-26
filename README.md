# Trip Research Synthesizer

Turns a destination, dates, and group composition — plus, optionally, a friend's reference doc — into one concise shortlist of places and activities, reconciled across sources and filtered for who's actually in the group.

Built with Anthropic's [AI Workflow Framework](https://github.com/jamesgray-ai/handsonai) (Analyze → Deconstruct → Design → Build → Test → Improve). The full paper trail is in this repo:

- [`requirements.md`](requirements.md) — Workflow Requirements (Deconstruct, Step 2): outcome, inputs, rules & constraints, acceptance criteria, example scenarios
- [`design-spec.md`](design-spec.md) — Design Spec (Design, Step 3): architecture, capability domains, skill/agent blueprints
- [`test-results.md`](test-results.md) — Test Results (Test, Step 5): eval scores across 3 scenarios
- [`improvement-plan.md`](improvement-plan.md) — Improvement Plan (Improve, Step 7): tuning applied after the first test pass
- [`DEPLOYMENT-GUIDE.md`](DEPLOYMENT-GUIDE.md) — how to deploy each artifact below

## Artifacts

### `claude-ai/` — Claude.ai Standalone Skill

`trip-research-synthesizer.zip` is ready to upload via **Customize > Skills** on claude.ai. Unzipped source is in `claude-ai/trip-research-synthesizer/` (`skill.md` + `resources/`).

### `chatgpt/` — ChatGPT Prompt Document

`trip-research-synthesizer.md` is a self-contained prompt (not a Workspace Agent — those require a Business/Enterprise/Edu plan). Recommended: upload it as a file in a ChatGPT Project with a short custom-instructions pointer — see the Deployment Guide for the exact text.

## How it works

1. Give it a destination, trip dates, group composition (ages/count), and optionally a reference doc/spreadsheet from a friend.
2. It researches the destination (web search, TripAdvisor, Google Reviews, Yelp, local tourism boards), reconciles against your reference doc if you gave it one (flagging duplicates and conflicts rather than silently resolving them), and annotates each item for who it's actually good for.
3. It shows you a **draft list** and waits for your go-ahead.
4. Once approved, it adds weather, travel time, transportation, and budget estimates, and shows you the **final shortlist**.

It does not book anything and does not build a precise, time-slotted day-by-day itinerary — those are separate downstream steps.

## License

MIT
