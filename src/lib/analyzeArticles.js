import fetch from "node-fetch";

// Constants
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_CONTENT_LENGTH = 5000; // Maximum content length to process

/**
 * Makes a request to Hugging Face API with timeout and error handling
 * @param {string} model - The model to use
 * @param {string} inputs - The input text to process
 * @returns {Promise<Object|null>} The API response or null if failed
 */
async function hfRequest(model, inputs) {
    try {
        if (!process.env.HF_API_KEY) {
            return null;
        }
        
        // Validate inputs
        if (!inputs || typeof inputs !== 'string' || inputs.length > MAX_CONTENT_LENGTH) {
            return null;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        
        const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
            return null;
        }
        
        return await res.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn(`HF API request timed out for model: ${model}`);
        }
        return null;
    }
}

/**
 * Analyzes an article for sentiment and generates a summary
 * @param {Object} article - The article to analyze
 * @param {string} article.title - Article title
 * @param {string} article.content - Article content
 * @param {string} article.url - Article URL
 * @param {string} article.source - Article source
 * @param {string} article.publishedAt - Publication date
 * @returns {Promise<Object>} Analyzed article with summary and sentiment
 */
export async function analyzeArticle(article) {
    // Input validation
    if (!article || !article.content || typeof article.content !== 'string') {
        return {
            ...article,
            summary: article?.content || 'No content available',
            sentiment: 'neutral'
        };
    }

    // Truncate content if too long
    const contentToAnalyze = article.content.length > MAX_CONTENT_LENGTH 
        ? article.content.substring(0, MAX_CONTENT_LENGTH) 
        : article.content;

    // Summarize
    const summaryRes = await hfRequest("facebook/bart-large-cnn", contentToAnalyze);
    const summary = summaryRes?.[0]?.summary_text || 
        contentToAnalyze.substring(0, 200) + (contentToAnalyze.length > 200 ? '...' : '');

    // Sentiment
    const sentimentRes = await hfRequest("cardiffnlp/twitter-roberta-base-sentiment", summary);
    let label = "neutral";
    
    if (sentimentRes?.[0]) {
        const scores = sentimentRes[0];
        // Find the label with highest score
        const maxScore = Math.max(...scores.map(s => s.score));
        const topLabel = scores.find(s => s.score === maxScore)?.label;
        
        // Map labels to readable sentiment
        const labelMap = {
            'LABEL_0': 'negative',
            'LABEL_1': 'neutral', 
            'LABEL_2': 'positive'
        };
        
        label = labelMap[topLabel] || "neutral";
    }

    return {
        ...article,
        summary,
        sentiment: label
    };
}
