import React, { useState, useRef, useEffect } from 'react';
import { videoCache, isValidSignUrl } from './CacheManager';

interface VideoSequenceProps {
    words: string[];
    videoUrls: Record<string, string>; // Maps word to its CDN URL
    onProgress?: (index: number) => void;
    onComplete?: () => void;
}

/**
 * VideoSequence Component
 * 
 * Plays a sequence of sign language videos one after another.
 * Rules:
 * - Sequential playback based on words array.
 * - Move to next on 'ended'.
 * - Show progress (X / Total).
 * - Preload all videos in the background.
 */
const VideoSequence: React.FC<VideoSequenceProps> = ({ words, videoUrls, onProgress, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Preload all videos in the sequence immediately
    useEffect(() => {
        const urls = words.map(word => videoUrls[word]).filter(Boolean);
        videoCache.preload(urls);
    }, [words, videoUrls]);

    // Notify parent of progress
    useEffect(() => {
        if (onProgress) onProgress(currentIndex);
    }, [currentIndex, onProgress]);

    // Handle video ended event
    const handleEnded = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            if (onComplete) onComplete();
        }
    };

    const currentWord = words[currentIndex];
    const currentUrl = videoUrls[currentWord];

    // If URL is missing or invalid, showing a placeholder state
    if (!currentUrl || !isValidSignUrl(currentUrl)) {
        return (
            <div className="flex items-center justify-center p-8 bg-isl-card rounded-3xl border-2 border-dashed border-isl-primary/20">
                <p className="text-isl-text-secondary">Waiting for signs...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            {/* Video Container */}
            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-xl border-4 border-isl-card">
                <video
                    ref={videoRef}
                    key={currentUrl} // Key change forces re-render/reload for new source
                    src={currentUrl}
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleEnded}
                    className="w-full h-full object-cover"
                />

                {/* Overlay Progress */}
                <div className="absolute bottom-4 right-4 bg-isl-primary/90 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    {currentIndex + 1} / {words.length}
                </div>
            </div>

            {/* Current Word Indicator */}
            <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-isl-text-secondary uppercase tracking-widest">Playing Sign</span>
                <h2 className="text-3xl font-bold text-isl-primary uppercase mt-1">{currentWord}</h2>
            </div>

            {/* Sequence Bar */}
            <div className="flex gap-2 justify-center mt-4">
                {words.map((word, idx) => (
                    <div
                        key={`${word}-${idx}`}
                        className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-isl-primary' : idx < currentIndex ? 'w-4 bg-isl-primary/40' : 'w-4 bg-isl-card'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default VideoSequence;
