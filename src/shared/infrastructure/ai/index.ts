import { GoogleGenAI } from "@google/genai";

let _gemini: GoogleGenAI | undefined;

function getGemini() {
  if (_gemini) return _gemini;

  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is undefined");

  _gemini = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  return _gemini;
}

export { getGemini };
