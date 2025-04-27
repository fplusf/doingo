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
  // 'why',
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

    // Skip unwanted emojis
    const unwantedEmojis = ['😐', '😑'];
    if (unwantedEmojis.includes(emojiInfo.skins[0].native)) {
      return;
    }

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
  console.log('Finding emoji for title:', title);
  console.log('Current lastMatchedEmoji:', lastMatchedEmoji);

  if (!title?.trim()) {
    console.log('Empty title, returning lastMatchedEmoji:', lastMatchedEmoji || '📝');
    return lastMatchedEmoji || '📝';
  }

  // Get meaningful words
  const meaningfulWords = getMeaningfulWords(title);
  console.log('Meaningful words:', meaningfulWords);

  if (!meaningfulWords.length) {
    console.log('No meaningful words, returning lastMatchedEmoji:', lastMatchedEmoji || '📝');
    return lastMatchedEmoji || '📝';
  }

  // Find emoji matches for each word
  const matches: EmojiMatch[] = [];
  meaningfulWords.forEach((word, index) => {
    // Skip if this word was the last matched word (avoid unnecessary recomputation)
    if (word === lastMatchedWord) {
      console.log('Using cached match for word:', word, 'with emoji:', lastMatchedEmoji);
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
      console.log('Found new match for word:', word, 'with emoji:', match.emoji);
      matches.push(match);
    } else {
      console.log('No match found for word:', word);
    }
  });

  // If no matches found, return the last matched emoji or default
  if (!matches.length) {
    console.log('No matches found for any words, using fallback emoji:', lastMatchedEmoji || '📝');

    // If lastMatchedEmoji is an unwanted emoji, reset it to 📝
    const unwantedEmojis = ['😐', '😑'];
    if (unwantedEmojis.includes(lastMatchedEmoji)) {
      console.log('Resetting lastMatchedEmoji from unwanted emoji to default');
      lastMatchedEmoji = '📝';
    }

    return lastMatchedEmoji || '📝';
  }

  // Sort matches by position (to get the latest match) and then by relevance
  const sortedMatches = matches.sort((a, b) => {
    // First sort by position (latest first)
    if (b.position !== a.position) {
      return b.position - a.position;
    }
    // Then by relevance
    return b.relevance - a.relevance;
  });

  console.log('sortedMatches: ', sortedMatches);
  // Update last matched word and emoji
  const bestMatch = sortedMatches[0];
  lastMatchedWord = bestMatch.word;
  console.log('lastMatchedWord', lastMatchedWord);

  // Ensure we never use unwanted emojis
  const unwantedEmojis = ['😐', '😑'];
  if (unwantedEmojis.includes(bestMatch.emoji)) {
    console.log('Avoiding unwanted emoji, using default 📝 instead');
    lastMatchedEmoji = '📝';
  } else {
    lastMatchedEmoji = bestMatch.emoji;
  }

  console.log('lastMatchedEmoji', lastMatchedEmoji);

  // Return the emoji from the best match (avoiding neutral face)
  return lastMatchedEmoji;
};
