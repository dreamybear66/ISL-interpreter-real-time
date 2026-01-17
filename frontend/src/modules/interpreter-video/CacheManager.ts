/**
 * Video Cache Manager
 * 
 * Handles preloading and validation of sign language videos.
 */

export const isValidSignUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        // Strict requirement: https or http for local
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
};

class CacheManager {
    private cache: Map<string, HTMLVideoElement> = new Map();
    private readonly MAX_CACHE_SIZE = 50;
    private accessOrder: Set<string> = new Set();

    /**
     * Preloads a list of video URLs.
     * 
     * @param urls - Array of video URLs to preload.
     */
    preload(urls: string[]): void {
        const uniqueUrls = Array.from(new Set(urls));
        uniqueUrls.forEach(url => {
            if (!isValidSignUrl(url)) {
                console.warn('Skipping invalid sign URL:', url);
                return;
            }

            if (this.cache.has(url)) {
                // Refresh order: delete and re-add to move to end (MRU)
                this.accessOrder.delete(url);
                this.accessOrder.add(url);
                return;
            }

            // Enforce cache limit (LRU)
            if (this.cache.size >= this.MAX_CACHE_SIZE) {
                const oldestUrl = this.accessOrder.values().next().value;
                if (oldestUrl) {
                    this.cache.delete(oldestUrl);
                    this.accessOrder.delete(oldestUrl);
                }
            }

            const video = document.createElement('video');
            video.src = url;
            video.preload = 'auto';
            this.cache.set(url, video);
            this.accessOrder.add(url);
        });
    }

    /**
     * Checks if a video is already cached.
     */
    isCached(url: string): boolean {
        return this.cache.has(url);
    }

    /**
     * Clears old cache to prevent memory leaks if the list grows too large.
     */
    clear(): void {
        this.cache.clear();
        this.accessOrder.clear();
    }
}

export const videoCache = new CacheManager();
