const pool = require('../db/pool');

// Loaded once, reused for every request — building the pipeline is slow
// and only needs to happen the first time this module is used.
let embedderPromise = null;

function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = import('@xenova/transformers').then(({ pipeline }) =>
      pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    );
  }
  return embedderPromise;
}

async function embedText(text) {
  const extractor = await getEmbedder();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Cosine distance (`<=>`) ranges 0 (identical) to 2 (opposite), since
// embeddings were normalized at indexing time (see scripts/index-content.js).
// Tuned from a real measured case, not guessed: "How fragments work?" (a
// genuinely vague question) scored 0.660 against the correct fragments
// chunk, with the next-closest (actually unrelated) chunk at 0.814 — a
// clear gap. 0.75 sits in that gap: loose enough to keep the real match,
// still well under the unrelated cluster. The WHERE filter matters as much
// as the LIMIT: without it, a question with no good match still gets 5
// irrelevant chunks forced into the context, just because LIMIT always
// returns that many rows if they exist.
const MAX_DISTANCE = 0.75;

async function findRelevantChunks(embedding, limit = 5, maxDistance = MAX_DISTANCE) {
  const result = await pool.query(
    `SELECT chunk_text, project_id, note_id
     FROM document_chunks
     WHERE embedding <=> $1::vector < $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [JSON.stringify(embedding), maxDistance, limit]
  );
  return result.rows;
}

// Moved off Gemini: the free tier's gemini-3.8-flash daily quota turned
// out to be 20 requests/day — fine for a one-off test, useless for a
// chatbot a real visitor could hit. Groq's free tier is generously sized
// for exactly this kind of small personal-site usage instead.
const GROQ_MODEL = 'openai/gpt-oss-120b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Strict on purpose: the earlier LangChain RAG practice hit a real
// hallucination from a soft prompt — telling the model to say so when the
// context doesn't cover the question is what prevents that here too.
const SYSTEM_PROMPT = `You are the friendly AI assistant on Nikan Eidi's portfolio site (nik-blog), talking to a visitor. Answer naturally and conversationally, like you genuinely know Nikan's work — don't mention "the context" or "the provided information", just answer directly. Base your answer ONLY on the information you're given about his projects and notes; if it doesn't cover the question, say in a natural, friendly way that you don't have that info yet, and suggest checking the relevant project or note directly — never guess or make something up.`;

async function callGroq(question, context) {
  // Without this timeout, a slow/degraded response leaves the request
  // hanging indefinitely instead of failing fast enough to retry.
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Information about Nikan's projects and notes:\n${context}\n\nVisitor's question: ${question}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const error = new Error(`Groq failed: ${response.status} ${await response.text()}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateAnswer(question, context) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGroq(question, context);
    } catch (err) {
      console.error(`Groq attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message);
      lastError = err;
      // A 429 (quota) or 400 (bad request) won't fix itself on retry —
      // only retry on things that plausibly will (503, timeout, network).
      if (err.status === 429 || err.status === 400) break;
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

module.exports = { embedText, findRelevantChunks, generateAnswer };
