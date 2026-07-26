# Reference doc ingestion

Goal: turn whatever's in the user's linked Google Doc or Sheet into a clean list of prior suggestions you can compare against later, without losing the original phrasing that might help you match it against research later.

## How to read it

Open the link. Reference docs are rarely tidy — expect a mix of bullet points, half-finished notes, names with no context, maybe a few comments. Extract every place/activity name you can find, along with whatever note (if any) accompanies it. Preserve the original wording of any note — don't paraphrase it away, since the exact phrasing can help you recognize the same place later even if a review site spells or names it slightly differently.

If the doc has sections (e.g., by day, by person, by category), you don't need to preserve that structure — just get every item out into a flat list with its original note attached.

## When things go wrong

- **Link won't open** (permission denied, broken link, wrong sharing settings): don't stop the workflow for this. Continue without the reference doc, and make sure the final output tells the user their reference doc couldn't be read, so they know to check the sharing settings if they want it included next time.
- **Doc opens but has nothing relevant** (empty, or unrelated content): return an empty list, and note that the doc didn't contain anything usable.

The output of this step is just a list of items with their original notes — it doesn't need any judgment calls yet. Save those for the reconciliation step.
