import type { Request, Response } from "express";
import { z } from "zod";
import { CardModel } from "../models/Card.js";
import { upsertCardVector } from "../services/vectorStore.js";

const updateCardSchema = z.object({
  cardId: z.string().min(1, "cardId is required"),
  updatedCard: z.object({
    title: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    note: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export async function updateContent(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ err: "Session Timeout, Login again" });
  }

  const parsed = updateCardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ err: "Validation failed", issues: parsed.error.issues });
  }

  const { cardId, updatedCard } = parsed.data;

  try {
    const updated = await CardModel.findOneAndUpdate(
      { createdBy: req.userId, _id: cardId },
      { $set: updatedCard },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: "Card not found" });
    }

    // Re-index in the background
    upsertCardVector(updated).catch((err) => {
      console.error(`Failed to re-index card ${updated._id.toString()} for search:`, err);
    });

    return res.status(200).json({ msg: "Card Updated", card: updated });
  } catch (err) {
    console.error("updateContent error:", err);
    return res.status(500).json({ msg: "Error, Please try again", err });
  }
}
