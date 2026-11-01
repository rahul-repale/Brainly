import type { Request, Response } from "express";
import { z } from "zod";
import { searchCards } from "../services/vectorStore.js";

const aiQuerySchema = z.object({
  query: z.string().trim().min(1, "query cannot be empty").max(500, "query is too long"),
  limit: z.number().int().min(1).max(10).optional(),
});

/**
 * POST /user/v1/ai-query
 * RAG Endpoint:
 * 1. Semantic search in MongoDB Atlas retrieves the user's most relevant notes
 * 2. Assembles context from those notes
 * 3. Prompts an LLM (Gemini or OpenAI or fallback) to answer based on user's notes
 * 4. Returns the AI synthesized answer and source citations
 */
export async function aiQuery(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ err: "Session Timeout, Login again" });
  }

  const safeBody = aiQuerySchema.safeParse(req.body);
  if (!safeBody.success) {
    return res.status(411).json(safeBody.error.issues);
  }

  const userQuery = safeBody.data.query;

  try {
    const rawResults = await searchCards(
      userQuery,
      req.userId,
      safeBody.data.limit ?? 5
    );

    // Filter to cards with relevance >= 0.55
    const sources = rawResults.filter((card) => card.score >= 0.55);

    if (sources.length === 0) {
      return res.status(200).json({
        answer: "I searched your second brain, but couldn't find any notes closely related to this question. Try creating a card on this topic first!",
        sources: [],
      });
    }

    // Build context string from the matched notes
    const context = sources
      .map((card, i) => {
        const parts = [`[Note ${i + 1}: "${card.title}"]`];
        if (card.description) parts.push(`Summary: ${card.description}`);
        if (card.note) parts.push(`Content: ${card.note}`);
        return parts.join("\n");
      })
      .join("\n\n");

    const systemPrompt = `You are Brainly AI, an intelligent personal knowledge assistant.
You answer the user's questions based EXCLUSIVELY on the notes from their personal Second Brain provided below.
Rules:
- Be clear, accurate, and concise.
- Directly reference which note(s) information comes from (e.g. "According to your note 'Title'...").
- If the notes don't contain enough information to answer fully, answer what you can from the notes and mention what is missing.
- Format with neat Markdown (bullet points, bold text).`;

    const userPrompt = `Here are the relevant notes from my Second Brain:\n\n${context}\n\nMy Question: ${userQuery}`;

    let answer: string | null = null;

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        answer = await callGemini(geminiKey, systemPrompt, userPrompt);
      } catch (geminiErr) {
        console.warn("Gemini call failed, checking fallback:", geminiErr);
      }
    }

    if (!answer && openaiKey) {
      try {
        answer = await callOpenAI(openaiKey, systemPrompt, userPrompt);
      } catch (openaiErr) {
        console.warn("OpenAI call failed:", openaiErr);
      }
    }

    if (!answer) {
      // Clean heuristic synthesis fallback
      answer = `### Summary from your Second Brain:\n\nBased on your notes on **${sources.map((s) => `"${s.title}"`).join(", ")}**:\n\n` +
        sources
          .map(
            (s, idx) =>
              `${idx + 1}. **${s.title}** (relevance: ${Math.round(s.score * 100)}%):\n   ${s.description || s.note || "Note saved without summary."}`
          )
          .join("\n\n");
    }

    return res.status(200).json({
      answer,
      sources: sources.map((c) => ({
        _id: c._id,
        title: c.title,
        description: c.description,
        score: c.score,
      })),
    });
  } catch (err) {
    console.error("aiQuery failed:", err);
    return res.status(500).json({ msg: "Error generating AI response", err });
  }
}

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const candidateModels = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"];

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (err) {
      console.warn(`Attempt with ${model} failed, trying next model:`, err);
    }
  }

  throw new Error("All Gemini model endpoints failed.");
}

async function callOpenAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = (await response.json()) as any;
  return data.choices?.[0]?.message?.content ?? "No answer received from AI.";
}
