require("dotenv").config();
const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const { SYSTEM_PROMPT } = require("./prompt");

const MAX_FIELD_LENGTH = 2000;
const MAX_MESSAGES = 20;

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/api/plan", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }
    if (messages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: "Conversation is too long for this demo." });
    }
    for (const m of messages) {
      if (typeof m.content !== "string" || m.content.length > MAX_FIELD_LENGTH) {
        return res.status(400).json({ error: "A message is missing or too long." });
      }
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
      messages,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n\n");

    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong generating the trip plan." });
  }
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`Trip Research Synthesizer demo running at http://localhost:${PORT}`);
});
