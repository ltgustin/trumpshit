import fs from "fs";
import path from "path";

// Constants
const CACHE_DURATION = 3600; // 1 hour in seconds
const BLOB_KEY = "digest.json";

// Helper function to load digest (works in both Vercel and local)
async function loadDigest() {
    const isVercel = process.env.VERCEL === '1' || process.env.BLOB_READ_WRITE_TOKEN;
    
    if (isVercel) {
        // Use Vercel Blob Storage in production
        try {
            const { list } = await import("@vercel/blob");
            const blobs = await list({ prefix: BLOB_KEY });
            
            if (blobs.blobs.length === 0) {
                return null;
            }

            // Find the exact blob or use the first one
            const blob = blobs.blobs.find(b => b.pathname === BLOB_KEY) || blobs.blobs[0];
            
            // Fetch the blob content directly from its URL
            const response = await fetch(blob.url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch blob: ${response.status}`);
            }

            const digestData = await response.text();
            return JSON.parse(digestData);
        } catch (err) {
            console.error("Failed to load digest from blob storage:", err);
            return null;
        }
    } else {
        // Use file system for local development
        try {
            const filePath = path.join(process.cwd(), "public", "digest.json");
            if (!fs.existsSync(filePath)) {
                return null;
            }
            const fileData = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileData);
        } catch (err) {
            console.error("Failed to load digest from local file:", err);
            return null;
        }
    }
}

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
        const digest = await loadDigest();
        
        if (!digest) {
            return res.status(404).json({ 
                error: 'Digest not found',
                message: 'Digest has not been generated yet. Please wait for the cron job to run or trigger it manually.'
            });
        }

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

