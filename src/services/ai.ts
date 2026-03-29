import { GoogleGenAI, Type } from "@google/genai";

export interface AISettings {
  primaryProvider: 'gemini' | 'mistral';
  geminiKey: string;
  mistralKey: string;
  tavilyKey: string;
  serperKey: string;
}

const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MISTRAL_KEY = process.env.MISTRAL_API_KEY;
const DEFAULT_TAVILY_KEY = process.env.TAVILY_API_KEY;
const DEFAULT_SERPER_KEY = process.env.SERPER_API_KEY;

// Helper to check if a key is provided and not a placeholder
const isValidKey = (key: string | undefined) => {
  if (!key) return false;
  const k = key.trim();
  return k !== "" && !k.includes("MY_") && !k.includes("TODO") && k !== "undefined" && k !== "null";
};

export interface Course {
  title: string;
  provider: string;
  url: string;
  description: string;
  isFree: boolean;
  rating?: string;
}

export interface RoadmapStep {
  title: string;
  description: string;
  resources: { name: string; url: string }[];
}

export interface Roadmap {
  title: string;
  overview: string;
  steps: RoadmapStep[];
}

export async function searchCourses(query: string, settings?: AISettings): Promise<Course[]> {
  try {
    const response = await fetch('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, settings })
    });
    if (response.ok) {
      return await response.json();
    } else {
      const err = await response.json();
      console.error("Search API failed:", err);
    }
  } catch (e) {
    console.error("Search API call failed:", e);
  }
  return [];
}

export async function generateRoadmap(topic: string, settings?: AISettings): Promise<Roadmap> {
  try {
    const response = await fetch('/api/ai/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, settings })
    });
    if (response.ok) {
      return await response.json();
    } else {
      const err = await response.json();
      console.error("Roadmap API failed:", err);
    }
  } catch (e) {
    console.error("Roadmap API call failed:", e);
  }
  return { title: "Error", overview: "Could not generate roadmap. Please check your API keys.", steps: [] };
}

export async function getChatResponse(message: string, history: { role: 'user' | 'ai'; text: string }[], settings?: AISettings) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, settings })
    });
    if (response.ok) {
      const data = await response.json();
      return data.text;
    } else {
      const err = await response.json();
      console.error("Chat API failed:", err);
      return `Error: ${err.error || "Unknown error"}. ${err.details || ""}`;
    }
  } catch (e) {
    console.error("Chat API call failed:", e);
  }
  return "I'm sorry, but I'm having trouble connecting to my AI services right now. Please ensure your API keys are configured correctly.";
}
