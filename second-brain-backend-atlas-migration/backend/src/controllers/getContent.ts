import type { Request, Response } from "express";
import { CardModel } from "../models/Card.js";

export async function getContent(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ err: "Session Timeout, Login again" });
  }

  try {
    const content = await CardModel.find({ createdBy: req.userId }).sort({ _id: -1 });
    return res.status(200).json(content);
  } catch (err) {
    console.error("getContent error:", err);
    return res.status(500).json({ msg: "Error fetching cards", err });
  }
}
