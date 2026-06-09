import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Apply secure HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Ensure local assets, web sockets, styling are unaffected in preview
      frameguard: false,            // Allow rendering inside AI Studio's sandbox presentation iframe
    })
  );

  // Apply rate limiter to /api/ routes to prevent automatic abuse or resource exhaustion
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 45,             // Limit each IP to 45 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please throttle your sprint request volume." },
  });
  app.use("/api/", apiLimiter);

  app.use(express.json());

  // API Route for Step Decomposition
  app.post("/api/gemini/decompose", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY secret on backend" });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Break down the following daunting task or goal into 4 to 6 manageable, physical micro-steps for an ADHD user.
Every step should be hyper-discrete, simple, and under 20 mins to prevent task freeze.
Target Task: "${query}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an ADHD Task Coach. You convert daunting, vague goals into a series of 4-6 hyper-specific physical movements or tiny sub-tasks with an estimated duration in minutes (usually 2-15 minutes) and a single matches emoji. Output must strictly conform to the structural array schema requested.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: " chronological array of micro-steps to fulfill the action.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "Action title (e.g., 'Lay out clean gym clothes'). Max 5 words."
                },
                duration_minutes: {
                  type: Type.INTEGER,
                  description: "Estimated minutes to complete."
                },
                emoji: {
                  type: Type.STRING,
                  description: "A single representative emoji (e.g., '👕')."
                }
              },
              required: ["title", "duration_minutes", "emoji"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text received from Gemini API");
      }

      const parsedSteps = JSON.parse(text.trim());
      res.json({ steps: parsedSteps });
    } catch (error: any) {
      console.error("Gemini decomposition failure:", error);
      res.status(500).json({ error: error.message || "Failed to decompose task" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
