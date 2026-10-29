const chatService = require('../services/chatService');

async function ask(req, res) {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ status: 'error', message: 'question is required' });
  }

  const embedding = await chatService.embedText(question);
  const chunks = await chatService.findRelevantChunks(embedding);

  // No relevant chunks — skip the Gemini call entirely rather than send it
  // an empty context (saves a request, and the answer would be the same).
  if (chunks.length === 0) {
    return res.json({
      status: 'ok',
      answer: "I don't have information about that in Nikan's projects or notes.",
    });
  }

  const context = chunks.map((c) => c.chunk_text).join('\n\n');

  // Isolated from the rest of ask(): a Gemini failure (seen in testing —
  // 503 "high demand", and a hang before the fetch timeout was added)
  // should surface as a normal, friendly JSON answer the widget can just
  // display, not Express's default 500 HTML error page.
  try {
    const answer = await chatService.generateAnswer(question, context);
    res.json({ status: 'ok', answer });
  } catch (err) {
    console.error('generateAnswer failed:', err.message);
    res.json({
      status: 'ok',
      answer: "I'm having trouble reaching my AI backend right now — try asking again in a moment.",
    });
  }
}

module.exports = { ask };
