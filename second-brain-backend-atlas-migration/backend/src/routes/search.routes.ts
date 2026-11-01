import express from "express";
import { auth } from "../middlewares/auth.js";
import { querySearch } from "../controllers/querySearch.js";
import { aiQuery } from "../controllers/aiQuery.js";

export const searchRouter = express.Router();

// Semantic search only
searchRouter.post("/query", auth, querySearch);

// Full RAG search: Semantic search + AI answer synthesis
searchRouter.post("/ai-query", auth, aiQuery);
