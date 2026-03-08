const { Client } = require("pg");
const { config } = require("dotenv");
config(); // ✅ load environment variables before using them

const openai = require("../../utils/openai"); // ✅ reuse shared OpenAI client




const createNote = async (req, res) => {
  try {
    const { title, content, is_pinned = false, color = "white" } = req.body;
    const { userId: user_id } = req.user;

    console.log("Creating note for user:", user_id);

    // 🔍 1. Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${title} ${content}`,
    });

    const embedding = embeddingResponse.data[0].embedding;
    console.log("Embedding generated, length:", embedding.length);

    // 🔄 2. Connect to DB
    const client = new Client({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });

    await client.connect();

    // 💾 3. Insert into DB
    await client.query(
  `INSERT INTO note (title, content, user_id, is_pinned, color, embedding)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [title, content, user_id, is_pinned, color, `[${embedding.join(",")}]`]
);
    await client.end();
    return res.status(201).json({ message: "Note created successfully" });
  } catch (err) {
    console.error("🔥 Error in createNote:", err);
    return res.status(500).json({ message: "Failed to create note" });
  }
};

const getNotes = async (req, res) => {
  try {
    const { userId: user_id } = req.user;

    const client = new Client({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });

    await client.connect();

    const result = await client.query(
      `SELECT * FROM note WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [user_id]
    );

    await client.end();
    return res.status(200).json({ notes: result.rows });
  } catch (err) {
    console.error("Error in getNotes:", err);
    return res.status(500).json({ message: "Failed to fetch notes" });
  }
};

const updateNote = async (req, res) => {
  try {
    const { note_id } = req.params;
    const { title, content, is_pinned, color } = req.body;
    const { userId: user_id } = req.user;

    const client = new Client({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });

    await client.connect();

    // Verify ownership
    const check = await client.query(
      `SELECT * FROM note WHERE note_id = $1 AND user_id = $2`,
      [note_id, user_id]
    );

    if (check.rows.length === 0) {
      await client.end();
      return res.status(404).json({ message: "Note not found or access denied" });
    }

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${title} ${content}`,
    });

    const embedding = embeddingResponse.data[0].embedding;

    await client.query(
  `UPDATE note 
   SET title = $1, content = $2, is_pinned = $3, color = $4, updated_at = CURRENT_TIMESTAMP, embedding = $5
   WHERE note_id = $6 AND user_id = $7`,
  [title, content, is_pinned, color, `[${embedding.join(",")}]`, note_id, user_id]
);

    await client.end();
    return res.status(200).json({ message: "Note updated successfully" });
  } catch (err) {
    console.error("Error in updateNote:", err);
    return res.status(500).json({ message: "Failed to update note" });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { note_id } = req.params;
    const { userId: user_id } = req.user;

    const client = new Client({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });

    await client.connect();

    const check = await client.query(
      `SELECT * FROM note WHERE note_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [note_id, user_id]
    );

    if (check.rows.length === 0) {
      await client.end();
      return res.status(404).json({ message: "Note not found or already deleted" });
    }

    await client.query(
      `UPDATE note SET deleted_at = CURRENT_TIMESTAMP WHERE note_id = $1 AND user_id = $2`,
      [note_id, user_id]
    );

    await client.end();
    return res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Error in deleteNote:", err);
    return res.status(500).json({ message: "Failed to delete note" });
  }
};

module.exports = { createNote, getNotes, updateNote, deleteNote };
