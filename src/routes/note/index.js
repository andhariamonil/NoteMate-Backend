const { Router } = require("express");
const { createNote, getNotes, updateNote, deleteNote } = require("../../controller/note/index");
const { authMiddleware } = require("../../middleware/authMiddleware");

const noteRoute = Router();

noteRoute.post("/note/create", authMiddleware, createNote);
noteRoute.get("/note/all", authMiddleware, getNotes);

// ✅ Add this line for updating a note
noteRoute.put("/note/update/:note_id", authMiddleware, updateNote);
noteRoute.delete("/note/delete/:note_id", authMiddleware, deleteNote);
// ✅ Add this line for deleting a note
module.exports = { noteRoute };
