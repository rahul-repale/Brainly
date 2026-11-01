import express from "express";
import { auth } from "../middlewares/auth.js";
import { getTags, createTag } from "../controllers/tagController.js";

export const tagRouter = express.Router();

tagRouter.get("/", auth, getTags);
tagRouter.post("/", auth, createTag);
