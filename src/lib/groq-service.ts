import Groq from 'groq-sdk';

let apiKey = import.meta.env.VITE_GROQ_API_KEY; // don't touch this line

// Function to set the API key from application config
export function setGroqApiKey(key: string) {
  apiKey = key;
}

// Initialize Groq client with the current API key
function getGroqClient() {
  return new Groq({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
}

interface SubtaskGenerationResponse {
  subtasks: string[];
}

/**
 * Generates subtasks for a given task using Groq LLM.
 * @param taskTitle The title of the task to generate subtasks for
 * @param count The number of subtasks to generate (default 5, max 15)
 * @returns An array of subtask titles
 */
export async function generateSubtasksWithLLM(taskTitle: string, count = 3): Promise<string[]> {
  if (!taskTitle.trim()) {
    return [];
  }

  try {
    const groq = getGroqClient();

    // Ensure count is within valid range
    const requestedCount = Math.min(Math.max(count, 1), 15);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant that specializes in breaking down tasks into smaller, actionable subtasks. 
          Always respond in JSON format with an array of subtasks.`,
        },
        {
          role: 'user',
          content: `Break down this task into ${requestedCount} clear, actionable subtasks: "${taskTitle}". 
          Each subtask should be specific and help accomplish the main task. When the main task is short and simple, generate short length subtasks.
          Provide exactly ${requestedCount} subtasks - no more, no less.
          Respond ONLY with a JSON object containing an array of subtasks, like this: {"subtasks": ["Subtask 1", "Subtask 2", "Subtask 3"]}`,
        },
      ],
      model: 'llama3-70b-8192',
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '';

    try {
      const parsedResponse = JSON.parse(responseText) as SubtaskGenerationResponse;

      // Ensure we return the exact number of subtasks requested (or fewer if not enough generated)
      const subtasks = parsedResponse.subtasks || [];
      return subtasks.slice(0, requestedCount);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error generating subtasks with LLM:', error);
    return [];
  }
}
