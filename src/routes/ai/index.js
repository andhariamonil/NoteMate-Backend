const { Router } = require("express");
const { aiController, getChatHistory } = require("../../controller/ai/index");
const { authMiddleware } = require("../../middleware/authMiddleware");

const aiRoute = Router();
aiRoute.post("/ai/answer", authMiddleware, aiController);
aiRoute.get("/ai/history", authMiddleware, getChatHistory); // 👈 New route

module.exports = { aiRoute };
