import express from "express";
import { auth } from "../middlewares/auth.js";
import { getContent } from "../controllers/getContent.js";
import { createCard } from "../controllers/createCards.js";
import { deleteContent } from "../controllers/deleteCard.js";
import { updateContent } from "../controllers/updateContent.js";

export const cardRouter = express.Router();

cardRouter.get("/", auth, getContent);
cardRouter.post("/", auth, createCard);
cardRouter.delete("/", auth, deleteContent);
cardRouter.put("/", auth, updateContent);
