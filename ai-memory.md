# AI Memory - Second Brain Project Context & Progress

## 1. Initial Condition of the Project

When this project was received, it consisted of two main directories:
- `second-brain-backend-atlas-migration/backend` (Express 5, TypeScript, MongoDB Atlas with Vector Search using `@huggingface/transformers` all-MiniLM-L6-v2)
- `brainly-frontend-complete` (Vite, React 19, Tailwind CSS v4, Zustand, Lucide icons)
- Historical debug files: `backend-test-errors.txt`, `backend.txt`, and `frontend.txt`

### Backend State:
- **Atlas Vector Search**: Migrated to MongoDB Atlas `$vectorSearch` with 384-dimensional embeddings generated via `@huggingface/transformers` (`all-MiniLM-L6-v2`).
- **Auth**: JWT-based authentication for signup and signin.
- **Card CRUD**: Cards with `title`, `description`, `note`, `tags`, `editHistory`, and `embedding`.
- **Share Links**: Card-level and brain-level shareable links with permissions and expiration.
- **Critical Issues Identified**:
  1. **Hanging `createCard` (`POST /user/v1/content`)**: Documented in `backend-test-errors.txt` (Issue 1). `upsertCardVector` was awaited synchronously inside the request handler; on CPU/cold-load of the ONNX pipeline, the request would stall or time out. Also the response handling needed to decouple heavy embedding from HTTP latency.
  2. **Unfiltered Semantic Search (`POST /user/v1/query`)**: Documented in `backend-test-errors.txt` (Issue 2). Semantic vector search returned all candidate cards regardless of how low their cosine similarity was (e.g., asking about JS event loops returned unrelated Web3 notes with score ~0.55).
  3. **No CORS Middleware**: The backend did not have CORS headers configured, causing browser requests from `localhost:5173` to be blocked immediately.
  4. **Missing RAG AI Endpoint**: The core requirement—asking questions in the home/dashboard tab and having an AI synthesize answers using MongoDB semantic search context—was completely missing.
  5. **Missing Tag API**: The backend defined a Tag model but lacked endpoints for fetching and creating tags.
  6. **TypeScript Compiler Errors**: `exactOptionalPropertyTypes: true` broke Mongoose query types; `express.d.ts` was not recognized as an ambient augmentation; `route/userRoute.js` was imported instead of `./routes/index.js`.
  7. **Deployment**: No `vercel.json` or production configuration for deploying the Express backend to Vercel.

### Frontend State:
- Beautiful UI implementation with interactive canvas board, cards, sticky notes, checklists, embeds, and connections.
- **Critical Issues Identified**:
  1. **Disconnected from Backend**: Zustand stores (`useCardStore`, `useTagStore`, `useLinkStore`) were powered entirely by hardcoded in-memory `mockData.ts`.
  2. **Mock Authentication**: `SignInPage` and `SignUpPage` only performed client-side length checks and redirected to `/dashboard` without sending requests or storing JWTs.
  3. **No RAG Search UI**: The dashboard lacked the AI search interface that lets users type a question, fetch semantic matches, and view the AI-generated answer with citations.
  4. **No SPA Routing on Vercel**: No `vercel.json` rewrite rule to redirect client-side routes (`/dashboard`, `/board/:id`, `/share/:token`) to `index.html`.
  5. **Unused imports & TypeScript build errors**: Unused React imports and type mismatches with async tag creation.

---

## 2. Improvements Implemented

### Backend Enhancements:
1. **CORS Support**: Added robust CORS middleware in `src/index.ts` handling `GET, POST, PUT, DELETE, OPTIONS`, configurable allowed origins, and `Authorization` headers.
2. **Fixed Card Creation & Background Indexing**: Decoupled `upsertCardVector` into an asynchronous, non-blocking background job with error logging so `createCard` returns instantly with the created card document (solves Issue 1).
3. **Score Threshold Filter for Semantic Search**: Updated `src/controllers/querySearch.ts` with a `minScore` threshold (default 0.65) to eliminate irrelevant results (solves Issue 2).
4. **Added RAG AI Query Endpoint (`POST /user/v1/ai-query`)**:
   - Queries MongoDB Atlas vector search for user's relevant cards.
   - Extracts relevant note titles, descriptions, and notes.
   - Queries Google Gemini API (or OpenAI API, with a clean built-in fallback summary if no API key is provided).
   - Returns both the synthesized answer and the matching source cards with similarity scores.
5. **Tags Management API**: Created `/user/v1/tags` (`GET` and `POST`) in `src/controllers/tagController.ts` and `src/routes/tag.routes.ts` with duplicate name prevention.
6. **All TypeScript Errors Fixed**:
   - Fixed ambient declaration in `src/types/express.d.ts` with `import "express"`.
   - Adjusted `exactOptionalPropertyTypes: false` in `tsconfig.json` for Mongoose compatibility.
   - Fixed type castings in `createShareLink.ts`, `revokeShareLink.ts`, `Card.ts`, and `createVectorIndex.ts`.
   - Replaced broken import `./routes/userRoute.js` with `./routes/index.js` in `src/index.ts`.
7. **Vercel Serverless Configuration**: Added `vercel.json`, `vercel-build` script in `package.json`, and exported `app` in `src/index.ts`.
8. **Compilation Verified**: `npm run build` (`npx tsc -b`) succeeds with 0 errors.

### Frontend Enhancements:
1. **API Client (`src/services/api.ts`)**: Built a typed HTTP service layer covering Auth, Cards, Tags, Semantic Search, AI RAG Query, and Share Links, with automatic JWT token management and auth error redirection.
2. **Real Authentication**:
   - Integrated `useAuthStore` managing login, signup, JWT storage in `localStorage`, and logout.
   - Added auth route guard (`RequireAuth` in `AppRouter.tsx`) so protected routes redirect unauthenticated users to `/`.
   - Wired `SignInPage` and `SignUpPage` to real backend endpoints with clear error messaging and auto-login.
   - Dynamic user profile and sign out in `Sidebar.tsx`.
3. **Zustand Store API Sync**: Connected `useCardStore`, `useTagStore`, and `useLinkStore` to the backend API so cards and tags persist to MongoDB.
4. **Interactive RAG Feature on Dashboard**:
   - Added "Ask Your Second Brain (RAG Search)" section on `DashboardPage.tsx` with Gemini/OpenAI integration.
   - Shows real-time loading states, streaming/answers, and linked source notes with similarity percentages.
5. **Vercel SPA Configuration**: Added `vercel.json` with rewrites for client-side routing.
6. **Compilation Verified**: `npm run build` succeeds with 0 warnings and 0 errors in 1.18s.

---

## 3. Next Steps & Deployment Checklist

1. **Local Verification**:
   - Start backend: `cd second-brain-backend-atlas-migration/backend && npm run dev`
   - Start frontend: `cd brainly-frontend-complete && npm run dev`
   - Sign up a new user, create a couple of cards, and test the RAG search on the dashboard.
2. **Push to GitHub**:
   - Initialize git repo if not already initialized:
     ```bash
     git add .
     git commit -m "feat: integrate frontend and backend with RAG search and Vercel configs"
     git branch -M main
     git remote add origin <your-github-repo-url>
     git push -u origin main
     ```
3. **Deploy Backend to Vercel**:
   - Root Directory: `second-brain-backend-atlas-migration/backend`
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Set Environment Variables: `mongoDbUrl`, `JWT_SECRET`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS`, `CLIENT_URL`.
4. **Deploy Frontend to Vercel**:
   - Root Directory: `brainly-frontend-complete`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Set Environment Variable: `VITE_API_URL` pointing to the deployed backend URL.
