import express from "express";
import { auth } from "../middlewares/auth.js";
import { createShareLink } from "../controllers/createShareLink.js";
import { listShareLinks } from "../controllers/listShareLinks.js";
import { revokeShareLink } from "../controllers/revokeShareLink.js";
import { fetchSharedLink } from "../controllers/fetchSharedBrain.js";
import { editSharedCard } from "../controllers/editSharedCard.js";

export const shareRouter = express.Router();

shareRouter.post("/", auth, createShareLink);
shareRouter.get("/", auth, listShareLinks);
shareRouter.delete("/:linkId", auth, revokeShareLink);
shareRouter.get("/:shareLink", fetchSharedLink);
shareRouter.put("/:shareLink", editSharedCard);
