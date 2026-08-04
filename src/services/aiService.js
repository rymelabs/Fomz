import { Mistral } from '@mistralai/mistralai';

const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;

// Initialize Mistral client only if key is present
const client = apiKey ? new Mistral({ apiKey: apiKey }) : null;

const FORM_JSON_SCHEMA = `
{
  "title": "Form Title",
  "description": "Form Description",
  "theme": "blue|green|mixed|soft|minimal|dark|coral|forest|aurora|sandstone|neon|berry|slate|sunrise|teal|violet|citrus|cobalt|blush|lagoon|latte",
  "fontFamily": "poppins|inter|roboto|lato|opensans|montserrat|raleway|sourcesans|playfair|serif|mono|dancing|pacifico",
  "style": {
    "fontFamily": "poppins|inter|roboto|lato|opensans|montserrat|raleway|sourcesans|playfair|serif|mono|dancing|pacifico",
    "fontSize": "sm|md|lg",
    "borderRadius": "none|sm|md|lg|full"
  },
  "settings": {
    "allowMultipleSubmissions": false,
    "requireLogin": false,
    "sendEmailReceipt": false,
    "redirectUrl": "",
    "showProgressBar": true
  },
  "sections": [
    {
      "id": "Keep the existing ID when editing; use a unique new_section_* temporary ID for a new section",
      "title": "Section Title",
      "description": "Section description",
      "questions": [
        {
          "id": "Keep the existing ID when editing; use a unique new_question_* temporary ID for a new question",
          "type": "short-text|long-text|multiple-choice|checkbox|dropdown|email|number|date|rating|image|phone|time|slider|address",
          "title": "Question Text",
          "required": true,
          "placeholder": "Optional placeholder",
          "helpText": "Optional supporting text",
          "options": ["Option 1", "Option 2"]
        }
      ]
    }
  ],
  "questions": [],
  "logicRules": [
    {
      "id": "Keep the existing ID when editing; use a unique new_rule_* temporary ID for a new rule",
      "name": "Rule Name",
      "logicType": "AND|OR",
      "conditions": [
        {
          "questionId": "Exact ID of the condition question",
          "questionTitle": "Exact title as a fallback",
          "operator": "equals|not_equals|contains|not_contains|greater_than|less_than|is_empty|is_not_empty",
          "value": "Value to compare"
        }
      ],
      "actions": [
        {
          "type": "show|hide|require|unrequire|skip_to",
          "targetQuestionIds": ["Exact question ID"],
          "targetQuestionId": "Exact question ID for skip_to",
          "targetQuestionTitles": ["Exact title fallback"],
          "targetQuestionTitle": "Exact title fallback for skip_to"
        }
      ]
    }
  ]
}`;

const parseAIResponse = (chatResponse) => {
  const content = chatResponse.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse AI response', error);
    const cleanContent = content.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanContent);
  }
};

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
          The JSON should have this structure: ${FORM_JSON_SCHEMA}
          "sections" is optional, but if present questions should be nested there; "questions" is optional for loose questions.
          "logicRules" is optional. Use it to add conditional logic. 
          IMPORTANT: In logicRules, refer to questions by their EXACT "title". 
          For "skip_to" action, use "targetQuestionTitle". For others, use "targetQuestionTitles" array.
          "fontFamily" is optional. Choose based on the form's purpose: use "dancing" or "pacifico" for creative/artistic forms, "playfair" or "serif" for elegant/formal forms, "mono" for technical forms, and modern sans-serif fonts like "poppins", "inter", or "montserrat" for professional/business forms.
          Do not include markdown formatting or code blocks.`
        },
        { role: "user", content: `Create a form for: ${prompt}` }
      ],
      responseFormat: { type: 'json_object' }
    });

    return parseAIResponse(chatResponse);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const editFormFromPrompt = async (currentForm, instruction) => {
  if (!client) {
    throw new Error('Fomzy editing requires a configured Mistral API key.');
  }

  try {
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content: `You edit an existing form according to the user's instruction.
          Output ONLY valid JSON using this structure: ${FORM_JSON_SCHEMA}
          Return the COMPLETE revised form, not a patch or explanation.
          Preserve every unaffected section, question, option, conditional rule, theme, and font.
          Keep the exact existing id for every retained section, question, and logic rule. Give every new item a unique temporary id with a new_* prefix and use that same temporary question ID in logic references.
          Remove an item only when the user explicitly requests removal or when it is strictly necessary for the requested edit.
          For conditional follow-up questions, use a "show" action; shown targets are hidden until the condition matches.
          Logic references should use exact question IDs. Ensure every referenced ID exists in the returned form.
          Do not include markdown formatting or code blocks.`
        },
        {
          role: 'user',
          content: `CURRENT FORM:\n${JSON.stringify(currentForm)}\n\nEDIT REQUEST:\n${instruction}`
        }
      ],
      responseFormat: { type: 'json_object' }
    });

    return parseAIResponse(chatResponse);
  } catch (error) {
    console.error('AI Form Edit Error:', error);
    throw error;
  }
};
