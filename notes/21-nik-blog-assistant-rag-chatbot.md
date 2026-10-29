# 21: Nik-Blog Assistant — a real RAG chatbot over projects and notes

## What this does

A floating chat widget (bottom-right on every public page) that answers visitor questions using only my real, published projects and notes — not a generic LLM guessing about me. Retrieval-augmented generation (RAG): embed the question, find the closest real content, hand that content to an LLM as the only source it's allowed to answer from.

```
backend/db/schema.sql              — document_chunks table (pgvector)
backend/scripts/index-content.js   — bulk (re)index everything published
backend/services/indexService.js   — chunk/embed/store logic, shared by the script and the live hooks below
backend/services/chatService.js    — embedding, retrieval, Groq generation
backend/controllers/chatController.js
backend/routes/chat.js             — POST /chat
frontend/components/ChatWidget.tsx — launcher + panel, markdown-rendered answers
```

## The schema — two FK columns, not a generic `source_type`/`source_id`

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    note_id INTEGER REFERENCES notes(id),
    chunk_text TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT document_chunks_exactly_one_source CHECK (
        (project_id IS NOT NULL)::INTEGER + (note_id IS NOT NULL)::INTEGER = 1
    )
);
```

A chunk comes from exactly one project *or* one note, never both, never neither — `project_id`/`note_id` are real foreign keys (so Postgres itself guarantees a chunk can't outlive the row it came from — see the delete-order bug below), and the `CHECK` constraint makes "exactly one" a schema-level guarantee, not an assumption the application code has to maintain by hand. The `384` in `vector(384)` has to match the embedding model's output size exactly — it's not an arbitrary choice.

## Chunking — and the threshold bug that proved `LIMIT` alone isn't enough

Long text (a note's content) is split into 800-character chunks with 100 characters of overlap, so a sentence doesn't get cut in half between two chunks. Each chunk is embedded separately and stored.

The real bug: `ORDER BY embedding <=> $1::vector LIMIT 5` always returns 5 rows if 5 exist — even when *none* of them are actually relevant. Caught this for real: asked "What stack is nik-blog using?" (nik-blog doesn't list itself in its own `projects` table — no row to find) and got back five Kubernetes notes, picked only because they were the "least far" of whatever existed. Fixed by adding a distance threshold:

```sql
SELECT chunk_text, project_id, note_id
FROM document_chunks
WHERE embedding <=> $1::vector < $2
ORDER BY embedding <=> $1::vector
LIMIT $3
```

With the threshold, that same question now correctly returns zero chunks, and the chat endpoint skips the LLM call entirely rather than forcing an answer out of unrelated context — the exact kind of hallucination this is supposed to prevent (see below).

## Generation — started on Gemini, moved to Groq after hitting a real wall

`gemini-3.8-flash` worked and gave a genuinely good, natural answer the first time — but its free tier capped at **20 requests/day**, discovered by exhausting it during testing (retries, browser tests, curl checks all count). Tried falling back to other Gemini models first; `gemini-3.1-pro-preview` turned out to have a **hard 0 request/day quota on the free tier** (not a lower one — a real wall, confirmed in the error body), so "switch models within the same provider" wasn't a real fallback at all.

Moved to **Groq** instead (OpenAI-compatible `chat/completions` API, model `openai/gpt-oss-120b`) — free tier actually sized for a feature a real visitor could use, ~1s responses. Guessed a couple of model names first (`llama-3.3-70b-versatile`, `gemini-3.1-pro-preview`) and got 404s — the fix was querying each provider's real `/models` endpoint instead of guessing further:

```js
fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: 'Bearer ' + key } })
```

The system prompt is deliberately strict, for the same reason `langchain-practice`'s RAG part needed one after a real hallucination there: answer *only* from the given context, say so plainly if it's not covered — never guess.

```js
async function generateAnswer(question, context) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGroq(question, context);
    } catch (err) {
      lastError = err;
      if (err.status === 429 || err.status === 400) break; // won't fix itself on retry
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastError;
}
```

A 429 (quota) or 400 (bad request) breaks the retry loop immediately — retrying those just burns more quota for the same guaranteed failure. A 503 or network timeout retries, since Groq's own error language for those is explicitly "usually temporary."

## A real pre-existing bug, found while wiring CORS for a new frontend port

`index.js` configured `cors()` using `process.env.FRONTEND_URL` *before* `dotenv.config()` had ever run — it was only called inside `db/pool.js`, which loads several lines later when a route file requires it. Locally this was invisible for months because the frontend always happened to run on the same port as the hardcoded fallback (`localhost:3000`); it only broke when a port conflict pushed the frontend to `3002` and the env var genuinely needed to be read.

```js
// before — reads process.env.FRONTEND_URL before .env has ever been loaded
const cors = require('cors');
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
...
app.use('/health', require('./routes/health')); // db/pool.js's dotenv.config() only runs here

// after
require('dotenv').config(); // first line in the file, before anything reads process.env
```

## Auto-reindexing — keeping the chatbot's knowledge in sync without a manual step

The bulk script is fine for a one-time build, but a chatbot that only knows about content as of whenever someone remembered to re-run a script isn't actually useful day to day. `indexService.js` extracts the chunk/embed/store logic into two functions —

```js
async function syncProjectIndex(project) {
  await reindexSource('project', project.id, project.status === 'published' ? projectText(project) : null);
}
```

— that both the bulk script *and* the controllers call. Passing `null` as the text clears a source's existing chunks without replacing them, which is what makes "unpublish" and "delete" work correctly: a draft or deleted post can never show up in a chatbot answer, because its chunks are removed the moment it stops being published, not whenever the next manual re-index happens to run. Hooked into `create`/`update`/`remove` on both `projectsController.js` and `notesController.js`, and into the publish/draft toggle in `adminController.js` — the toggle matters most in practice, since it's the actual moment a note usually goes from invisible to searchable (notes default to `draft` on create).

## Verified live

- Local: asking about LedgerLite's idempotency returned the correct, specific chunk and a natural (not robotic) generated answer; an unrelated question returned zero chunks and skipped the LLM call entirely (`TIME:0.008s`, confirmed no API call was made).
- Production (Neon): `pgvector` enabled and `document_chunks` created via a direct (non-pooler) connection, same method used for the original Neon migration (note 19); indexed every real published project and note — dozens of notes, each several chunks — confirmed via the script's own per-row log output, not just "it exited 0."
- Click-outside-to-close verified in the browser: opening the panel then clicking anywhere else on the page closes it; clicking the launcher button itself still just toggles, doesn't double-fire.

## One-line interview answer

> "It's retrieval-augmented generation end to end: embed the question locally with transformers.js, search pgvector with a cosine-distance threshold — not just a LIMIT, since LIMIT alone still forces back irrelevant rows when nothing actually matches, which I caught by testing a genuinely out-of-scope question — then hand only the matched content to an LLM with a strict 'answer only from this, say so if you can't' prompt. The index stays live automatically: publishing, editing, or unpublishing a project or note re-syncs its chunks through the same code path the bulk script uses, so there's never a moment where the chatbot is citing a draft or a deleted post."
