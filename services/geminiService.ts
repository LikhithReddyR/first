import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, TripPlan } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTripPlan = async (
  destination: string,
  days: number,
  interests: string,
  tripStyle: string
): Promise<AIResponse> => {
  try {
    // Added instructions for conciseness to prevent massive responses causing JSON errors
    const prompt = `Plan a ${days}-day trip to ${destination} with a ${tripStyle} style, focusing on ${interests}. 
    Provide a structured itinerary. 
    IMPORTANT: Keep activity descriptions concise (under 20 words each). Do not generate extremely long text. Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.4, // Reduced temperature for more deterministic/structured output
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tripName: { type: Type.STRING, description: "A catchy title for the trip" },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  theme: { type: Type.STRING, description: "Main theme for the day" },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING, description: "Time of day (e.g., Morning)" },
                        activity: { type: Type.STRING, description: "Short description of activity" },
                        locationName: { type: Type.STRING, description: "Specific location name" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
    });

    const text = response.text || "{}";
    let tripPlan: TripPlan | undefined;
    
    try {
      tripPlan = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse trip plan JSON", e);
      return { 
        text: "We encountered an issue generating a complete itinerary. Please try again with fewer days or simpler interests." 
      };
    }

    return { text, tripPlan };
  } catch (error) {
    console.error("Trip Plan Error:", error);
    return { text: "Sorry, an error occurred while generating your trip plan. Please check your connection and try again." };
  }
};

export const getFirstAidAdvice = async (query: string): Promise<AIResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        systemInstruction: "You are a helpful and calm first aid assistant. Provide concise, step-by-step instructions for medical emergencies or minor injuries.",
      },
    });

    return { text: response.text || "No advice available." };
  } catch (error) {
    console.error("First Aid Error:", error);
    return { text: "Unable to retrieve first aid advice." };
  }
};

export const getCurrencyRate = async (from: string, to: string, amount: number): Promise<string> => {
  try {
    const prompt = `What is the current exchange rate from ${amount} ${from} to ${to}? Calculate the final value and tell me the rate used.`;
    
    // Using Search grounding to get the most up-to-date rate possible
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "Could not retrieve currency data.";
  } catch (error) {
    console.error("Currency Error:", error);
    return "Error fetching rates.";
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const prompt = `Translate the following text into ${targetLanguage}. Provide only the translated text without introductory phrases.
    
    Text: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Translation failed.";
  } catch (error) {
    console.error("Translation Error:", error);
    return "Error translating text.";
  }
};