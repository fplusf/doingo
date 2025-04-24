import data from '@emoji-mart/data';

// List of common stop words to skip
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'he',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'that',
  'the',
  'to',
  'was',
  'were',
  'will',
  'with',
  'the',
  'this',
  'but',
  'they',
  'have',
  'had',
  'what',
  'when',
  'where',
  'who',
  'which',
  'why',
  'how',
]);

// Cache for emoji search terms to avoid recomputing
const emojiSearchTermsCache = new Map<string, string[]>();

// Initialize emoji search terms cache
const initializeEmojiCache = () => {
  const emojiData = data as any;
  Object.entries(emojiData.emojis).forEach(([id, emojiInfo]: [string, any]) => {
    const searchTerms = [
      emojiInfo.name,
      ...(emojiInfo.keywords || []),
      ...(emojiInfo.shortcodes || []).map((code: string) => code.replace(/:/g, '')),
    ].map((term) => term.toLowerCase());

    emojiSearchTermsCache.set(id, searchTerms);
  });
};

// Initialize cache on module load
initializeEmojiCache();

// Get meaningful words from text
const getMeaningfulWords = (text: string): string[] => {
  if (!text) return [];

  // Split by whitespace and get all words
  const words = text.trim().toLowerCase().split(/\s+/);

  // Filter out stop words and words shorter than 3 characters
  return words.filter((word) => word.length > 2 && !STOP_WORDS.has(word)).slice(-5); // Keep last 5 meaningful words
};

interface EmojiMatch {
  word: string;
  emoji: string;
  position: number;
  relevance: number;
}

// Find the most relevant emoji for a given word
const findEmojiForWord = (word: string, position: number): EmojiMatch | null => {
  if (!word) return null;

  const emojiData = data as any;
  const searchResults: Array<EmojiMatch> = [];

  // Search through emoji keywords using cached search terms
  Object.entries(emojiData.emojis).forEach(([id, emojiInfo]: [string, any]) => {
    const searchTerms = emojiSearchTermsCache.get(id) || [];

    // Check for matches
    const exactMatch = searchTerms.some((term) => term === word);
    const containsMatch = !exactMatch && searchTerms.some((term) => term.includes(word));
    const isContainedMatch =
      !exactMatch && !containsMatch && searchTerms.some((term) => word.includes(term));

    if (exactMatch || containsMatch || isContainedMatch) {
      searchResults.push({
        word,
        emoji: emojiInfo.skins[0].native,
        position,
        // Prioritize exact matches, then containing matches, then contained matches
        relevance: exactMatch ? 3 : containsMatch ? 2 : 1,
      });
    }
  });

  // Return the best match if any found
  return searchResults.length > 0
    ? searchResults.sort((a, b) => b.relevance - a.relevance)[0]
    : null;
};

// Keep track of the last matched word and its emoji
let lastMatchedWord = '';
let lastMatchedEmoji = '📝';

export const findEmojiForTitle = (title: string): string => {
  if (!title?.trim()) return '📝';

  // Get meaningful words
  const meaningfulWords = getMeaningfulWords(title);
  if (!meaningfulWords.length) return '📝';

  // Find emoji matches for each word
  const matches: EmojiMatch[] = [];
  meaningfulWords.forEach((word, index) => {
    // Skip if this word was the last matched word (avoid unnecessary recomputation)
    if (word === lastMatchedWord) {
      matches.push({
        word,
        emoji: lastMatchedEmoji,
        position: index,
        relevance: 3,
      });
      return;
    }

    const match = findEmojiForWord(word, index);
    if (match) {
      matches.push(match);
    }
  });

  // If no matches found, return default
  if (!matches.length) return '📝';

  // Sort matches by position (to get the latest match) and then by relevance
  const sortedMatches = matches.sort((a, b) => {
    // First sort by position (latest first)
    if (b.position !== a.position) {
      return b.position - a.position;
    }
    // Then by relevance
    return b.relevance - a.relevance;
  });

  // Update last matched word and emoji
  const bestMatch = sortedMatches[0];
  lastMatchedWord = bestMatch.word;
  lastMatchedEmoji = bestMatch.emoji;

  // Return the emoji from the best match
  return bestMatch.emoji;
};
