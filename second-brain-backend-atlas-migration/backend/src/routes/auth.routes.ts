import express from "express";
import { signUp } from "../controllers/signUp.js";
import { signIn } from "../controllers/signIn.js";

export const authRouter = express.Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
