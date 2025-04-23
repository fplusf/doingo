import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

interface EmojiSuggestionResponse {
  emoji: string;
  confidence: number;
}

export async function getSuggestedEmojiFromLLM(
  title: string,
  category: 'work' | 'passion' | 'play',
): Promise<EmojiSuggestionResponse> {
  try {
    if (!groq.apiKey) {
      console.warn('GROQ API key not found, falling back to default emoji');
      return {
        emoji: '📝',
        confidence: 0,
      };
    }

    const prompt = `Given a task title "${title}" in the category "${category}", suggest the most appropriate single emoji that best represents this task. Consider the context, emotion, and purpose of the task.

    Requirements:
    - Return ONLY a single emoji character and confidence score
    - Format: { "emoji": "🎯", "confidence": 0.95 }
    - Confidence score should be between 0 and 1
    - Do not include any explanation or additional text

    Example outputs:
    { "emoji": "📚", "confidence": 0.9 }
    { "emoji": "💻", "confidence": 0.85 }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3, // Lower temperature for more consistent results
      max_completion_tokens: 50, // We only need a short response
      top_p: 1,
      stream: false, // We don't need streaming for this use case
      stop: null,
    });

    const response = chatCompletion.choices[0]?.message?.content || '';

    try {
      const parsed = JSON.parse(response) as EmojiSuggestionResponse;
      return parsed;
    } catch (e) {
      // If parsing fails, extract just the emoji using regex
      const emojiRegex = /[\p{Emoji}\u200d]+/u;
      const match = response.match(emojiRegex);
      return {
        emoji: match?.[0] || '📝',
        confidence: 0.5,
      };
    }
  } catch (error) {
    console.error('Error getting emoji suggestion from LLM:', error);
    return {
      emoji: '📝',
      confidence: 0,
    };
  }
}
