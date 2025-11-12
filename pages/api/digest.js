import { fetchArticles } from "../../src/lib/fetchArticles.js";
import { analyzeArticle } from "../../src/lib/analyzeArticles.js";
import { put } from "@vercel/blob";

// Constants
const MAX_ARTICLES = 5;
const CACHE_DURATION = 3600; // 1 hour in seconds
const BLOB_KEY = "digest.json";

/**
 * API handler for generating and updating the digest
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 */
export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Security: Allow Vercel cron jobs or manual trigger with secret token
    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    const hasSecret = req.query.secret === process.env.DIGEST_SECRET;
    
    if (!isVercelCron && !hasSecret) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'This endpoint can only be called by Vercel cron or with a valid secret token'
        });
    }

    try {
        const startTime = Date.now();
        const triggerType = isVercelCron ? 'Vercel Cron' : 'Manual';
        console.log(`[${triggerType}] Starting digest generation at ${new Date().toISOString()}`);

        const articles = await fetchArticles();
        const topArticles = articles.slice(0, MAX_ARTICLES);

        // Parallel processing for better performance
        const analyzed = await Promise.all(
            topArticles.map(art => analyzeArticle(art))
        );

        // Save digest to Vercel Blob Storage (serverless-compatible storage)
        try {
            const blob = await put(BLOB_KEY, JSON.stringify(analyzed, null, 2), {
                access: 'public',
                contentType: 'application/json',
                addRandomSuffix: false, // Overwrite existing file
            });
            console.log(`Digest saved to blob storage: ${blob.url}`);
        } catch (err) {
            console.error("Failed to save digest to blob storage:", err);
            // Continue even if blob storage fails - the digest was still generated
        }

        const duration = Date.now() - startTime;
        console.log(`[${triggerType}] Digest updated successfully: ${analyzed.length} articles in ${duration}ms`);

        // Set cache headers
        res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATION}`);
        res.setHeader('Content-Type', 'application/json');

        return res.status(200).json({ 
            message: "Digest updated", 
            count: analyzed.length,
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
            triggeredBy: triggerType
        });
    } catch (err) {
        console.error('[Digest] Generation failed:', err);
        return res.status(500).json({ 
            error: "Service temporarily unavailable",
            timestamp: new Date().toISOString()
        });
    }
}