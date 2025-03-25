const express = require("express");
const run = require("../chatAI/chat_api");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("ChatBot up and running :)");
});

router.post("/bot1", async (req, res) => {
  let prompt = req.body.prompt || ""; // fallback if undefined
  try {
    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    const data = await run(prompt);

    return res.status(200).json({
      user: prompt,
      response: data,
    });
  } catch (err) {
    console.error(`Error in chatbot: ${err.message}`);

    return res.status(500).json({
      user: prompt,
      response: "Something went wrong 😢",
      error: err.message,
    });
  }
});

module.exports = router;
