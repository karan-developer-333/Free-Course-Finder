import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const SERPER_API_KEY = process.env.SERPER_API_KEY;

// Helper to check if a key is provided and not a placeholder
const isValidKey = (key: string | undefined) => {
  return key && key.trim() !== "" && !key.includes("MY_") && !key.includes("TODO");
};

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance && isValidKey(GEMINI_API_KEY)) {
    aiInstance = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });
  }
  return { gemini: aiInstance };
}

async function performWebSearch(query: string) {
  let results = "";
  
  if (isValidKey(TAVILY_API_KEY)) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: query,
          search_depth: "basic",
          max_results: 5
        })
      });
      if (response.ok) {
        const data = await response.json();
        results = data.results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join('\n\n');
      }
    } catch (e) {
      console.error("Tavily search failed, trying fallback...", e);
    }
  }
  
  // If Tavily failed or was skipped, try Serper
  if (!results && isValidKey(SERPER_API_KEY)) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query })
      });
      if (response.ok) {
        const data = await response.json();
        results = data.organic?.map((r: any) => `Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`).join('\n\n') || "";
      }
    } catch (e) {
      console.error("Serper search failed:", e);
    }
  }
  
  return results;
}

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

export async function searchCourses(query: string): Promise<Course[]> {
  const { gemini } = getAI();
  
  // 1. Try Gemini with Google Search Grounding first
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find the best 5 FREE online courses for "${query}". Use Google Search to find real, current courses from providers like Coursera, edX, MIT, YouTube, etc.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                provider: { type: Type.STRING },
                url: { type: Type.STRING },
                description: { type: Type.STRING },
                isFree: { type: Type.BOOLEAN },
                rating: { type: Type.STRING }
              },
              required: ["title", "provider", "url", "description", "isFree"]
            }
          }
        }
      });
      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (e) {
      console.warn("Gemini search failed or key missing, switching to Mistral + Tavily/Serper fallback.", e);
    }
  }

  // 2. Fallback: Use Tavily/Serper for search + Mistral for processing
  const searchResults = await performWebSearch(`free online courses for ${query}`);
  const prompt = `Based on these search results, find the best 5 FREE online courses for "${query}".
  Return ONLY a JSON array of objects with these fields: title, provider, url, description, isFree (boolean), rating (optional string).
  
  Search Results:
  ${searchResults || "No search results found. Use your internal knowledge to suggest the best free courses."}`;

  if (isValidKey(MISTRAL_API_KEY)) {
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [{ role: "user", content: prompt + "\n\nReturn ONLY the JSON array." }]
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (typeof text === 'string') {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      }
    } catch (e) {
      console.error("Mistral fallback search failed:", e);
    }
  }

  return [];
}

export async function generateRoadmap(topic: string): Promise<Roadmap> {
  const { gemini } = getAI();
  
  // 1. Try Gemini with Google Search Grounding first
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Generate a structured learning roadmap for "${topic}". Use Google Search to find the best free resources and learning paths.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              overview: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    resources: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          url: { type: Type.STRING }
                        },
                        required: ["name", "url"]
                      }
                    }
                  },
                  required: ["title", "description", "resources"]
                }
              }
            },
            required: ["title", "overview", "steps"]
          }
        }
      });
      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (e) {
      console.warn("Gemini roadmap failed or key missing, switching to Mistral + Tavily/Serper fallback.", e);
    }
  }

  // 2. Fallback: Use Tavily/Serper for search + Mistral for processing
  const searchResults = await performWebSearch(`learning path and resources for ${topic}`);
  const prompt = `Generate a structured learning roadmap for "${topic}".
  Return ONLY a JSON object with these fields: title, overview, steps (array of objects with title, description, resources (array of {name, url})).
  
  Context:
  ${searchResults || "No search results found. Use your internal knowledge to generate a high-quality roadmap."}`;

  if (isValidKey(MISTRAL_API_KEY)) {
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [{ role: "user", content: prompt + "\n\nReturn ONLY the JSON object." }]
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (typeof text === 'string') {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }
    } catch (e) {
      console.error("Mistral fallback roadmap failed:", e);
    }
  }

  return { title: "Error", overview: "Could not generate roadmap. Please check your API keys.", steps: [] };
}

export async function getChatResponse(message: string, history: { role: 'user' | 'ai'; text: string }[]) {
  const { gemini } = getAI();
  
  // 1. Try Gemini first
  if (gemini) {
    try {
      const chat = gemini.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a helpful learning assistant. Help the user find educational resources and explain complex topics simply."
        },
        history: history.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))
      });
      const response = await chat.sendMessage({ message });
      if (response.text) {
        return response.text;
      }
    } catch (e) {
      console.warn("Gemini chat failed or key missing, switching to Mistral fallback.", e);
    }
  }

  // 2. Fallback: Use Mistral
  if (isValidKey(MISTRAL_API_KEY)) {
    try {
      // Optional: Add search results to chat if it's a resource request
      let context = "";
      if (message.toLowerCase().includes("find") || message.toLowerCase().includes("course") || message.toLowerCase().includes("learn")) {
        context = await performWebSearch(message);
      }

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            { role: "system", content: `You are a helpful learning assistant. ${context ? `Use this web search context to help the user: ${context}` : ""}` },
            ...history.map(m => ({ 
              role: m.role === 'user' ? 'user' : 'assistant', 
              content: m.text 
            })),
            { role: "user", content: message }
          ]
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
    } catch (e) {
      console.error("Mistral fallback chat failed:", e);
    }
  }

  return "I'm sorry, but I'm having trouble connecting to my AI services right now. Please ensure your API keys are configured correctly.";
}
