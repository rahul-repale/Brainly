import type { Request, Response } from "express";
import { CardModel } from "../models/Card.js";
import { LinkModel } from "../models/Link.js";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Fields safe to hand to an anonymous link visitor. Deliberately excludes
// createdBy (the owner's internal db id) and editHistory (contains real
// account usernames). Add fields back explicitly if a feature needs them,
// rather than defaulting to "return everything in the document". Shared
// with editSharedCard.ts so both endpoints expose the same subset of a card.
export const PUBLIC_CARD_FIELDS = "title description note tags";

// Shared by both the read (this file) and edit (editSharedCard.ts) paths, so
// "what counts as a usable link" (not revoked, not expired) can't drift out
// of sync between the two.
export async function findLiveLink(token: string) {
  return LinkModel.findOne({
    token,
    revoked: false,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
}

export async function fetchSharedLink(req: Request, res: Response) {
  try {
    const token = req.params.shareLink as string;
    const data = await findLiveLink(token);

    if (!data) {
      // Same message whether the token never existed, expired, or was
      // revoked - so someone probing tokens can't use the response to tell
      // those cases apart.
      return res.status(404).json({ msg: "This link is invalid or has expired" });
    }

    // Best-effort counter, not awaited: a hiccup here shouldn't fail the
    // actual read. $inc is atomic, unlike the old `clickCount += 1; save()`
    // pattern, which loses increments when two requests race.
    LinkModel.updateOne({ _id: data._id }, { $inc: { clickCount: 1 } }).catch(() => {});

    if (data.targetType === "card") {
      const card = await CardModel.findOne({ createdBy: data.createdBy, _id: data.targetedAt })
        .select(PUBLIC_CARD_FIELDS);
      if (!card) {
        return res.status(404).json({ msg: "The shared card no longer exists" });
      }
      return res.status(200).json({ type: "card", permission: data.permission, card });
    }

    // targetType === "brain": paginate, since this can return every card the
    // owner has ever created and an unbounded .find() doesn't scale.
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_SIZE));

    const [cards, total] = await Promise.all([
      CardModel.find({ createdBy: data.createdBy })
        .select(PUBLIC_CARD_FIELDS)
        .skip((page - 1) * limit)
        .limit(limit),
      CardModel.countDocuments({ createdBy: data.createdBy }),
    ]);

    return res.status(200).json({
      type: "brain",
      permission: data.permission,
      cards,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ msg: "Error, Please try again" });
  }
}
