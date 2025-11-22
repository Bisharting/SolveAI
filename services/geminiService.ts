
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { UserInput, SolverResponse, MarketNiche, GeneratedConcept, CompetitorAnalysisResult } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are "SolveAI", an expert universal problem solver and innovation consultant.
Your job is to take a user’s described problem and provide solutions based on their requested strategy:
1. "Existing": Analyze real-world data, historical precedents, and proven methods to find what has actually worked for others.
2. "New": Generate fresh, innovative product ideas or novel methodologies that haven't been fully explored yet.
3. "Both": Provide a mix of proven pathways and new innovations.

You must always respond in valid JSON only, following the exact schema below.

#### SCORING RULES
- success_rating.score MUST be an integer between 0 and 100.
- "Existing" solutions should be scored based on historical efficacy (how well they generally work).
- "New" concepts should be scored based on potential viability and desirability (aim for 60-95 range for good ideas).
- Do NOT give arbitrarily low scores for "New" ideas; assume you are a capable inventor generating good solutions.

#### RESPONSE GUIDELINES
- For **Existing Solutions**: Cite specific real-world examples (e.g., "The Pomodoro Technique", "Dyson's Cyclone Technology"). Explain *why* it works.
- For **New Concepts**: Be creative. These can be physical products, software services, or new system methodologies.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    problem_understanding: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        root_cause: { type: Type.STRING },
        assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
        design_goals: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["summary", "root_cause", "assumptions", "design_goals"],
    },
    existing_solutions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          why_it_works: { type: Type.STRING },
          real_world_example: { type: Type.STRING },
          limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
          efficacy_rating: { type: Type.INTEGER },
        },
      },
    },
    generated_concepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["product", "service", "method"] },
          one_line_pitch: { type: Type.STRING },
          detailed_description: { type: Type.STRING },
          key_features: { type: Type.ARRAY, items: { type: Type.STRING } },
          user_benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
          target_personas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                primary_needs: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
          },
          risks_and_limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
          monetization_strategies: { type: Type.ARRAY, items: { type: Type.STRING } },
          success_rating: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              scale: { type: Type.STRING },
              justification: { type: Type.STRING },
            },
          },
          design_considerations: {
            type: Type.OBJECT,
            properties: {
              materials_or_tech: { type: Type.ARRAY, items: { type: Type.STRING } },
              estimated_complexity: { type: Type.STRING, enum: ["low", "medium", "high"] },
              estimated_cost_level: { type: Type.STRING, enum: ["low", "medium", "high"] },
            },
          },
          image_prompt: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    overall_recommendations: {
      type: Type.OBJECT,
      properties: {
        best_approach: { type: Type.STRING },
        reason: { type: Type.STRING },
        suggested_next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["best_approach", "reason", "suggested_next_steps"],
    },
  },
  required: ["problem_understanding", "existing_solutions", "generated_concepts", "overall_recommendations"],
};

/**
 * Solves the user's problem based on their selected strategy.
 */
export const solveUserProblem = async (input: UserInput): Promise<SolverResponse> => {
  try {
    const userPrompt = `
      Problem to solve: "${input.problemDescription}"
      Context/Domain: "${input.domain}"
      Constraints: "${input.constraints}"
      
      Requested Strategy: ${input.solutionType.toUpperCase()}
      - If "EXISTING", provide 3 proven, real-world solutions/products that successfully solve this.
      - If "NEW", provide ${input.numConcepts} fresh, innovative concepts (products, services, or methods).
      - If "BOTH", provide 2 existing proven solutions AND ${input.numConcepts} new innovative concepts.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const data: SolverResponse = JSON.parse(text);
    return data;
  } catch (error) {
    console.error("Error generating solutions:", error);
    throw error;
  }
};

/**
 * Generates an image for a specific concept using the prompt provided by the text model.
 */
export const generateConceptImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

/**
 * Generates a list of problem statements for a given domain.
 */
export const getProblemSuggestions = async (domain: string): Promise<string[]> => {
  try {
    const effectiveDomain = domain.trim() || "everyday life";
    const prompt = `List 3 distinct, specific, and real-world problems, inconveniences, or unmet needs in the domain of "${effectiveDomain}" that need solving. Return a JSON array of strings.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.8,
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
};

/**
 * Discovers market niches for a given broad domain.
 */
export const discoverMarketNiches = async (domain: string): Promise<MarketNiche[]> => {
  try {
    const effectiveDomain = domain.trim() || "emerging industries";
    const prompt = `Identify 3-5 specific, underserved market niches or "blue ocean" opportunities within the broader industry of "${effectiveDomain}". For each niche, provide a name, brief description, estimated competition level (low/medium/high), and the specific potential gap or opportunity.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              competition_level: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              potential_gap: { type: Type.STRING },
            },
            required: ['name', 'description', 'competition_level', 'potential_gap'],
          },
        },
        temperature: 0.8,
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error discovering niches:", error);
    return [];
  }
};

/**
 * Creates a chat session for refining a concept.
 */
export const createConceptChatSession = (concept: GeneratedConcept): Chat => {
  const systemInstruction = `
    You are an expert consultant and engineer. 
    You are helping a user refine and develop a specific solution: "${concept.name}".
    
    Solution Type: ${concept.type}
    Description: ${concept.detailed_description}
    
    Your goal is to help the user implement this.
    - If it's a product: discuss materials, manufacturing, specs.
    - If it's a method/service: discuss steps, rollout, process.
    - Be practical, innovative, and encouraging.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
    history: [
      {
        role: 'user',
        parts: [{ text: `I want to work on ${concept.name}. Context: ${JSON.stringify(concept)}` }],
      },
      {
        role: 'model',
        parts: [{ text: `I'm ready to help you develop ${concept.name}. What specific aspect would you like to tackle first?` }],
      }
    ]
  });
};

/**
 * Analyzes competitors using Google Search Grounding.
 */
export const analyzeCompetitors = async (concept: GeneratedConcept): Promise<CompetitorAnalysisResult> => {
  try {
    const prompt = `
      Perform a market search for real-world existing solutions similar to:
      Name: ${concept.name}
      Description: ${concept.detailed_description}

      Identify 3 real competitors or similar existing methods.
      
      Return a JSON object:
      {
        "competitors": [
          { "name": "Name", "product_name": "Product", "key_overlap": "Similarity", "weakness": "Weakness" }
        ],
        "differentiation_opportunities": ["Strategy 1...", "Strategy 2..."],
        "verdict": "Short summary."
      }
      
      Output ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.5,
      },
    });

    let jsonString = response.text || "{}";
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

    let data: any = {};
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      data = {
        competitors: [],
        differentiation_opportunities: ["Could not parse competitor data."],
        verdict: "Analysis failed."
      };
    }

    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri
          });
        }
      });
    }

    return {
      data: {
        competitors: data.competitors || [],
        differentiation_opportunities: data.differentiation_opportunities || [],
        verdict: data.verdict || ""
      },
      sources
    };

  } catch (error) {
    console.error("Error analyzing competitors:", error);
    throw error;
  }
};
