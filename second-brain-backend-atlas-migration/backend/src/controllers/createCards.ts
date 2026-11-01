import type { Request, Response } from "express";
import { CardModel } from "../models/Card.js";
import { UserModel } from "../models/User.js";
import mongoose from "mongoose";
import type { CardInput } from "../types/types.js";
import { upsertCardVector } from "../services/vectorStore.js";

export async function createCard(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ err: "Session Timeout, Login again" });
  }

  try {
    const user = await UserModel.findOne({ _id: req.userId });
    if (!user) {
      return res.status(403).json({ msg: "Invalid Credentials, Please Login again" });
    }

    const card: CardInput = {
      createdBy: mongoose.Types.ObjectId.createFromHexString(req.userId),
      title: req.body.title || "Untitled Card",
      description: req.body.description || "",
      tags: req.body.tags || [],
      note: req.body.note || "",
      editHistory: [
        {
          userId: mongoose.Types.ObjectId.createFromHexString(req.userId),
          userName: (user.username as string) || "Anonymous",
        },
      ],
    };

    const input = await CardModel.create(card);

    // Run embedding in the background so HTTP response is returned immediately
    upsertCardVector(input).catch((err) => {
      console.error(`Failed to index card ${input._id.toString()} for search:`, err);
    });

    return res.status(200).json(input);
  } catch (err) {
    console.error("createCard error:", err);
    return res.status(500).json({ msg: "Failed to create card", err });
  }
}
