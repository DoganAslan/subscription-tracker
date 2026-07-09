const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-flash-latest';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

export interface ScannedSubscription {
  name?: string;
  amount?: number;
  currency?: string;
  billingCycle?: 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'yearly' | 'biennially';
}

export const analyzeReceiptImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<ScannedSubscription | null> => {
  try {
    const promptText = `
      Analyze this receipt or invoice image and extract the subscription details.
      Return ONLY a raw, valid JSON object with no markdown formatting and no backticks.
      The JSON must match this structure exactly:
      {
        "name": "Extracted brand or service name (string)",
        "amount": Extracted total amount (number, decimals allowed),
        "currency": "Extracted 3-letter currency code (e.g., USD, TRY, EUR)",
        "billingCycle": "Guess the cycle based on context. Must be one of: 'weekly', 'monthly', 'quarterly', 'biannually', 'yearly', 'biennially'. Default to 'monthly'."
      }
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1, // Low temperature for factual extraction
      }
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the response
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up potential markdown formatting (e.g. \`\`\`json ... \`\`\`)
    const cleanedText = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!cleanedText) {
      return null;
    }

    const parsedJson = JSON.parse(cleanedText) as ScannedSubscription;
    return parsedJson;

  } catch (error) {
    console.error('Failed to parse receipt with Gemini:', error);
    return null;
  }
};
