import fs from "fs";
import path from "path";

const cleanupDirectory = (dirPath, maxAgeMs) => {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath);
    const now = Date.now();

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            // Recursively clean up subdirectories
            cleanupDirectory(fullPath, maxAgeMs);
            
            // If directory is now empty and old enough, remove it
            try {
                const remainingFiles = fs.readdirSync(fullPath);
                if (remainingFiles.length === 0 && (now - stats.mtimeMs > maxAgeMs)) {
                    fs.rmdirSync(fullPath);
                    console.log(`[Sweeper] Removed empty directory: ${fullPath}`);
                }
            } catch (err) {
                console.error(`[Sweeper] Error removing directory ${fullPath}:`, err.message);
            }
        } else {
            // If file is old enough, remove it
            if (now - stats.mtimeMs > maxAgeMs) {
                try {
                    fs.unlinkSync(fullPath);
                    console.log(`[Sweeper] Removed old file: ${fullPath}`);
                } catch (err) {
                    console.error(`[Sweeper] Error removing file ${fullPath}:`, err.message);
                }
            }
        }
    }
};

export const startAutoCleanup = (intervalMs = 10 * 60 * 1000, maxAgeMs = 60 * 60 * 1000) => {
    const tempDir = path.join(process.cwd(), "temp");
    
    console.log(`[Sweeper] Auto-cleanup initialized. Interval: ${intervalMs / 1000}s, Max Age: ${maxAgeMs / 1000}s`);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    setInterval(() => {
        try {
            cleanupDirectory(tempDir, maxAgeMs);
        } catch (error) {
            console.error("[Sweeper] Error during auto-cleanup:", error);
        }
    }, intervalMs);
};
