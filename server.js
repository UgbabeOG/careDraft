import "dotenv/config";
import cors from "cors";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = Number(process.env.PORT || 8787);
const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() }) : null;

app.use(cors());
app.use(express.json({ limit: "16kb" }));

app.get("/", (_req, res) => {
  res.json({ service: "caredraft", status: "ok", health: "/health" });
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "caredraft" }));

app.post("/api/draft-response", async (req, res) => {
  const emailText = typeof req.body?.emailText === "string" ? req.body.emailText.trim() : "";
  if (!emailText) {
    return res.status(400).json({ success: false, error: "Email text is required" });
  }
  if (emailText.length > 12000) {
    return res.status(413).json({ success: false, error: "Email text must be 12,000 characters or fewer" });
  }
  if (!ai) {
    return res.status(503).json({ success: false, error: "CareDraft is not configured with an AI key." });
  }

  try {
    const result = await ai.models.generateContent({
      model,
      contents: emailText,
      config: {
        systemInstruction: `You are a senior customer support specialist for a trusted online pharmacy.
Write a ready-to-send email reply to the customer's message.
Tone: warm, empathetic, calm, considerate, and professional.
Keep it concise (150 words maximum), use plain language, and acknowledge the customer's concern before helping.
Never diagnose, prescribe, change a medication, or promise a clinical outcome. If the customer asks a medical question, recommend speaking with their pharmacist or clinician.
Do not invent order details, prices, delivery dates, refunds, or policies. Use a clear placeholder such as [order number] when information is missing.
Do not mention that AI helped write the reply. End with a helpful sign-off from the pharmacy support team.`,
        temperature: 0.65,
        maxOutputTokens: 350
      }
    });
    const draft = result.text?.trim();
    if (!draft) {
      return res.status(502).json({ success: false, error: "The AI service returned an empty response." });
    }
    return res.json({ success: true, draft, source: "gemini" });
  } catch (error) {
    console.error("[CAREDRAFT_ERROR]", error);
    return res.status(502).json({ success: false, error: "Unable to create a draft right now." });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`CareDraft API running on port ${port}`);
});
