const STOP_WORDS = new Set([
	'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'did',
	'do', 'does', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'his',
	'i', 'in', 'is', 'it', 'of', 'on', 'or', 'she', 'that', 'the', 'their',
	'them', 'there', 'they', 'this', 'to', 'was', 'were', 'what', 'when',
	'where', 'which', 'who', 'why', 'with', 'would'
]);

const tokenize = (text) =>
	String(text || '')
		.toLocaleLowerCase('en')
		.split(/[^\p{L}\p{N}]+/u)
		.filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

const splitSentences = (statement) =>
	String(statement || '')
		.match(/[^.!?]+[.!?]+|[^.!?]+$/g)
		?.map((sentence) => sentence.trim())
		.filter(Boolean) || [];

const findRelevantEvidence = (statement, question, limit = 3) => {
	const questionTokens = [...new Set(tokenize(question))];
	const ranked = splitSentences(statement)
		.map((sentence, index) => {
			const sentenceTokens = new Set(tokenize(sentence));
			const matches = questionTokens.filter((token) => sentenceTokens.has(token));
			return { sentence, index, score: matches.length, matches };
		})
		.filter((candidate) => candidate.score > 0)
		.sort((left, right) => right.score - left.score || left.index - right.index)
		.slice(0, limit);

	return {
		candidates: ranked,
		strongMatch: ranked.some((candidate) => candidate.score >= 2)
	};
};

module.exports = { findRelevantEvidence, splitSentences, tokenize };
