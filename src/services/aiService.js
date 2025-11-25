import { Mistral } from '@mistralai/mistralai';

const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;

// Initialize Mistral client only if key is present
const client = apiKey ? new Mistral({ apiKey: apiKey }) : null;

export const generateFormFromPrompt = async (prompt) => {
  if (!client) {
    // Mock response for demo purposes if no key is provided
    console.warn('No Mistral API key found. Using mock response.');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: "AI Generated Form",
          description: `Form generated based on: "${prompt}"`,
          theme: "blue",
          sections: [
            {
              title: "Contact Information",
              description: "Tell us how to reach you",
              questions: [
                {
                  type: "short-text",
                  title: "Full Name",
                  required: true,
                  placeholder: "John Doe"
                },
                {
                  type: "email",
                  title: "Email Address",
                  required: true,
                  placeholder: "john@example.com"
                }
              ]
            }
          ],
          questions: []
        });
      }, 2000);
    });
  }

  try {
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates form structures. 
          Output ONLY valid JSON. 
          The JSON should have this structure:
          {
            "title": "Form Title",
            "description": "Form Description",
            "theme": "blue|green|mixed|soft|minimal|dark|coral|forest|aurora|sandstone|neon|berry|slate|sunrise|teal|violet|citrus|cobalt|blush|lagoon|latte",
            "sections": [
              {
                "title": "Section Title",
                "description": "Section description",
                "questions": [
                  {
                    "type": "short-text" | "long-text" | "multiple-choice" | "checkbox" | "dropdown" | "email" | "number" | "date" | "rating" | "image",
                    "title": "Question Text",
                    "required": boolean,
                    "placeholder": "Optional placeholder",
                    "options": ["Option 1", "Option 2"] (only for choice types)
                  }
                ]
              }
            ],
            "questions": [
              {
                "type": "short-text" | "long-text" | "multiple-choice" | "checkbox" | "dropdown" | "email" | "number" | "date" | "rating" | "image",
                "title": "Question Text",
                "required": boolean,
                "placeholder": "Optional placeholder",
                "options": ["Option 1", "Option 2"] (only for choice types)
              }
            ]
          }
          "sections" is optional, but if present questions should be nested there; "questions" is optional for loose questions.
          Do not include markdown formatting or code blocks.`
        },
        { role: "user", content: `Create a form for: ${prompt}` }
      ],
      responseFormat: { type: 'json_object' }
    });

    const content = chatResponse.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      const cleanContent = content.replace(/```json\n?|\n?```/g, '');
      return JSON.parse(cleanContent);
    }
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};
