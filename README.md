# Brainly — AI Second Brain Notes & Semantic RAG System

A full-stack personal knowledge management application featuring **Retrieval-Augmented Generation (RAG)** powered by MongoDB Atlas Vector Search and AI (Google Gemini / OpenAI).

---

## 🌟 Key Features

1. **AI-Powered RAG Search in Home Tab**:
   - Ask any natural language question from the home dashboard.
   - MongoDB Atlas `$vectorSearch` performs semantic retrieval against your notes using 384-dimensional dense vector embeddings.
   - The backend feeds matching notes as grounded context to AI (Google Gemini or OpenAI).
   - Generates an accurate, synthesized answer citing your original notes with similarity match percentages.

2. **Interactive Visual Canvas Board**:
   - Freeform canvas board for every card.
   - Sticky notes with customizable pastel color palettes.
   - Interactive checklists with live progress tracking.
   - Rich URL embed cards (YouTube with auto oEmbed titles, Twitter/X, GitHub, articles).
   - Dynamic connector arrows between related blocks with auto bezier routing.
   - Canvas zoom, drag-and-drop, and quick paste onto canvas.

3. **Secure Auth & Sharing**:
   - JWT-based authentication with bcrypt-hashed passwords.
   - Share individual cards or your whole brain with custom permissions (`view` or `edit`).
   - TTL-backed link expiration and live click tracking.

---

## 📁 Repository Structure

```
├── brainly-frontend-complete/      # Vite + React 19 + Tailwind CSS + Zustand
│   ├── src/
│   │   ├── components/            # UI, board blocks, card modals, app layout
│   │   ├── pages/                 # Dashboard (RAG search), AllCards, Board, Tags, Share
│   │   ├── services/api.ts        # Typed API service client with JWT handling
│   │   ├── stores/                # Zustand stores (useAuthStore, useCardStore, useAIStore, ...)
│   ├── vercel.json                # SPA routing rewrites for Vercel
│   └── .env.example
│
├── second-brain-backend-atlas-migration/backend/  # Node.js + Express 5 + TypeScript + MongoDB Atlas
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── aiQuery.ts         # RAG controller (vector search + LLM answer synthesis)
│   │   │   ├── querySearch.ts     # Semantic search with relevance score filtering
│   │   │   ├── createCards.ts     # Card creation with non-blocking async embedding
│   │   │   ├── getContent.ts      # User cards retrieval
│   │   │   ├── tagController.ts   # Tag creation and retrieval
│   │   │   ├── createShareLink.ts # Share links management
│   │   ├── services/
│   │   │   ├── embeddingModel.ts  # Local 384-dim embedding pipeline (all-MiniLM-L6-v2)
│   │   │   └── vectorStore.ts     # Atlas $vectorSearch aggregation pipeline
│   ├── vercel.json                # Serverless deployment configuration
│   └── .env.example
│
├── ai-memory.md                   # Project history, improvements, and next steps
└── README.md
```

---

## 🚀 Getting Started Locally

### 1. Backend Setup

```bash
cd second-brain-backend-atlas-migration/backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

Edit `.env` in `backend/`:
```env
mongoDbUrl=mongodb+srv://<username>:<password>@cluster0.mongodb.net/secondbrain?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173

# AI Provider for RAG search (get a free key at https://aistudio.google.com/apikey)
GEMINI_API_KEY=your_gemini_api_key_here
# Or use OpenAI:
# OPENAI_API_KEY=your_openai_key_here

CLIENT_URL=http://localhost:5173
```

Run the backend:
```bash
# Build TypeScript
npm run build

# Start the server (runs on port 3000)
npm run dev
```

*(Optional) Create the Atlas Vector Search Index:*
```bash
node dist/scripts/createVectorIndex.js
```
And if you have existing un-embedded cards:
```bash
node dist/scripts/backfillCardEmbeddings.js
```

---

### 2. Frontend Setup

```bash
cd brainly-frontend-complete

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

Verify `.env` in `frontend/`:
```env
VITE_API_URL=http://localhost:3000
```

Start the Vite development server:
```bash
npm run dev
```

Open your browser at `http://localhost:5173`. Create an account, add notes, and ask questions in the RAG search box on the Dashboard!

---

## 🌐 Deploying to Vercel

### Step 1: Deploy the Backend to Vercel

1. In Vercel, click **Add New Project** and import your repository.
2. Set **Root Directory** to:
   `second-brain-backend-atlas-migration/backend`
3. Set **Framework Preset** to `Other`.
4. Build Command: `npm run vercel-build`
5. Output Directory: `dist`
6. Add Environment Variables in Vercel Project Settings:
   - `mongoDbUrl`: Your MongoDB Atlas connection URI.
   - `JWT_SECRET`: Secret key for JWTs.
   - `GEMINI_API_KEY`: Your Gemini API key.
   - `ALLOWED_ORIGINS`: Your frontend Vercel URL (e.g. `https://your-brainly-frontend.vercel.app`).
   - `CLIENT_URL`: Your frontend Vercel URL.
7. Click **Deploy**. Note down your backend URL (e.g., `https://second-brain-api.vercel.app`).

### Step 2: Deploy the Frontend to Vercel

1. In Vercel, click **Add New Project** and select the same repository.
2. Set **Root Directory** to:
   `brainly-frontend-complete`
3. Set **Framework Preset** to `Vite`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL`: Set to your deployed backend URL from Step 1 (e.g. `https://second-brain-api.vercel.app`).
7. Click **Deploy**.
8. Go back to your backend Vercel project and update `ALLOWED_ORIGINS` to include your live frontend URL!

---

## 🛠️ Issues Solved During Integration

1. **Hanging Postman/Curl Request on Card Creation (`POST /user/v1/content`)**:
   - Cause: `upsertCardVector` synchronously ran the local embedding model, blocking the HTTP response thread on CPU inference and ONNX model loads.
   - Fix: Decoupled embedding into an asynchronous, non-blocking background task. HTTP response returns instantly with 200/201 while vector indexing finishes in the background.

2. **Irrelevant Results in Semantic Search (`POST /user/v1/query`)**:
   - Cause: Unbounded `$vectorSearch` returns top-K nearest neighbors regardless of cosine similarity score.
   - Fix: Added a default relevance threshold (`minScore = 0.65`) filtering out distant semantic matches.

3. **CORS Missing**:
   - Cause: No CORS headers were returned by Express, causing browsers to reject frontend fetch requests.
   - Fix: Added configurable CORS middleware handling preflight `OPTIONS` and standard headers (`Authorization`, `Content-Type`).

4. **Missing RAG AI Endpoint**:
   - Implemented `POST /user/v1/ai-query` combining MongoDB Atlas semantic search with LLM answer synthesis and citations.
