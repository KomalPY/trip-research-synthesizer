# Cross-source reconciliation

Goal: catch overlap between the user's reference doc and what you researched, and surface — rather than silently resolve — any place where the two disagree.

This step only applies when the user provided a reference doc. If they didn't, skip it entirely; there's nothing to reconcile against.

## Matching items

Match reference-doc items against researched candidates by name and location similarity, not exact string match — the same restaurant might appear as "Joe's Crab Shack" in one place and "Joe's" in another. Use judgment: same name, same or clearly-nearby location → treat as the same place. Same name, different location (a chain, or coincidentally named) → treat as distinct items, don't merge them.

## Flagging duplicates

When a reference-doc item matches something you also found in research, flag it as a duplicate in the output — this tells the user their friend's suggestion is corroborated by your independent research, which is a positive signal worth surfacing, not just a dedup housekeeping step.

## Flagging conflicts

When the reference doc and your research disagree about a place — the doc recommends it, but reviews say it's now closed, or reviews are much more negative than the doc's framing implies — don't just pick one source and move on. Keep the reference doc's suggestion in the list (it's still the user's friend's input and might be right), but flag the conflict explicitly so the user can decide what to trust. Silently dropping it, or silently keeping it without the caveat, both hide information the user needs to make their own call.
