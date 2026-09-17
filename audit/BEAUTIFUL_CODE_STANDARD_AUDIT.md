# AshFallen — Beautiful Code Standard Audit

**Audit date:** 17 September 2026  
**Repository tier:** Active / game  
**Standard:** The Beautiful Code Standard

## Overall finding

AshFallen is workable but concentrated: `App.tsx`, `gameData.ts` and `store.ts` are each around 30–37 KB, so UI, content and state have clear files but each is becoming a hotspot. Generated TypeScript `.tsbuildinfo` files are committed and should not normally be source-controlled. No visible test suite or normal CI quality workflow appeared in the audited tree.

## Priorities

1. Remove committed `.tsbuildinfo` generated files and ignore them.
2. Add deterministic tests around store/game-state transitions before refactoring state code.
3. Add a browser smoke test for start → action → state/result.
4. Add CI for type/lint/test/build before deployment.
5. Review `App.tsx` and `store.ts` for genuine domain/UI responsibilities; extract only where it improves local reasoning.
6. If `ashfaller` is the newer canonical version, decide which repository should remain active and archive the other.

## Bottom line

**Strengthen behavioural evidence and resolve the AshFallen/ashfaller source-of-truth question before chasing metrics.**
