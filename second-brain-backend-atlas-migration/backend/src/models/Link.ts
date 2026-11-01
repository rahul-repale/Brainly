import mongoose from "mongoose";
import crypto from "crypto";
import type { LinkInput } from "../types/types.js";

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const LinkSchema = new Schema<LinkInput>({
  createdBy: { type: ObjectId, required: true, ref: 'users', index: true },
  token: {
    type: String,
    default: () => crypto.randomBytes(20).toString('hex'),
    required: true,
    unique: true
  },
  targetedAt: { type: ObjectId, ref: 'cards' },
  targetType: { type: String, enum: ['card', 'brain'], required: true },
  permission: { type: String, enum: ['view', 'edit'], default: 'view', required: true },
  // null = never expires. A real Date value is the exact instant Mongo's TTL
  // monitor will delete the document (see index below) - not "N days from
  // whenever this happened to be created", which is what the old schema did.
  expiresAt: { type: Date, default: null },
  revoked: { type: Boolean, default: false },
  clickCount: { type: Number, default: 0 }
}, { timestamps: true });

// expireAfterSeconds: 0 on a Date field means "delete at the timestamp the
// field holds", not "N seconds after creation". Mongo's TTL monitor skips
// documents where the field is null, so expiresAt: null reliably means
// "keep until revoked" - it isn't a document the TTL sweep will ever touch.
LinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Backstops the "one live link per owner+target" invariant at the database
// level rather than trusting application code alone. Revoked links are
// excluded from the constraint, so a card can be freely re-shared after an
// old link for it is revoked.
LinkSchema.index(
  { createdBy: 1, targetType: 1, targetedAt: 1 },
  { unique: true, partialFilterExpression: { revoked: false } }
);

export const LinkModel = mongoose.model("links", LinkSchema);
