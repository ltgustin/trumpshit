import Parser from "rss-parser";

// Constants
const RSS_REQUEST_TIMEOUT = 15000; // 15 seconds
const GNEWS_MAX_ARTICLES = 10;
const MAX_ARTICLES_PER_FEED = 15;

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSSReader/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
    },
    timeout: RSS_REQUEST_TIMEOUT
});

// RSS feeds (neutral sources)
const RSS_FEEDS = [
    "https://www.npr.org/rss/rss.php?id=1014",
    "https://feeds.bbci.co.uk/news/politics/rss.xml",
    "https://feeds.feedburner.com/realclearpolitics/qlMj",
];

/**
 * Fetches articles from multiple sources (GNews API and RSS feeds)
 * @returns {Promise<Array>} Array of unique articles
 */
export async function fetchArticles() {
    let articles = [];

    // --- Fetch from GNews ---
    try {
        if (!process.env.GNEWS_API_KEY) {
            console.warn("GNEWS_API_KEY not set, skipping GNews API");
        } else {
            const gnewsUrl = `https://gnews.io/api/v4/search?q="Donald Trump"&lang=en&max=${GNEWS_MAX_ARTICLES}&apikey=${process.env.GNEWS_API_KEY}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), RSS_REQUEST_TIMEOUT);
            
            const gnewsRes = await fetch(gnewsUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!gnewsRes.ok) {
                console.warn("GNews API error:", gnewsRes.status, gnewsRes.statusText);
            } else {
                const gnewsData = await gnewsRes.json();

                if (gnewsData.articles && Array.isArray(gnewsData.articles)) {
                    articles.push(...gnewsData.articles
                        .filter(a => a.title && a.url && a.description) // Validate required fields
                        .map(a => ({
                            title: a.title.trim(),
                            url: a.url,
                            source: a.source?.name || 'Unknown',
                            publishedAt: a.publishedAt,
                            content: a.description.trim()
                        }))
                    );
                } else {
                    console.warn("No articles found in GNews response");
                }
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn("GNews API request timed out");
        } else {
            console.warn("Failed to fetch from GNews:", error.message);
        }
    }

    // --- Fetch from RSS ---
    for (let feed of RSS_FEEDS) {
        try {
            const feedData = await parser.parseURL(feed);
            
            if (feedData.items && Array.isArray(feedData.items)) {
                feedData.items
                    .slice(0, MAX_ARTICLES_PER_FEED) // Limit articles per feed
                    .forEach(item => {
                        if (item.title && 
                            item.title.includes("Trump") && 
                            item.link && 
                            item.pubDate) {
                            articles.push({
                                title: item.title.trim(),
                                url: item.link,
                                source: feedData.title || 'RSS Feed',
                                publishedAt: item.pubDate,
                                content: (item.contentSnippet || item.title || '').trim()
                            });
                        }
                    });
            }
        } catch (error) {
            console.warn(`Failed to fetch RSS feed ${feed}:`, error.message);
        }
    }

    // Deduplicate by URL and validate articles
    const unique = [];
    const seen = new Set();
    
    for (let art of articles) {
        // Additional validation
        if (art.url && 
            art.title && 
            art.content && 
            !seen.has(art.url) &&
            art.url.startsWith('http')) {
            seen.add(art.url);
            unique.push(art);
        }
    }

    return unique;
}
