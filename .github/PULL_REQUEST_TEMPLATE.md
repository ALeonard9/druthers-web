## Summary

<!--
Bullets. Lead with the cause, then the fix — not a changelog of files touched.
Say what does NOT change if that's load-bearing.
-->

-

## Test plan

<!--
Checked boxes with real evidence: actual pass counts, the specific cases added,
and what you verified in the browser against the local dev stack. Screenshots
for visual changes; a `.webp` recording for multi-step UX flows.
-->

- [ ] `npm test` — N passed, including <the new cases>
- [ ] `npm run lint` clean
- [ ] Verified in browser at `http://localhost:3000/<path>`: <what you clicked and what happened>

## Checklist

- [ ] Branch named `feat/…`, `fix/…`, or `chore/…`
- [ ] New interactive component has a `<name>.test.tsx` in this PR (see AGENTS.md → Testing)
- [ ] Pure logic lives in `src/lib/*.ts` with a `.test.ts` sibling, not inside the component
- [ ] Per-domain change checked against the other three domains (movies/TV/books/games)
- [ ] CI green (lint + tests)
- [ ] No secrets committed
- [ ] Docs/README updated if behavior changed

<!--
Closing issues: repeat the keyword for EVERY issue. The comma form
("Closes #a, #b") silently closes only the first one.
Closes #a. Closes #b.
-->
