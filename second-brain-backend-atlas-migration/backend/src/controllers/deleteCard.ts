import type { Request, Response } from "express";
import { z } from "zod";
import { CardModel } from "../models/Card.js";

const deleteCardSchema = z.object({
  cardId: z.string().min(1, "cardId is required"),
});

export async function deleteContent(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ err: "Session Timeout, Login again" });
  }

  const parsed = deleteCardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ err: "cardId is required", issues: parsed.error.issues });
  }

  try {
    await CardModel.deleteMany({ createdBy: req.userId, _id: parsed.data.cardId });
    return res.status(200).json({ msg: "Card deleted" });
  } catch (err) {
    return res.status(500).json({ msg: "Error, Please try again", err });
  }
}
