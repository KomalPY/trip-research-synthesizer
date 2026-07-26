# Trip Research Synthesizer — Deployment Guide

Two artifacts were built from the Design Spec (`outputs/trip-research-synthesis-design-spec.md`), adapted after platform research turned up two constraints the spec didn't originally account for:

- **ChatGPT Workspace Agents and Skills require a Business/Enterprise/Edu plan** — not available on Free/Plus/Pro. Since you're on a personal plan, the ChatGPT artifact was built as a self-contained prompt document instead of a Workspace Agent.
- **Claude.ai skills cap the description at 200 characters and have no `agents/` sub-folder primitive** — so instead of 5 separate skills + an embedded agent, everything ships as **one** skill package with the orchestration logic in `skill.md` and the five capability areas as reference files under `resources/`.

## Claude.ai — Standalone Skill

**Location:** `outputs/trip-research-synthesis-build/claude-ai/trip-research-synthesizer.zip`

**To deploy:**
1. Go to **Customize > Skills** in Claude.ai.
2. Upload `trip-research-synthesizer.zip` (the zip already has the skill folder as its root — no repackaging needed).
3. Enable the skill.
4. Test it with a prompt like: *"I'm planning a trip to [destination] for [dates], group is [ages/count]. Here's a reference doc my friend sent: [link]."* — or without the reference doc for a simpler test.

The skill was sanity-tested against the "solo NYC trip" example scenario from the Workflow Requirements before packaging (see conversation above) — output matched expectations: tight list, no reference-doc reconciliation clutter, solo-friendly items only.

## ChatGPT — Prompt Document (not a Workspace Agent)

**Location:** `outputs/trip-research-synthesis-build/chatgpt/trip-research-synthesizer.md`

**Recommended deployment (works on Free, Plus, and Pro):**
1. Create a new **Project** in ChatGPT (Projects are available on all plans, including Free).
2. Upload `trip-research-synthesizer.md` as a project file.
3. In the Project's custom instructions field, paste:

   > When I ask you to help plan a trip (destination, dates, group composition, optionally a reference doc), follow the process in the uploaded file trip-research-synthesizer.md exactly. Do not skip its two review pauses (draft list, then final list) or its never do this rules. If that file is not in this project yet, ask me to upload it before starting trip research.

4. Start any trip-planning conversation inside that Project — it will reference the uploaded file automatically.

**Simplest alternative (no Project, works anywhere):** paste the entire contents of `trip-research-synthesizer.md` at the start of a regular ChatGPT conversation, then describe your trip.

**If your ChatGPT plan changes to Business/Enterprise/Edu later:** the original Design Spec's Workspace Agent packaging becomes available — the same instructions in `trip-research-synthesizer.md` can be pasted as the agent's instructions field directly, since the content doesn't depend on the packaging format.

## What's next

To test either artifact more rigorously against all 3 example scenarios (E1 Hawaii, E2 Arizona, E3 NYC) and the full Acceptance Criteria from the Workflow Requirements, run the `test` skill (Step 5).
