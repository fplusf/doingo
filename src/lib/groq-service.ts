import { TaskPriority } from '@/features/tasks/types';
import Groq from 'groq-sdk';

// @ts-ignore - this is a valid environment variable
let apiKey = import.meta.env.VITE_GROQ_API_KEY; // don't touch this line

// Current user profession context for AI estimations
const USER_PROFESSION = 'Software Engineer';

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
          content: `You are a time management AI assistant helping a ${USER_PROFESSION}. Analyze task titles and estimate how long they would take to complete based on this professional context.
            - For small/simple tasks: 15-60 minutes (never less than 15 minutes)
            - For medium tasks: 1-3 hours
            - For large tasks: 3-8 hours
            - Consider the complexity and scope typical for a ${USER_PROFESSION}'s tasks
            - Never assign more than 8 hours (28800000ms) for any task
            - Never assign less than 15 minutes (900000ms) for any task
            - Return only a single number in milliseconds with no other text or explanation`,
        },
        {
          role: 'user',
          content: `Estimate the time needed for a ${USER_PROFESSION} to complete this task in milliseconds: "${taskTitle}"`,
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

    // Enforce minimum duration of 15 minutes
    const minDuration = 15 * 60 * 1000; // 15 minutes in ms
    if (durationMs < minDuration) {
      console.warn('Duration below minimum threshold, using 15 minutes');
      return minDuration;
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

/**
 * Batched AI predictions for task - combines duration, priority and emoji in a single API call
 * @param taskTitle The title of the task to analyze
 * @returns Object containing estimated duration, priority and emoji
 */
export const batchPredictTaskProperties = async (
  taskTitle: string,
): Promise<{ duration: number; priority: TaskPriority; emoji: string }> => {
  if (!taskTitle || taskTitle.trim().split(/\s+/).length < 3) {
    console.log('Task title too short, using default values');
    return {
      duration: getDefaultDuration(),
      priority: 'none',
      emoji: '📝',
    };
  }

  try {
    console.log(`Batch predicting properties for task: "${taskTitle}"`);

    // Check if API key is available
    if (!apiKey) {
      console.warn('GROQ API key not found, using default values');
      return {
        duration: getDefaultDuration(),
        priority: 'none',
        emoji: '📝',
      };
    }

    // Use the Groq SDK client
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a productivity AI assistant with three tasks:
            
            1. DURATION ESTIMATION for a ${USER_PROFESSION}:
            - For small/simple tasks: 15-60 minutes (never less than 15 minutes)
            - For medium tasks: 1-3 hours
            - For large tasks: 3-8 hours
            - Consider the complexity and scope typical for a ${USER_PROFESSION}'s tasks
            - Never assign more than 8 hours (28800000ms) for any task
            - Never assign less than 15 minutes (900000ms) for any task
            
            2. PRIORITY CLASSIFICATION (Eisenhower Matrix):
            - high: Urgent & Important - tasks requiring immediate attention with significant impact
            - medium: Important but Not Urgent - tasks that matter but don't need immediate action
            - low: Urgent but Not Important - tasks with deadlines but less impact
            - none: Not Urgent & Not Important - tasks with minimal impact

            3. EMOJI SELECTION:
            - Choose a single, most relevant emoji that best represents the task
            - Consider the task's nature, goal, and context for a ${USER_PROFESSION}
            - Pick professional and appropriate emojis
            - IMPORTANT: Return emoji as a quoted string, e.g. "emoji": "⚙️"
            - For coding tasks prefer: "👨‍💻","💻","⚙️","🔧","🚀","📱","🌐"
            - For meetings prefer: "👥","🤝","📊","🗣️"
            - For documentation prefer: "📝","📄","📚"
            - For planning prefer: "📅","🎯","📋"

            Analyze the task title and return ONLY a JSON object with three properties:
            - duration: time in milliseconds (numeric value only)
            - priority: "high", "medium", "low", or "none" (string value only)
            - emoji: a single emoji character as a quoted string`,
        },
        {
          role: 'user',
          content: `Analyze this task title for a ${USER_PROFESSION}: "${taskTitle}". Return a valid JSON object with duration in milliseconds, priority, and emoji (as a quoted string).`,
        },
      ],
      model: 'llama3-8b-8192',
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    console.log('Batch prediction response:', responseText);

    if (!responseText) {
      console.error('No response text from API');
      return {
        duration: getDefaultDuration(),
        priority: 'none',
        emoji: '📝',
      };
    }

    try {
      const parsedResponse = JSON.parse(responseText);

      // Extract and validate duration
      let duration = parseInt(String(parsedResponse.duration), 10);
      if (isNaN(duration) || duration <= 0) {
        console.warn('Invalid duration in response, using default');
        duration = getDefaultDuration();
      } else {
        // Enforce minimum duration of 15 minutes
        const minDuration = 15 * 60 * 1000;
        if (duration < minDuration) {
          console.warn('Duration below minimum threshold, using 15 minutes');
          duration = minDuration;
        }
        // Cap at 8 hours maximum
        duration = Math.min(duration, 8 * 60 * 60 * 1000);
      }

      // Extract and validate priority
      let priority = parsedResponse.priority?.toString().toLowerCase();
      if (!['high', 'medium', 'low', 'none'].includes(priority)) {
        console.warn('Invalid priority in response, using default');
        priority = 'none';
      }

      // Extract and validate emoji
      let emoji = typeof parsedResponse.emoji === 'string' ? parsedResponse.emoji.trim() : '📝';
      // Basic emoji validation - check if it's a single emoji character or emoji sequence
      if (!emoji || emoji.length > 4 || !/\p{Emoji}/u.test(emoji)) {
        console.warn('Invalid emoji in response, using default');
        emoji = '📝';
      }

      return {
        duration,
        priority: priority as TaskPriority,
        emoji,
      };
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', parseError);
      return {
        duration: getDefaultDuration(),
        priority: 'none',
        emoji: '📝',
      };
    }
  } catch (error) {
    console.error('Error in batch prediction:', error);
    return {
      duration: getDefaultDuration(),
      priority: 'none',
      emoji: '📝',
    };
  }
};
