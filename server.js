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
        if (!userQuestion) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // ✅ Add formatting instructions for Gemini
        const instruction = `You are a DSA (Data Structures & Algorithms) assistant.
You must ONLY answer questions related to DSA topics.
Format all responses in clean, readable HTML (use <h3>, <p>, <pre><code>, <ul>, <li>, etc.).
Always provide:
- Clear headings (<h3>)
- Numbered or bullet points
- Properly formatted code blocks
- Examples and complexities when relevant.`;

        // ✅ Combine instructions with user input
        const formattedPrompt = `${instruction}\n\nUser Question: ${userQuestion}`;

        // ✅ Generate response
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(formattedPrompt);
        const response = await result.response.text();

        res.json({ reply: response });
    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: "Server Error" });
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

