import "dotenv/config"; 
import express from "express";
import { UserRouter } from "./routes/index.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || "3000";
const app = express();

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow all origins in development or matching ALLOWED_ORIGINS
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/user", UserRouter);

// Connect DB and listen if not in serverless environment
if (process.env.NODE_ENV !== "test") {
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  }).catch((err) => {
    console.error("Failed to initialize server:", err);
  });
}

export default app;
