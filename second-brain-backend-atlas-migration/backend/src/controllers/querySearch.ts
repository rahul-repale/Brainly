import type { Request, Response } from "express";
import { z } from "zod";
import { searchCards } from "../services/vectorStore.js";

const querySchema = z.object({
  query: z.string().trim().min(1, "query cannot be empty").max(500, "query is too long"),
  limit: z.number().int().min(1).max(25).optional(),
  minScore: z.number().min(0).max(1).optional(),
});

export async function querySearch(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ err: "Session Timeout, Login again" });
  }

  const safeBody = querySchema.safeParse(req.body);
  if (!safeBody.success) {
    return res.status(411).json(safeBody.error.issues);
  }

  try {
    const rawResults = await searchCards(
      safeBody.data.query,
      req.userId,
      safeBody.data.limit ?? 10
    );

    // Filter out low-relevance cards: default min score is 0.65
    // Dot product on normalized vectors ranges from -1 to 1;
    // Semantically matching content typically scores > 0.65 - 0.70.
    const minScore = safeBody.data.minScore ?? 0.65;
    const results = rawResults.filter((card) => card.score >= minScore);

    return res.status(200).json({ results });
  } catch (err) {
    console.error("querySearch failed:", err);
    return res.status(500).json({ msg: "Error, Please try again" });
  }
}
