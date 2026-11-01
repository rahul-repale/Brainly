import express from "express";
import { authRouter } from "./auth.routes.js";
import { cardRouter } from "./card.routes.js";
import { shareRouter } from "./share.routes.js";
import { searchRouter } from "./search.routes.js";
import { tagRouter } from "./tag.routes.js";

export const UserRouter = express.Router();

UserRouter.use("/v1", authRouter);
UserRouter.use("/v1/content", cardRouter);
UserRouter.use("/v1/share", shareRouter);
UserRouter.use("/v1", searchRouter);
UserRouter.use("/v1/tags", tagRouter);
