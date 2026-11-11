# VECTRA: Framework, Models, and API Implementation Report

**Project:** VECTRA — Vector-Enhanced Cognitive Tutoring & Reasoning Architecture  
**Repository snapshot:** commit `9aa68b3` plus this report  
**Scope:** backend, frontend, database model, ingestion pipeline, tutoring integration, analytics, and evaluation artifacts

## 1. Executive overview

VECTRA is a web application for learning-resource ingestion, retrieval-assisted tutoring, practice, and learner analytics. The frontend is a React/TypeScript single-page application. The backend is a FastAPI service backed by PostgreSQL with pgvector-compatible vector columns, SQLAlchemy persistence, Redis, and a Celery worker for background document indexing. The tutor uses Gemini through Google's OpenAI-compatible API endpoint when relevant indexed resource excerpts are available.

The term “model” describes several different things in this project. VECTRA has database entity models, a deterministic text-vector baseline, explicit learner-state formulas, and an external generative language model. The current code does **not** train a custom neural network or establish a validated model-accuracy score. Readiness and mastery are transparent application metrics, not predictions of hiring outcomes.

## 2. Architecture and request flow

```text
Learner / educator
        │
        ▼
React + TypeScript frontend (Vite)
        │  /api requests, bearer access token
        ▼
FastAPI application ───────────────► Gemini API (generated tutor answer)
        │                                  ▲
        ├── SQLAlchemy ─► PostgreSQL       │ retrieved excerpts
        │                                  │
        ├── resource upload ─► disk volume ─► Redis queue ─► Celery worker
        │                                                   │
        └────────────────────────────────────────── PostgreSQL chunks/vectors
```

The frontend API wrapper adds JSON headers and the saved access token, refreshes an expired access token once, and normalizes API errors. The backend validates and authorizes the request, retrieves data scoped to the user where appropriate, and returns JSON. Large document indexing is queued so uploads return before indexing finishes.

**Primary implementation references**

- Frontend request wrapper and token refresh: `frontend/project/src/lib/api.ts:1–50`.
- FastAPI setup, error handling, and health endpoints: `app/main.py:1–47`.
- Compose services and data volumes: `docker-compose.yml`.
- Container startup, migrations, seed data, and Uvicorn: `Dockerfile`.

## 3. Components and responsibilities

| Component | Implementation | Role |
|---|---|---|
| Frontend | `frontend/project/src/` (React, TypeScript, Vite) | Sign-in, learning resources, tutor, practice, assessments, readiness, reports, and educator views |
| HTTP API | `app/main.py` | Authentication, documents, search, tutor, practice, revision, analytics, and mock tests |
| Request/response schemas | `app/schemas.py` | Pydantic validation for API inputs and outputs |
| Persistence | `app/models/core.py`, `app/database.py` | SQLAlchemy entities and database session setup |
| AI adapters | `app/ai.py` | Embedding and LLM provider interfaces, deterministic vector baseline, compatible chat API client |
| Retrieval and learner metrics | `app/services.py` | Chunking, cosine ranking, mistakes, mastery, and readiness calculations |
| Ingestion worker | `app/tasks.py` | Redis/Celery queue, CSV row conversion, chunk batches, and indexing status |
| Reasoning planner | `app/reasoning.py` | Rule-based intent recognition and action selection |
| Schema evolution | `migrations/versions/` | Alembic database migrations |
| Seed/evaluation/data tools | `scripts/` | Initial concepts/questions, tutor benchmark, synthetic CSV generation |

The selected application source trees contain about **8,478 lines of Python, TypeScript, and TSX** (app, frontend source, migrations, scripts, tests). That count excludes CSS, HTML, JSON, SQL, package files, generated data, and documentation.

## 4. Data model

The SQLAlchemy schema in `app/models/core.py` represents these main concepts:

- **Identity and access:** `User` stores a password hash and a `STUDENT`, `EDUCATOR`, or `ADMIN` role. `StudentProfile` stores goals and preferences.
- **Knowledge library:** `Document` tracks owner, file type, indexing status, storage metadata, and extracted text. `DocumentChunk` stores searchable text, topic, chunk index, metadata, and a vector.
- **Concept map:** `Concept` and `ConceptRelationship` model named concepts and typed links such as prerequisite, related, or advanced-version.
- **Assessment:** `Question`, `QuestionAttempt`, `PracticeSession`, `MockTest`, `MockTestQuestion`, and `MockTestAttempt` store question-bank and learner activity.
- **Adaptation and reporting:** `LearningState`, `Mistake`, `RevisionPlan`, and `Readiness` store per-learner calculations and recommendations.

The embedding column is configured as `Vector(embedding_dimensions)` for PostgreSQL and JSON for SQLite in `app/models/core.py:25`. PostgreSQL deployment uses the pgvector image in Compose; SQLite is also used by the isolated test/evaluation setup.

## 5. Data ingestion and retrieval

### Upload and indexing

`POST /api/documents/upload` accepts PDF, DOCX, TXT, or CSV and persists a document record. The worker in `app/tasks.py` reads the stored file and indexes it in the background. CSV ingestion reads the header, turns each row into labeled text (for example, `Column: value`), streams words through a chunk writer, and commits chunks in batches. The writer defaults to 900 words per chunk with a 120-word overlap and commits every 250 chunks.

PDF/DOCX/TXT extraction and CSV conversion feed the same document chunk table. A document progresses through `UPLOADED`, `PROCESSING`, `COMPLETED`, or `FAILED`; API document results include chunk counts so the client can show processing status.

### Embeddings and search

The current local embedding baseline is a deterministic hashed bag-of-words vector. Each lowercased whitespace-delimited token is SHA-256 hashed into one of 64 vector buckets; the vector is L2-normalized. Search embeds the query with the same function, loads eligible chunks, calculates cosine similarity, sorts them, and returns the top K matches. Student searches are constrained to their own documents; educator/admin queries can search shared resources.

This is reproducible and avoids requiring an embedding service, but it is **not a semantic embedding model**: word order and context are not represented, and hash collisions can occur. The code also contains an OpenAI-compatible embedding adapter, but the current `.env` configuration uses `EMBEDDING_PROVIDER=deterministic`. Gemini is configured for text generation, not embeddings.

## 6. Tutor and reasoning models

### Retrieval-augmented answer generation

The `/api/tutor/chat` handler retrieves up to five resource chunks for the learner's question. If matching material exists, it sends the question, up to 6,000 characters of retrieved context, and available mastery context to the configured LLM. The system instruction tells the tutor to use excerpts as evidence, treat excerpt text as untrusted input, and say when the material does not support an answer. Responses include the answer, source metadata, detected topics, a recommended practice action, and a confidence field.

The LLM adapter in `app/ai.py` sends OpenAI-compatible `/chat/completions` requests. The current local settings point to Google's Gemini-compatible base URL and use Gemini 3.8 Flash as the primary model, with Gemini 3.5 Flash-Lite as a fallback when the primary returns HTTP 503 or times out. The primary request times out after 15 seconds; the fallback receives up to 30 seconds. The tutor call is made only when retrieval returns at least one source; without indexed matching course content the handler returns its no-source response without asking Gemini.

**Representative implementation (current line references):**

```python
# app/main.py:157–171 (retrieval, prompt, generation, response)
sources = search(db, data.message, 5, data.topic, user.id ...)
answer = get_llm().complete(system_prompt, learner_question_and_context)
return {"answer": answer, "sources": sources, ...}
```

The actual function is written compactly; see `app/main.py:157–171`. Provider selection and the HTTP call are in `app/ai.py:35–45`. Google documents this OpenAI-compatible endpoint and bearer-key format in the [Gemini OpenAI compatibility guide](https://ai.google.dev/gemini-api/docs/openai).

### Rule-based reasoning

`app/reasoning.py:15–35` classifies requests with keyword rules (`ASK_HINT`, `ASK_FORMULA`, `REVIEW_MISTAKE`, `PRACTICE`, and related intents), estimates proficiency from stored mastery values, selects an explanation level, and returns a recommended action. This is explicit orchestration logic, not a separately trained reasoning model.

### Hints and question generation

Tutor hints are progressive fixed strings in `app/main.py:172–177`; the full solution is revealed at later hint levels. Similar-question retrieval selects a stored question with the same concept. Question bank creation is educator/admin controlled. The current implementation should not be described as automatically generating a complete verified question bank unless the specific question-generation route is activated and validated; question quality still needs review.

## 7. Learner metrics and formulas

### Mastery score

After a question attempt, `app/services.py:27–33` updates accuracy, average response time, hint use, and confidence. Its current mastery calculation is:

```text
mastery = 100 × (0.40 × accuracy
               + 0.20 × speed
               + 0.20 × latest_correctness
               + 0.10 × confidence
               + 0.10 × recovery)
```

Here `speed = clamp(1 − average_time_seconds / 180, 0, 1)` and `recovery` currently equals cumulative accuracy. This is a hand-authored score, so the latest correctness and cumulative accuracy overlap by design. It is not an empirically calibrated estimate of subject mastery.

### Readiness score

`app/services.py:40–48` calculates an aggregate for a company label:

```text
readiness = 0.30 × accuracy
          + 0.20 × speed
          + 0.20 × mean mastery
          + 0.15 × mistake recovery
          + 0.15 × revision consistency
```

The implementation defines speed from average time, mistake recovery as accuracy, and revision consistency as the completion rate of stored revision plans. These percentages are transparent application metrics; they do not imply a validated probability of placement or hiring success.

## 8. API surface

All `/api` routes are served by FastAPI (`app/main.py`). Protected routes use bearer access tokens issued by registration/login. Public registration creates student accounts; privileged authoring operations use role dependencies.

| Area | Main endpoints | Purpose |
|---|---|---|
| Health | `GET /health/live`, `GET /health/ready` | Process and database readiness checks |
| Authentication | `POST /api/auth/register`, `/login`, `/refresh`; `GET /api/auth/me`; profile/password routes | Account lifecycle and JWT access |
| Resources | `POST /api/documents/upload`; `GET /api/documents`; `GET/DELETE /api/documents/{id}` | Upload, check status, list, and remove learning resources |
| Search | `POST /api/search` | Return top-K retrieved chunks, similarity, source, and topic |
| Concepts | `POST/GET /api/concepts`; relationship routes | Educator/admin-managed concept graph |
| Tutor | `POST /api/tutor/chat`, `/hint`, `/explain`, `/similar-question` | Contextual response, progressive hint, solution, and similar item |
| Practice | `GET /api/questions`; `POST /api/practice/start`, `/{session_id}/next`, `/{session_id}/answer`, `/{session_id}/summary` | Practice sessions and feedback capture |
| Revision/readiness | `/api/revision/*`, `/api/readiness*` | Schedule review work and compute learner metrics |
| Analytics | `/api/analytics/overview`, `/topics`, `/mistakes`, `/activity` | Learner activity and performance views |
| Mock tests | `/api/mock-tests`, `/quick-start`, `/{id}/start`, `/{id}/submit` | Build, take, grade, and summarize assessments |

Important route definitions: uploads and search `app/main.py:85–132`; tutor `app/main.py:156–189`; practice and revision `app/main.py:202–233`; readiness and analytics `app/main.py:234–264`; mock tests `app/main.py:266–301`.

## 9. Frontend and deployment

The React app is under `frontend/project`. `src/lib/api.ts` uses `/api` by default, stores bearer/refresh tokens in browser local storage, retries once after a 401 using the refresh token, and converts API errors into user-readable messages. Vite proxies `/api` to the local backend during development. The production frontend is built into a static image served by Nginx.

`docker-compose.yml` defines five services: `frontend`, `backend`, `worker`, `postgres`, and `redis`. Uploaded files and database/queue data use named volumes. The backend container applies Alembic migrations and seeds initial concepts/questions before launching FastAPI. The prior reported Docker error occurs before any of these project services start: Docker Desktop's Linux engine named pipe is unavailable, so Compose cannot contact its daemon.

## 10. Data sources and evaluation

The small `APT_dataset/` files and the generator under `scripts/generate_synthetic_dataset.py` support demo and ingestion workflows. The generator creates new synthetic records at a chosen size and records IndiaBIX formula-page URLs as formula references. It does not make the generated rows empirical learner data, and generated records should be labeled synthetic in any paper. The large generated CSV is intentionally excluded from GitHub because of its size.

`scripts/evaluate_tutor_benchmark.py` defines an isolated arithmetic QA benchmark with generated cases and separate retrieval-hit checks. Its own header describes the results as diagnostic, not publication-ready or expert-labelled. It can support local smoke evaluation, but **no benchmark result or whole-model accuracy is asserted by this report**. A research paper should report the benchmark split, number of cases, answer normalization, human/expert labels, repeated runs, confidence intervals, retrieval metrics, and Gemini model/version/configuration. The code's readiness/mastery percentages are not model accuracy.

## 11. Security and configuration

Configuration is read from environment variables and `.env` using `app/config.py`. The Gemini key is in the ignored local `.env` and must never be committed; `.env.example` contains only blank credential placeholders. The model is called server-side, so the browser never needs the Gemini key. Rotate keys if they have been pasted into chat or shared in logs. Production startup validates JWT/database secrets and disables interactive API docs.

## 12. Research limitations and next work

1. **Embedding quality:** replace deterministic hashing with a documented semantic embedding model, set vector dimensionality consistently, and re-index all chunks when changing models.
2. **Evaluation:** use a held-out, expert-reviewed test set; report retrieval Recall@K/Hit@K and answer correctness separately; include uncertainty intervals and failure analysis.
3. **Question generation:** add generation provenance, formula verification, duplicate detection, and educator approval before questions become practice items.
4. **Metric validity:** validate mastery/readiness weights against a longitudinal learner study before interpreting them as predictive.
5. **Retrieval behavior:** support answer generation without a matching resource only if the UI clearly distinguishes general model knowledge from course-grounded responses.
6. **Scale:** retrieval currently fetches eligible chunks and ranks them in application memory. Large corpora should use indexed vector search in PostgreSQL/pgvector and pagination/batched ingestion.

## Appendix A: concise code excerpts

**Provider adapter (`app/ai.py:35–45`):** builds an authenticated chat-completions request from `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY`.

**Similarity ranking (`app/services.py:20–26`):** embeds the query, optionally filters by owner/topic, computes cosine similarity, sorts, and returns top K chunks.

**Mastery and readiness (`app/services.py:27–48`):** updates learner state and applies the explicit score weights shown above.

**CSV chunk batching (`app/tasks.py:26–93`):** converts rows into labeled text and commits indexed chunks in batches.

**Tutor route (`app/main.py:157–171`):** retrieves context, calls Gemini through the provider interface, and returns answer plus source metadata.

**Seed/demo data:** `scripts/seed.py` creates initial concepts and sample questions; `scripts/generate_synthetic_dataset.py` writes synthetic CSV rows; `APT_dataset/` holds smaller included samples.
