import { list } from "@vercel/blob";

// Constants
const CACHE_DURATION = 3600; // 1 hour in seconds
const BLOB_KEY = "digest.json";

/**
 * API handler for serving the cached digest
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 */
export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Fetch digest from Vercel Blob Storage
        const blobs = await list({ prefix: BLOB_KEY });
        
        if (blobs.blobs.length === 0) {
            return res.status(404).json({ 
                error: 'Digest not found',
                message: 'Digest has not been generated yet. Please wait for the cron job to run.'
            });
        }

        // Find the exact blob or use the first one
        const blob = blobs.blobs.find(b => b.pathname === BLOB_KEY) || blobs.blobs[0];
        
        // Fetch the blob content directly from its URL
        const response = await fetch(blob.url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status}`);
        }

        const digestData = await response.text();
        const digest = JSON.parse(digestData);

        // Set cache headers
        res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATION}`);
        res.setHeader('Content-Type', 'application/json');

        return res.status(200).json(digest);
    } catch (err) {
        console.error('[Digest] Fetch failed:', err);
        return res.status(500).json({ 
            error: "Service temporarily unavailable",
            timestamp: new Date().toISOString()
        });
    }
}

