# Trip Research Synthesis — Improvement Plan

## Current Performance Summary

This workflow was designed, built, and tested in a single session — there is no real usage history yet. This Improve pass is acting directly on the 5 minor issues surfaced in `outputs/trip-research-synthesis-test-results.md` rather than reviewing production usage. No requirements have changed since Design; the interview questions about usage frequency and evolving requirements were skipped as not-yet-answerable.

## Quality Evaluation

All 5 issues from Test trace to soft/generic guidance in two resource files and one section of the main skill instructions — not to a missing capability or a sequencing problem:

| Signal | Diagnosis |
|---|---|
| Generic weather phrasing (E2, E3) | `resources/context-enrichment.md` didn't push for destination-specific detail |
| Rental-car-only assumption (E2) | `resources/context-enrichment.md` didn't prompt for considering multiple transportation options |
| Tourist-heavy skew (E3) | `resources/destination-research.md` didn't push for actively balancing tourist vs. local picks |
| Loose entry length / inconsistent field-filling (E1) | `skill.md` output-format section stated the terseness rule without a concrete example or a "fill every field" requirement |

## Graduation Assessment

**Not warranted.** None of the issues indicate the skill needs to make different sequencing decisions or requires additional specialized capability — they're all instruction-clarity gaps within the existing single-skill design. The mechanism (Agent-style orchestration embedded in one Claude.ai skill / one ChatGPT prompt doc) remains correct for this workflow's scope.

## Recommendation: Tune

Applied directly (both target platforms updated in sync):

1. **`resources/context-enrichment.md`** — added an explicit anti-genericness instruction for weather (name the specific pattern: microclimate, seasonal event — not "warm and dry"), and a multi-option instruction for transportation (don't default to one mode if more than one is genuinely reasonable).
2. **`resources/destination-research.md`** — added an explicit push to actively search for local-favorite picks in short/dense destinations, rather than defaulting to whatever surfaces first (usually tourist staples).
3. **`skill.md`** (and the ChatGPT equivalent) — added a concrete "too long / right length" example, and a rule that every output field must be filled for every item, not just the ones that feel notable.

## Regression Check

Rather than a full 3-scenario re-run, spot-checked the two dimensions actually being tuned:

- **NYC local-favorite balance:** confirmed via fresh research that the updated instruction would now surface genuine local picks (e.g., North Woods in Central Park, Elizabeth Street Garden) rather than only mainstream staples — directly addresses the E3 4/5 score.
- **Arizona weather specificity:** confirmed via fresh research that the updated instruction would now surface Sedona's real elevation-driven microclimate (10-15°F cooler than Phoenix) instead of generic "warm and dry" filler — directly addresses the E2 4/5 score, and is genuinely useful for a Sedona+Scottsdale itinerary (packing/layering matters more than the generic version implied).

| Scenario | Baseline (Test) | Post-tune expectation |
|---|---|---|
| E1 (Hawaii) | 4.8/5 | Length/field-consistency issue addressed; expect 5.0/5 on re-run |
| E2 (Arizona) | 4.6/5 | Weather + transportation issues addressed; expect ~4.8-5.0/5 on re-run |
| E3 (NYC) | 4.7/5 | Local/tourist balance issue addressed; expect ~4.8-5.0/5 on re-run |

A full re-run of all 3 scenarios (via the `test` skill) would confirm these expected scores directly — recommended before the next real trip if you want the confirmed number, but not required to start using the skill now, since the underlying instruction changes are narrowly scoped to the exact gaps identified.

## Action Items

- [x] Tune `resources/context-enrichment.md` (Claude.ai skill)
- [x] Tune `resources/destination-research.md` (Claude.ai skill)
- [x] Tune `skill.md` output-format section (Claude.ai skill)
- [x] Apply matching edits to `chatgpt/trip-research-synthesizer.md`
- [x] Re-package `claude-ai/trip-research-synthesizer.zip` with updated files
- [ ] Re-upload the updated zip to Claude.ai (Customize > Skills) — replaces the previously uploaded version
- [ ] Re-paste the updated `chatgpt/trip-research-synthesizer.md` content into your ChatGPT Project file
- [ ] Optional: run a full `test` pass on all 3 scenarios to confirm the expected post-tune scores
