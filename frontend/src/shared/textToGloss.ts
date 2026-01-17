/**
 * Rule-based Text to ISL Gloss Converter
 * 
 * Rules applied:
 * 1. Remove articles (a, an, the)
 * 2. Remove helping verbs (am, is, are, was, were)
 * 3. Maintain Subject -> Object -> Verb (SOV) order
 * 4. Move specific question words (WHAT, WHERE, etc.) to the end
 * 5. Output in UPPERCASE
 */

const ARTICLES = new Set(['a', 'an', 'the']);
const HELPING_VERBS = new Set(['am', 'is', 'are', 'was', 'were']);

// Basic list of common verbs to help with SOV transformation
const COMMON_VERBS = new Set([
    'go', 'going', 'gone',
    'eat', 'eating', 'ate',
    'play', 'playing', 'played',
    'see', 'seeing', 'saw',
    'come', 'coming', 'came',
    'want', 'wants', 'wanted',
    'like', 'likes', 'liked',
    'do', 'doing', 'did'
]);

// Question words that typically move to the end in ISL
const WH_QUESTIONS = new Set(['what', 'where', 'when', 'why', 'who']);

// Map common inflected verbs to their roots used in the WLASL dataset
const LEMMATIZATION_MAP: Record<string, string> = {
    'going': 'go',
    'gone': 'go',
    'eating': 'eat',
    'ate': 'eat',
    'playing': 'play',
    'played': 'play',
    'seeing': 'see',
    'saw': 'see',
    'coming': 'come',
    'came': 'come',
    'wanting': 'want',
    'wanted': 'want',
    'likes': 'like',
    'liked': 'like',
    'doing': 'do',
    'did': 'do',
    'helping': 'help',
    'helped': 'help',
    'working': 'work',
    'worked': 'work'
};

// Map numeric digits to their word equivalent for dataset compatibility
const NUMBER_MAP: Record<string, string> = {
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
    '10': 'ten'
};

export const convertToGloss = (text: string): string => {
    if (!text || typeof text !== 'string') return '';

    // 1. Tokenize and Normalize
    let words = text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 0);

    // 1.5 Convert Numbers to Words (e.g., "5" -> "five")
    words = words.map(word => NUMBER_MAP[word] || word);

    // 2. Remove Articles and Helping Verbs
    words = words.filter(word => !ARTICLES.has(word) && !HELPING_VERBS.has(word));

    if (words.length === 0) return '';

    // 3. Lemmatize (map to roots for dataset compatibility)
    words = words.map(word => LEMMATIZATION_MAP[word] || word);

    // 4. Apply ISL Grammar Rules (Deterministic transformations)
    // Rule: Move question word to the end (e.g., "What is your name" -> "YOUR NAME WHAT")
    if (words.length > 1 && WH_QUESTIONS.has(words[0])) {
        const qWord = words.shift()!;
        words.push(qWord);
    }

    // Rule: SOV Order (Simple heuristic: move first detected verb to the end if it has an object after it)
    let verbIndex = -1;
    for (let i = 0; i < words.length; i++) {
        if (COMMON_VERBS.has(words[i]) || LEMMATIZATION_MAP[words[i]]) {
            verbIndex = i;
            break;
        }
    }

    // If verb is found and it's not the last word, move it to the end
    if (verbIndex !== -1 && verbIndex < words.length - 1) {
        const verb = words.splice(verbIndex, 1)[0];
        words.push(verb);
    }

    // 5. Convert to UPPERCASE and return as string
    return words.join(' ').toUpperCase();
};
