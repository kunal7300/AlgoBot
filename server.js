import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve frontend files if any

// ✅ Gemini AI Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const client = new OAuth2Client(); // Google OAuth client

// ✅ Google Login route
app.post("/auth/google", async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: "1027137747819-ir5hgbe3tm2c65vn0c50nto14ga4f1qm.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();
        console.log("✅ Authenticated:", payload.email);
        res.status(200).json({ message: "Authenticated" });
    } catch (error) {
        console.error("❌ Google Auth Error", error);
        res.status(401).json({ error: "Invalid token" });
    }
});


// ✅ Chat Route
app.post("/chat", async (req, res) => {
  try {
    const userQuestion = req.body.prompt;

    if (!userQuestion || userQuestion.trim() === "") {
      return res.status(400).json({ reply: "Please enter a question." });
    }

    const instruction = `
You are AlgoBot — a DSA (Data Structures and Algorithms) expert.
You must ONLY answer questions related to DSA (arrays, linked lists, trees, graphs, algorithms, time complexity, etc.).
If the question is unrelated, respond with:
"I only answer questions related to Data Structures and Algorithms."

Format your reply in **clean HTML**, using:
- <h3> for titles
- <p> for paragraphs
- <pre><code> for code blocks
- <ul><li> for lists
    `;

    const formattedPrompt = `${instruction}\n\nUser: ${userQuestion}\nAlgoBot:`;

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(formattedPrompt);

    // ✅ Safely extract text
    const response = result?.response?.text ? await result.response.text() : "⚠️ No response received from AI.";

    console.log("✅ Gemini response:", response);
    res.json({ reply: response });
  } catch (error) {
    console.error("❌ Chat Route Error:", error);
    res.status(500).json({ reply: "⚠️ Server Error — please try again later." });
  }
});



// ✅ Catch-all for SPA (optional)
app.get("*", (req, res) => {
    res.sendFile(process.cwd() + "/public/index.html");
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

