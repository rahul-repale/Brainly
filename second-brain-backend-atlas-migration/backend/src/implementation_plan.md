# Production Readiness & Security Fixes Implementation Plan

This implementation plan outlines the steps required to transition the backend codebase from its current state to a fully secure, robust, and production-ready service.

## User Review Required

> [!IMPORTANT]
> **Authentication Header Format Change**: The auth middleware will be updated to accept `Authorization: Bearer <token>` (standard Bearer header format) as well as fallback to raw tokens for backward compatibility. Please ensure any client applications send standard Bearer headers.

> [!NOTE]
> **Dependencies**: CORS (`cors` & `@types/cors`), Rate Limiting (`express-rate-limit`), and Helmet (`helmet`) will be added to `package.json` for security hardening.

## Proposed Changes

### Build Scripts & Dependencies

#### [MODIFY] [package.json](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/package.json)
- Fix npm build/dev scripts by changing `"npx tsc -b"` to `"tsc -b"`.
- Add `cors`, `helmet`, and `express-rate-limit` dependencies.

---

### Security & Authentication

#### [MODIFY] [auth.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/middlewares/auth.ts)
- Strip `Bearer ` prefix from `req.headers.authorization`.
- Return HTTP `401 Unauthorized` (instead of `403`) when token is missing or invalid.
- Access `process.env.JWT_SECRET` lazily inside handler instead of top-level to prevent startup crashes when env variables load async.

#### [MODIFY] [signUp.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/controllers/signUp.ts)
- Move Zod schema declaration outside request handler function for performance.
- Validate email uniqueness alongside username in `UserModel.findOne({ $or: [{ username }, { email }] })`.
- Return HTTP `409 Conflict` when username or email already exists.
- Return HTTP `400 Bad Request` for Zod validation errors.
- Sanitize 500 error responses (do not dump raw `err` objects).

#### [MODIFY] [signIn.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/controllers/signIn.ts)
- Move Zod schema declaration outside request handler function.
- Fix HTTP status codes: Return `401 Unauthorized` for invalid credentials (instead of `403` / `411`).
- Return HTTP `400 Bad Request` for Zod validation errors.
- Fix typo in success message (`"logged in successfully"`).
- Access `process.env.JWT_SECRET` lazily inside handler.

---

### Input Validation & Controller Error Handling

#### [MODIFY] [types.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/types/types.ts)
- Define Zod schemas for card creation (`createCardSchema`) and card updating (`updateCardSchema`).

#### [MODIFY] [createCards.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/controllers/createCards.ts)
- Apply Zod validation schema to `req.body` (title, description, note, tags).
- Return HTTP `401 Unauthorized` when `req.userId` is missing.
- Return HTTP `400 Bad Request` for validation failures.
- Sanitize error responses.

#### [MODIFY] [updateContent.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/controllers/updateContent.ts)
- Apply Zod validation schema to `req.body` updates.
- Sanitize 500 error outputs.

#### [MODIFY] [getContent.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/controllers/getContent.ts)
- Return HTTP `401 Unauthorized` when `req.userId` is missing.

#### [MODIFY] [deleteCard.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/controllers/deleteCard.ts)
- Validate `req.body.cardId` as a valid ObjectId string.
- Sanitize error output.

---

### Production Infrastructure & Services

#### [MODIFY] [db.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/config/db.ts)
- Guard `mongoose.set('debug', true)` so debug mode only runs in non-production environments.

#### [MODIFY] [embeddingModel.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/services/embeddingModel.ts)
- Export an explicit `initEmbeddingModel()` pre-warming function to load the transformer pipeline during server startup.

#### [MODIFY] [index.ts](file:///e:/Desktop/second-brain-backend-atlas-migration/backend/src/index.ts)
- Add `cors()`, `helmet()`, and rate limiting middlewares.
- Call `initEmbeddingModel()` during boot.
- Add `GET /health` endpoint.
- Add `SIGINT` / `SIGTERM` signal handlers for graceful shutdown.

## Verification Plan

### Automated Tests
- Run TypeScript build check: `npm run build` to verify standard `tsc -b` compilation succeeds without errors.

### Manual Verification
- Test Authentication endpoints (`/v1/signup`, `/v1/signin`) with valid and invalid payloads; verify HTTP `400`, `401`, `409` status codes.
- Test `Authorization: Bearer <token>` header against `/v1/content`.
- Test Card CRUD operations with Zod validation.
- Test `/health` endpoint response.
