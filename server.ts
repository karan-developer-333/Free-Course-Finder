import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Default keys from user provided setup code
const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MISTRAL_KEY = process.env.MISTRAL_API_KEY;
const DEFAULT_TAVILY_KEY = process.env.TAVILY_API_KEY || "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";
const DEFAULT_SERPER_KEY = process.env.SERPER_API_KEY || "60738fce452a865368332321d9507edde21c5b1a";

const isValidKey = (key: string | undefined) => {
  if (!key) return false;
  const k = key.trim();
  return k !== "" && !k.includes("MY_") && !k.includes("TODO") && k !== "undefined" && k !== "null";
};

async function performWebSearch(query: string, keys: any) {
  let results = "";
  const tavilyKey = isValidKey(keys.tavilyKey) ? keys.tavilyKey : DEFAULT_TAVILY_KEY;
  const serperKey = isValidKey(keys.serperKey) ? keys.serperKey : DEFAULT_SERPER_KEY;
  
  console.log(`Performing web search for: "${query}"`);
  
  if (isValidKey(tavilyKey)) {
    try {
      console.log("Attempting Tavily search...");
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: query,
          search_depth: "advanced",
          max_results: 5
        })
      });
      if (response.ok) {
        const data = await response.json();
        results = data.results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join('\n\n');
        console.log("Tavily search successful.");
      } else {
        const err = await response.text();
        console.error(`Tavily search failed (${response.status}):`, err);
      }
    } catch (e) {
      console.error("Tavily search exception:", e);
    }
  }
  
  if (!results && isValidKey(serperKey)) {
    try {
      console.log("Attempting Serper search...");
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query })
      });
      if (response.ok) {
        const data = await response.json();
        results = data.organic?.map((r: any) => `Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`).join('\n\n') || "";
        console.log("Serper search successful.");
      } else {
        const err = await response.text();
        console.error(`Serper search failed (${response.status}):`, err);
      }
    } catch (e) {
      console.error("Serper search exception:", e);
    }
  }
  
  return results;
}

app.post("/api/ai/search", async (req, res) => {
  const { query, settings } = req.body;
  const geminiKey = isValidKey(settings?.geminiKey) ? settings.geminiKey : DEFAULT_GEMINI_KEY;
  const mistralKey = isValidKey(settings?.mistralKey) ? settings.mistralKey : DEFAULT_MISTRAL_KEY;

  let geminiError = null;

  if (settings?.primaryProvider !== 'mistral' && isValidKey(geminiKey)) {
    try {
      console.log("Attempting Gemini search...");
      const ai = new GoogleGenAI({ apiKey: geminiKey! });
      const response = await ai.models.generateContent({
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
        console.log("Gemini search successful.");
        return res.json(JSON.parse(response.text));
      }
    } catch (e: any) {
      console.warn("Gemini search failed, attempting fallback:", e.message || e);
      geminiError = e.message || String(e);
    }
  }

  console.log("Falling back to Mistral + Web Search...");
  const searchResults = await performWebSearch(`free online courses for ${query}`, settings || {});
  const prompt = `Based on these search results, find the best 5 FREE online courses for "${query}".
  Return ONLY a JSON array of objects with these fields: title, provider, url, description, isFree (boolean), rating (optional string).
  
  Search Results:
  ${searchResults || "No search results found. Use your internal knowledge to suggest the best free courses."}`;

  if (isValidKey(mistralKey)) {
    try {
      console.log("Attempting Mistral search...");
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "mistral-medium-latest",
          messages: [{ role: "user", content: prompt + "\n\nReturn ONLY the JSON array." }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (typeof text === 'string') {
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          console.log("Mistral search successful.");
          return res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : []);
        }
      } else {
        const err = await response.text();
        console.error(`Mistral search failed (${response.status}):`, err);
      }
    } catch (e) {
      console.error("Mistral search exception:", e);
    }
  }

  console.error("All search providers failed.");
  res.status(500).json({ error: "All search providers failed.", details: geminiError });
});

app.post("/api/ai/roadmap", async (req, res) => {
  const { topic, settings } = req.body;
  const geminiKey = isValidKey(settings?.geminiKey) ? settings.geminiKey : DEFAULT_GEMINI_KEY;
  const mistralKey = isValidKey(settings?.mistralKey) ? settings.mistralKey : DEFAULT_MISTRAL_KEY;

  let geminiError = null;

  if (settings?.primaryProvider !== 'mistral' && isValidKey(geminiKey)) {
    try {
      console.log("Attempting Gemini roadmap...");
      const ai = new GoogleGenAI({ apiKey: geminiKey! });
      const response = await ai.models.generateContent({
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
        console.log("Gemini roadmap successful.");
        return res.json(JSON.parse(response.text));
      }
    } catch (e: any) {
      console.warn("Gemini roadmap failed, attempting fallback:", e.message || e);
      geminiError = e.message || String(e);
    }
  }

  console.log("Falling back to Mistral + Web Search for roadmap...");
  const searchResults = await performWebSearch(`learning path and resources for ${topic}`, settings || {});
  const prompt = `Generate a structured learning roadmap for "${topic}".
  Return ONLY a JSON object with these fields: title, overview, steps (array of objects with title, description, resources (array of {name, url})).
  
  Context:
  ${searchResults || "No search results found. Use your internal knowledge to generate a high-quality roadmap."}`;

  if (isValidKey(mistralKey)) {
    try {
      console.log("Attempting Mistral roadmap...");
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "mistral-medium-latest",
          messages: [{ role: "user", content: prompt + "\n\nReturn ONLY the JSON object." }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (typeof text === 'string') {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          console.log("Mistral roadmap successful.");
          return res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : null);
        }
      } else {
        const err = await response.text();
        console.error(`Mistral roadmap failed (${response.status}):`, err);
      }
    } catch (e) {
      console.error("Mistral roadmap exception:", e);
    }
  }

  console.error("All roadmap providers failed.");
  res.status(500).json({ error: "All roadmap providers failed.", details: geminiError });
});

app.post("/api/ai/chat", async (req, res) => {
  const { message, history, settings } = req.body;
  const geminiKey = isValidKey(settings?.geminiKey) ? settings.geminiKey : DEFAULT_GEMINI_KEY;
  const mistralKey = isValidKey(settings?.mistralKey) ? settings.mistralKey : DEFAULT_MISTRAL_KEY;

  let geminiError = null;

  if (settings?.primaryProvider !== 'mistral' && isValidKey(geminiKey)) {
    try {
      console.log("Attempting Gemini chat...");
      const ai = new GoogleGenAI({ apiKey: geminiKey! });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a helpful learning assistant. Help the user find educational resources and explain complex topics simply."
        },
        history: history.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))
      });
      const response = await chat.sendMessage({ message });
      if (response.text) {
        console.log("Gemini chat successful.");
        return res.json({ text: response.text });
      }
    } catch (e: any) {
      console.warn("Gemini chat failed, attempting fallback:", e.message || e);
      geminiError = e.message || String(e);
    }
  }

  if (isValidKey(mistralKey)) {
    try {
      console.log("Attempting Mistral chat...");
      let context = "";
      if (message.toLowerCase().includes("find") || message.toLowerCase().includes("course") || message.toLowerCase().includes("learn")) {
        context = await performWebSearch(message, settings || {});
      }

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "mistral-medium-latest",
          messages: [
            { role: "system", content: `You are a helpful learning assistant. ${context ? `Use this web search context to help the user: ${context}` : ""}` },
            ...history.map((m: any) => ({ 
              role: m.role === 'user' ? 'user' : 'assistant', 
              content: m.text 
            })),
            { role: "user", content: message }
          ]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Mistral chat successful.");
        return res.json({ text: data.choices?.[0]?.message?.content || "Sorry, I couldn't process that." });
      } else {
        const err = await response.text();
        console.error(`Mistral chat failed (${response.status}):`, err);
        return res.json({ text: `Mistral API error (${response.status}): ${err}` });
      }
    } catch (e: any) {
      console.error("Mistral chat exception:", e);
      return res.json({ text: `Mistral fallback failed: ${e.message || String(e)}` });
    }
  }

  const errorMsg = geminiError 
    ? `Gemini failed (${geminiError}) and no Mistral key was provided.`
    : "No valid API keys provided. Please check your settings.";
    
  res.json({ text: errorMsg });
});

async function startServer() {
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
