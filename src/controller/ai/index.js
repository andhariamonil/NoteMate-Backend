const { OpenAI } = require("openai");
const { Pool } = require("pg");
const { config } = require("dotenv");
config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const aiController = async (req, res) => {
  try {
    const { question } = req.body;
    const { userId } = req.user;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    console.log("🧠 Question:", question);

    // 🔍 Step 1: Embed the question
    const embedQ = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const qVec = embedQ.data[0].embedding;
    const qVecFormatted = `[${qVec.join(",")}]`;

    // 🔍 Step 2: Find relevant notes
    const result = await pool.query(
      `SELECT title, content FROM note WHERE user_id = $1 AND deleted_at IS NULL ORDER BY embedding <-> $2 LIMIT 5`,
      [userId, qVecFormatted]
    );

    const context = result.rows
      .map((r) => `Title: ${r.title}\n${r.content}`)
      .join("\n---\n");

    if (!context.trim()) {
      // Save user question + bot response to history
      await pool.query(
        `INSERT INTO history (user_id, sender, message) VALUES 
         ($1, 'user', $2), 
         ($1, 'bot', $3)`,
        [userId, question, "Sorry, I couldn’t find any relevant notes."]
      );
      return res.status(200).json({ answer: "Sorry, I couldn’t find any relevant notes." });
    }

    // 💬 Step 3: Ask GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You're NoteMate AI. Answer the user's question using only the context provided. If you can't find relevant information, say so.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer = completion.choices[0].message.content;

    // 💾 Save to history
    await pool.query(
      `INSERT INTO history (user_id, sender, message) VALUES 
       ($1, 'user', $2),
       ($1, 'bot', $3)`,
      [userId, question, answer]
    );

    return res.status(200).json({ answer });
  } catch (err) {
    console.error("🔥 AI Error:", err);
    return res.status(500).json({ message: "AI service failed", error: err.toString() });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await pool.query(
      `SELECT sender, message FROM history WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );

    return res.status(200).json({ messages: result.rows });
  } catch (err) {
    console.error("🔥 History Fetch Error:", err);
    return res.status(500).json({ message: "Failed to fetch chat history" });
  }
};

module.exports = { aiController, getChatHistory };
