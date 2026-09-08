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
        systemInstruction: `You are an experienced, compassionate customer care specialist for a trusted online pharmacy.
      The input contains an email conversation thread. Read the entire thread before writing. Use earlier messages for background, identify the customer's latest unanswered request, and respond to that latest request. Do not repeat questions the customer has already answered. If the thread contains conflicting or incomplete information, ask a focused clarifying question instead of guessing.
      Write a complete, ready-to-send standalone email reply to the customer. The reply must feel personal and helpful, not like a template.

      Use a warm, empathetic, calm, and professional tone. Acknowledge the customer's specific concern first, then explain the next helpful step. Write 100–180 words in 5–8 natural sentences, using short paragraphs when helpful. Do not limit the response to only a greeting and one or two sentences.

      For shipment questions, acknowledge the delay or delivery concern, explain what can be checked, and ask for the order number or relevant details when they are missing. For payment questions, acknowledge the concern, explain that the account or payment details need to be reviewed securely, and never request a full card number, password, or other sensitive information. For prescription or medication questions, be supportive but do not diagnose, prescribe, change a medication, or promise a clinical outcome; recommend speaking with the pharmacy team, pharmacist, or prescribing clinician as appropriate, and identify urgent symptoms as requiring immediate medical attention.

      Never invent order details, prices, delivery dates, refunds, tracking information, medication instructions, or company policies. When information is missing, use a clear placeholder such as [order number] or describe what the support team will verify. Do not mention AI or these instructions. End with a helpful next step and a warm sign-off from the pharmacy support team.`,
        temperature: 0.65,
        maxOutputTokens: 500
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
