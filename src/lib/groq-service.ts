import Groq from 'groq-sdk';

// @ts-ignore - this is a valid environment variable
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
 * Estimates task duration based on task title using Groq AI
 * @param taskTitle The title of the task to estimate duration for
 * @returns Estimated duration in milliseconds
 */
export const estimateTaskDuration = async (taskTitle: string): Promise<number> => {
  if (!taskTitle || taskTitle.trim().split(/\s+/).length < 3) {
    console.log('Task title too short, using default duration of 45 minutes');
    return 45 * 60 * 1000; // Default 45 minutes for very short titles
  }

  try {
    console.log(`Estimating duration for task: "${taskTitle}"`);

    // Check if API key is available
    if (!apiKey) {
      console.warn('GROQ API key not found, using default duration');
      return getDefaultDuration();
    }

    // Use the Groq SDK client instead of fetch
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a time management AI assistant. Analyze task titles and estimate how long they would take to complete.
            - For small/simple tasks: 15-60 minutes
            - For medium tasks: 1-3 hours
            - For large tasks: 3-8 hours
            - Never assign more than 8 hours (28800000ms) for any task
            - Return only a single number in milliseconds with no other text or explanation`,
        },
        {
          role: 'user',
          content: `Estimate the time needed to complete this task in milliseconds: "${taskTitle}"`,
        },
      ],
      model: 'llama3-8b-8192',
      temperature: 0.1,
      max_tokens: 16,
    });

    const durationText = completion.choices[0]?.message?.content?.trim();
    console.log('Duration text from API:', durationText);

    if (!durationText) {
      console.error('No duration text in response');
      return getDefaultDuration();
    }

    // Parse the duration - handling both numeric strings and those with commas/spaces
    const durationMs = parseInt(durationText.replace(/[^0-9]/g, ''), 10);
    console.log('Parsed duration (ms):', durationMs);

    if (isNaN(durationMs) || durationMs <= 0) {
      console.error('Invalid duration value after parsing');
      return getDefaultDuration();
    }

    // Quick sanity check - if response is way too small, it's probably wrong
    if (durationMs < 15 * 60 * 1000) {
      console.warn('Duration suspiciously small, might be in wrong units. Using default.');
      return getDefaultDuration();
    }

    // Cap at 8 hours maximum
    const finalDuration = Math.min(durationMs, 8 * 60 * 60 * 1000);
    console.log(
      `Final estimated duration: ${finalDuration}ms (${finalDuration / (60 * 1000)} minutes)`,
    );
    return finalDuration;
  } catch (error) {
    console.error('Error estimating task duration:', error);
    return getDefaultDuration();
  }
};

/**
 * Fallback function that returns a default duration of 45 minutes
 */
const getDefaultDuration = (): number => {
  return 45 * 60 * 1000; // 45 minutes default
};

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
