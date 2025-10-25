// backend/utils/nlp.js
const natural = require('natural');
const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
const tokenizer = new natural.WordTokenizer();

// Extract keywords from text
function extractKeywords(text) {
    const tokens = tokenizer.tokenize(text.toLowerCase());
    return tokens.filter(token => token.length > 3).slice(0, 5); // Top 5 keywords
}

// Analyze sentiment
function analyzeSentiment(text) {
    const score = analyzer.getSentiment(tokenizer.tokenize(text));
    let sentiment;
    if (score > 0) sentiment = 'Positive';
    else if (score < 0) sentiment = 'Negative';
    else sentiment = 'Neutral';
    return { sentiment, score };
}

module.exports = { extractKeywords, analyzeSentiment };