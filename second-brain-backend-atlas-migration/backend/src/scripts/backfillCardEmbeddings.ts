/**
 * Run this once (and again any time you need to fully rebuild the index,
 * e.g. after changing the embedding model or the text you embed).
 *
 * From backend/, after building:
 *   node dist/scripts/backfillCardEmbeddings.js
 *
 * New cards created after this go through createCard's own indexing
 * call - this script is only for the backlog of cards that existed
 * before the search feature did.
 *
 * Order doesn't matter relative to createVectorIndex.ts (this script) -
 * you can create the index before or after backfilling. Vector Search
 * just won't have anything to serve until documents with an `embedding`
 * field exist, and won't be queryable at all until the index finishes
 * building.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { CardModel } from "../models/Card.js";
import { upsertCardVector } from "../services/vectorStore.js";

async function run(): Promise<void> {
  await connectDB();

  // Every card gets re-embedded and re-written unconditionally, including
  // ones that already have an `embedding` from a previous run. Cheap
  // enough at personal-project scale, and it means this script is also
  // your "rebuild everything" tool if you ever change the embedding
  // model or the text you embed - just run it again.
  const cards = await CardModel.find().populate<{ tags: { tagName: string }[] }>("tags");
  console.log(`Found ${cards.length} card(s) to embed.`);

  let succeeded = 0;
  for (const card of cards) {
    try {
      await upsertCardVector(card);
      succeeded += 1;
      console.log(`[${succeeded}/${cards.length}] embedded "${card.title}" (${card._id.toString()})`);
    } catch (err) {
      console.error(`Failed to embed card ${card._id.toString()}:`, err);
    }
  }

  console.log(`Done. Embedded ${succeeded}/${cards.length} card(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
