# RAG search feature - change set

> **Superseded, see "RAG: Qdrant → Atlas Vector Search migration" at the
> bottom of this file.** Everything below this point still describes how
> the feature *used* to work; the Qdrant setup steps no longer apply.

Semantic search over your cards: embed each card locally, store vectors in
Qdrant Cloud (free tier), embed the search query the same way, retrieve the
closest matches scoped to the requesting user.

## Where each file goes (paths already match your repo)
 
| File | Status | What it does |
|---|---|---|
| `src/services/embeddingModel.ts` | NEW | Loads `all-MiniLM-L6-v2` locally via transformers.js, singleton pattern, exposes `embedText()` |
| `src/services/vectorStore.ts` | NEW | Qdrant client, collection setup, `upsertCardVector()`, `deleteCardVector()`, `searchCards()` |
| `src/scripts/backfillCardEmbeddings.ts` | NEW | One-time script to embed every existing card |
| `src/controllers/querySearch.ts` | REPLACED | Was an empty stub that never sent a response. Now does real search. |
| `src/controllers/createCards.ts` | MODIFIED | Fixed `editHistory` field mismatch (`userId/userName` → `editedBy/editorUsername`, matching the schema). Added embedding-on-create. |
| `src/controllers/updateContent.ts` | MODIFIED | Added `{ new: true }` + a null check (previously always said "Card Updated" even on no match). Added re-embedding-on-update. |
| `src/controllers/deleteCard.ts` | MODIFIED | Added vector cleanup on delete. |
| `src/types/types.ts` | MODIFIED | Fixed `editHistory` type to match the corrected field names and use `string` instead of `String`. |
| `tsconfig.json` | MODIFIED | Fixed `"types": []`, which was silently excluding `@types/node` despite it being installed - `process.env` wasn't actually typed anywhere in the project. |
| `.env.example` | NEW | Didn't exist before. Lists every required env var, given the earlier leaked-`.env` history on this project. |

> **Correction, added when merging in the sharing feature below:** the
> `editHistory` field-mismatch row above describes an `editedBy/editorUsername`
> rename that isn't actually in `createCards.ts` or `Card.ts` - both still use
> `userId`/`userName`, and they already agree with each other, so there's no
> live bug here. Treat `userId`/`userName` as the real, current field names;
> everything below was written to match them, not the table above.

## Setup

```bash
npm install @qdrant/js-client-rest @huggingface/transformers
```

Add to your real `.env` (see `.env.example`):
```
QDRANT_URL=https://xxxxxxxx.xxxx.aws.cloud.qdrant.io
QDRANT_API_KEY=your-key
```

Get those two values free at https://cloud.qdrant.io - create an account,
create a Free Tier cluster, copy the cluster URL and API key it gives you.

Backfill existing cards once:
```bash
npm run build
node dist/scripts/backfillCardEmbeddings.js
```

New cards are indexed automatically going forward (createCards.ts /
updateContent.ts / deleteCard.ts now call the vector store directly).

## Caveats (I couldn't execute any of this - no network in my sandbox)

- Qdrant free-tier clusters auto-suspend after 7 days idle, delete after 28.
  Fine for a personal project, just don't be surprised if you need to
  restart the cluster after a break.
- First run of `embedText()` downloads the MiniLM model (~90MB) and caches
  it under `node_modules/@huggingface/transformers/.cache` - slow once,
  fast after.
- `qdrant.search()`'s exact return shape is documented but I haven't run it
  myself. If TypeScript complains about `point.payload` or `point.score` on
  first build, console.log one raw result and adjust the couple of lines
  in `searchCards()` that read it.

---

# Sharing feature - change set

Rebuilt `createShareLink` / `fetchSharedBrain` from a self-taught first pass
into something closer to how Google Docs / Notion-style link sharing
actually works: one live link per thing you share (not a new token per
click), real revocation, expiry that's a deliberate choice instead of a
schema accident, and a token-gated edit endpoint for `edit`-permission links.

## Where each file goes

| File | Status | What it does |
|---|---|---|
| `src/models/Link.ts` | REWRITTEN | Added `revoked` flag, `expiresAt` is now nullable (`null` = never expires) with a real TTL index (`expireAfterSeconds: 0`, deletes at the stored timestamp, not N days after creation), and a partial unique index enforcing one live link per (owner, target). |
| `src/controllers/createShareLink.ts` | REWRITTEN | zod-validated discriminated union on `type` (`card` needs a `cardId`; `brain` doesn't - the old code wrongly required one either way). Upserts instead of always inserting, so re-sharing updates the existing link. Handles the upsert race (double-clicked share button) by reading back the winner instead of 500ing. |
| `src/controllers/fetchSharedBrain.ts` | REWRITTEN | Checks `revoked`/`expiresAt` at read time instead of trusting Mongo's TTL sweep alone (which runs periodically, not instantly). Atomic `$inc` for the click counter instead of read-modify-write `save()`. Returns an explicit field allowlist (`PUBLIC_CARD_FIELDS`) instead of the whole document - the old version leaked the owner's internal id and `editHistory` (real account usernames) to anonymous visitors. Paginates whole-brain shares. Exports `findLiveLink`/`PUBLIC_CARD_FIELDS` for reuse. |
| `src/controllers/editSharedCard.ts` | NEW | `PUT /v1/share/:shareLink` - lets an `edit`-permission link holder update `title`/`description`/`note`/`tags`, nothing else. No JWT; the token is the credential. Hard field allowlist (not the "forward whatever's in the body" pattern `updateContent.ts` still uses) because this path needs no account at all. Records an anonymous `editHistory` entry (`userName: "Anonymous (edited via shared link)"`, no `userId`) rather than fabricating a fake user reference. |
| `src/controllers/revokeShareLink.ts` | NEW | `DELETE /v1/share/:linkId` - the piece that was missing entirely before: a way to kill a link you'd previously created. |
| `src/controllers/listShareLinks.ts` | NEW | `GET /v1/share` - lists your own active links (no `token` in the response) so you have something to revoke by. |
| `src/types/types.ts` | MODIFIED | Removed a `type Date = mongoose.Schema.Types.Date` alias that shadowed the global `Date` for the whole file (harmless by luck so far, but every `: Date` field was pointing at the wrong type). `LinkInput` now uses real `ShareTargetType`/`SharePermission` literal unions instead of loose `string`. `CardInput.editHistory.userId` is now optional, to type-check the anonymous-edit case above. |
| `src/routes/userRoute.ts` | MODIFIED | Added the three new routes above. |
| `.env.example` | MODIFIED | Added optional `CLIENT_URL`, used to build a full `shareUrl` in the `createShareLink` response; falls back to a relative path if unset. |

## Deliberately not built

`permission: 'edit'` existed in the schema before this change set but nothing
ever checked it - that gap is what `editSharedCard.ts` now closes. What's
still not there: any rate limiting on the new anonymous write endpoint. There's
no rate-limiting middleware anywhere in this app yet, and you can't "ban a
user" you have no identity for, only revoke the link (which also blocks
whoever you meant to share it with) - worth thinking about before this sees
real traffic, but adding a rate-limit library is a bigger, separate decision.

## Caveats (same sandbox limitation as the search feature above - no network,
couldn't run `npm install` or a real `tsc` build)

- Verify with your own `npm install && npm run build`. I type-checked
  against the bare `tsc` binary with no `node_modules` present, which
  catches syntax errors but not real type resolution against your actual
  installed package versions.
- The partial unique index on `Link` (`{ createdBy, targetType, targetedAt }`,
  unique among non-revoked docs) relies on MongoDB treating "brain" shares'
  missing `targetedAt` consistently across documents for the same user -
  this is standard Mongo index behavior, but I haven't run it against a real
  cluster to confirm under load.

---

# RAG: Qdrant → Atlas Vector Search migration

Reason for the change: Qdrant's free tier auto-suspends clusters after
~7 days idle (deletes after ~28), which is exactly what was happening.
Rather than babysit a second free-tier service, the vector now lives as
a plain field on the card document it belongs to, in the same Atlas
cluster that already holds everything else.

## Where each file goes

| File | Status | What it does |
|---|---|---|
| `src/models/Card.ts` | MODIFIED | Added `embedding: number[]` (`select: false`), plus a `toJSON` transform stripping it from any serialized output. |
| `src/types/types.ts` | MODIFIED | Added `embedding?: number[]` to `CardInput`. |
| `src/services/vectorStore.ts` | REWRITTEN | Same exported function names/signatures as the Qdrant version (`upsertCardVector`, `searchCards`) - internals now write to and query the `cards` collection directly via `$vectorSearch` instead of talking to Qdrant. `deleteCardVector` is gone entirely: deleting the card document deletes its embedding with it, nothing external left to clean up. |
| `src/controllers/querySearch.ts` | SIMPLIFIED | `searchCards()` now returns full card data directly (Atlas gives you the whole document, not just an ID+score pair like Qdrant did), so the second `CardModel.find({_id: {$in: ...}})` round-trip is gone. Added an optional, clamped `limit` param. |
| `src/controllers/deleteCard.ts` | SIMPLIFIED | Removed the `deleteCardVector` call and its try/catch - see above. |
| `src/controllers/createCards.ts` | **UNCHANGED** | Still calls `upsertCardVector(input)` - same signature, so nothing here needed to move. |
| `src/controllers/updateContent.ts` | **UNCHANGED** | Same reasoning - still calls `upsertCardVector(updated)`. See "Not fixed, flagged instead" below though. |
| `src/scripts/backfillCardEmbeddings.ts` | MODIFIED | Removed the Qdrant-specific `ensureCollection()` call. Otherwise identical. |
| `src/scripts/createVectorIndex.ts` | NEW | One-time index creation, replacing Qdrant's `ensureCollection()`. Includes the manual Atlas-UI JSON as a fallback in its header comment. |
| `package.json` | MODIFIED | Removed `@qdrant/js-client-rest`. Run `npm install` to actually prune it from `node_modules`/the lockfile. |
| `.env.example` | MODIFIED | Removed `QDRANT_URL`/`QDRANT_API_KEY` - nothing new needed in exchange, since this reuses `mongoDbUrl`. |

## Setup

```bash
npm install
npm run build
node dist/scripts/createVectorIndex.js      # one-time, ~1-2 min to become queryable
node dist/scripts/backfillCardEmbeddings.js # embeds any cards created before this
```

Order between those last two doesn't matter. Delete `QDRANT_URL` /
`QDRANT_API_KEY` from your real `.env` - they're dead now, not just
unused.

## Not fixed, flagged instead (out of scope for this change set)

- **`createCards.ts` has no input validation.** Every other write
  endpoint in this app (`signIn`, `signUp`) validates `req.body` with
  zod first; this one doesn't. Doesn't block this migration, but it
  means a request with a missing/non-string `title` reaches
  `cardToEmbeddingText()` before anything catches it.
- **`updateContent.ts`'s `req.body.updatedCard` is passed straight into
  `findOneAndUpdate` with no field allowlist.** Low severity in
  practice - the query is already scoped to `createdBy: req.userId`, so
  the worst case is a user overwriting their own `embedding` field with
  garbage, not touching anyone else's data. Still worth a fix:

  ```ts
  const { title, description, note, tags } = req.body.updatedCard ?? {};
  const safeUpdate = { title, description, note, tags };
  ```

  then pass `safeUpdate` instead of the raw body. Two lines, not done
  here to keep this diff scoped to the migration.

## Caveats (same sandbox limitation as every change set above - no
network, so none of this actually ran against a real cluster)

- I could not run `createVectorIndex.ts` against a live Atlas cluster.
  The `$vectorSearch` and `createSearchIndex()` syntax here matches
  MongoDB's current driver docs, but "matches the docs" and "definitely
  works on your specific cluster tier" aren't the same claim - see the
  fallback instructions in that file's header if it errors out.
- `numCandidates: limit * 20` is Atlas's own stated rule of thumb for
  90%+ recall, not something I benchmarked against your data.
- `all-MiniLM-L6-v2` (the embedding model, unchanged by this migration)
  gives noticeably worse results past ~128 tokens of input and caps out
  around 256 - fine for titles/descriptions, worth knowing if your
  `note` fields tend to run long.
