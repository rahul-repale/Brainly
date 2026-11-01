import mongoose from "mongoose";
import type { CardInput } from "../types/types.js";

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const DateType = Schema.Types.Date;

const CardSchema = new Schema<CardInput>({
  createdBy: { type: ObjectId, required: true, ref: 'users' },
  tags: [{ type: ObjectId, ref: 'tags' }],
  title: String,
  description: String,
  note: String,
  editHistory: [{ 
    userId: { type: ObjectId, ref: 'users' },
    userName: String,
    timeStamp: { type: DateType, default: Date.now }
  }],
  // 384 floats from all-MiniLM-L6-v2 (see services/embeddingModel.ts).
  // select: false keeps it out of find()/findOne() results by default -
  // no reason to ship a few KB of floats to the client on every
  // getContent() call. This does NOT apply to .aggregate() results
  // (searchCards() in vectorStore.ts has to $project it out manually,
  // which it does) or to documents you already hold in memory after
  // .create()/.save() - the toJSON transform below is what catches those.
  embedding: { type: [Number], select: false }
});

// Belt-and-suspenders with the select:false above: this strips
// `embedding` from *any* document's JSON output (create/find/whatever),
// since select:false alone only affects what a fresh query fetches, not
// a document you're already holding and about to res.json().
CardSchema.set('toJSON', {
  transform: (_doc: unknown, ret: any) => {
    delete ret.embedding;
    return ret;
  }
});

export const CardModel = mongoose.model("cards", CardSchema);
