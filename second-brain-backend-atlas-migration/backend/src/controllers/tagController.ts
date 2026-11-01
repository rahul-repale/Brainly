import type { Request, Response } from "express";
import { z } from "zod";
import { TagModel } from "../models/Tag.js";

const tagSchema = z.object({
  tagName: z.string().trim().min(1, "Tag name cannot be empty").max(50, "Tag name is too long"),
});

export async function getTags(_req: Request, res: Response) {
  try {
    const tags = await TagModel.find();
    return res.status(200).json(tags);
  } catch (err) {
    console.error("getTags error:", err);
    return res.status(500).json({ msg: "Failed to fetch tags", err });
  }
}

export async function createTag(req: Request, res: Response) {
  const safeBody = tagSchema.safeParse(req.body);
  if (!safeBody.success) {
    return res.status(411).json(safeBody.error.issues);
  }

  const { tagName } = safeBody.data;

  try {
    // Avoid duplicate tags (case-insensitive check)
    const existing = await TagModel.findOne({
      tagName: { $regex: new RegExp(`^${tagName}$`, "i") },
    });

    if (existing) {
      return res.status(200).json(existing);
    }

    const newTag = await TagModel.create({ tagName });
    return res.status(201).json(newTag);
  } catch (err) {
    console.error("createTag error:", err);
    return res.status(500).json({ msg: "Failed to create tag", err });
  }
}
