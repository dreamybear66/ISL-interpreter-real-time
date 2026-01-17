import React, { useState, useEffect, useCallback } from 'react';
import { speechService } from '../../shared/speech';
import { convertToGloss } from '../../shared/textToGloss';
import { apiClient } from '../../app/apiClient';
import { matchSentence } from './SentenceMatcher';
import VideoSequence from './VideoSequence';

type InterpreterStatus = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'PLAYING' | 'ERROR';

/**
 * SpeechInput Component
 * 
 * Orchestrates the real-time ISL interpreter flow:
 * 1. Listening: Captures user speech via Web Speech API.
 * 2. Glossing: Converts English transcript to ISL Gloss.
 * 3. Matching: Checks if the gloss matches a supported sentence.
 * 4. Fetching: Retrieves sign video URLs from backend API.
 * 5. Playback: Triggers word-by-word video playback if matched.
 */
const SpeechInput: React.FC = () => {
    const [status, setStatus] = useState<InterpreterStatus>('IDLE');
    const [transcription, setTranscription] = useState('');
    const [gloss, setGloss] = useState('');
    const [matchedWords, setMatchedWords] = useState<string[] | null>(null);
    const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [error, setError] = useState<string | null>(null);

    const handleSpeechResult = useCallback(async (text: string) => {
        setTranscription(text);
        setStatus('PROCESSING');

        // Step 2: Convert to Gloss
        const resultGloss = convertToGloss(text);
        setGloss(resultGloss);

        // Step 3: Match Sentence
        const words = matchSentence(resultGloss);
        if (words) {
            try {
                // Step 4: Fetch Metadata for each word from Backend
                const urlMap: Record<string, string> = {};
                const validWords: string[] = [];

                for (const word of words) {
                    try {
                        const signMetadata = await apiClient.get<{ videoUrl: string }>(`/signs/${word}`);
                        urlMap[word] = signMetadata.videoUrl;
                        validWords.push(word);
                    } catch (err) {
                        console.warn(`Sign not found for word: ${word}. Skipping...`);
                    }
                }

                if (validWords.length > 0) {
                    setVideoUrls(urlMap);
                    setMatchedWords(validWords);
                    setStatus('PLAYING');
                } else {
                    setError('None of the signs in this sentence are currently available. Please check the browser console (F12) for network errors.');
                    setStatus('IDLE');
                }
            } catch (err) {
                console.error('Sign metadata error:', err);
                setError('Failed to load sign videos. Please ensure the backend is running.');
                setStatus('IDLE');
            }
        } else {
            setError('One or more words in this sentence are not currently supported by the interpreter library.');
            setStatus('IDLE');
        }
    }, []);

    const handleSpeechError = useCallback((err: string) => {
        setError(`Speech Error: ${err}`);
        setStatus('IDLE');
    }, []);

    useEffect(() => {
        speechService.init(handleSpeechResult, handleSpeechError);
    }, [handleSpeechResult, handleSpeechError]);

    const toggleListening = () => {
        if (status === 'LISTENING') {
            speechService.stop();
            setStatus('IDLE');
        } else {
            setError(null);
            setTranscription('');
            setGloss('');
            setMatchedWords(null);
            setCurrentWordIndex(-1);
            speechService.start();
            setStatus('LISTENING');
        }
    };

    const handlePlaybackComplete = () => {
        setStatus('IDLE');
        setCurrentWordIndex(-1);
    };

    const handlePlaybackProgress = (index: number) => {
        setCurrentWordIndex(index);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-4xl mx-auto p-6 space-y-8">
            {/* Visual Feedback / State Indicator */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black text-isl-text-primary uppercase tracking-tight">ISL Interpreter</h1>
                <p className="text-isl-text-secondary font-medium uppercase tracking-widest text-xs">Voice to Sign Sequence</p>
            </div>

            {/* Playback Area */}
            <div className="w-full min-h-[300px] flex items-center justify-center bg-white rounded-3xl shadow-2xl p-4 transition-all duration-500">
                {status === 'PLAYING' && matchedWords ? (
                    <VideoSequence
                        words={matchedWords}
                        videoUrls={videoUrls}
                        onProgress={handlePlaybackProgress}
                        onComplete={handlePlaybackComplete}
                    />
                ) : (
                    <div className="text-center space-y-4">
                        {status === 'LISTENING' ? (
                            <div className="space-y-4">
                                <div className="flex justify-center gap-1">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`w-3 h-3 bg-isl-primary rounded-full animate-bounce delay-${i * 100}`} />
                                    ))}
                                </div>
                                <p className="text-isl-primary font-bold animate-pulse text-lg">Listening carefully...</p>
                            </div>
                        ) : status === 'PROCESSING' ? (
                            <div className="space-y-4 text-center">
                                <div className="w-12 h-12 border-4 border-isl-primary border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-isl-text-secondary font-bold">Processing Gloss...</p>
                            </div>
                        ) : (
                            <div className="p-8 border-4 border-dashed border-isl-card rounded-3xl">
                                <p className="text-isl-text-secondary font-medium">Ready to interpret</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Real-time Transcription Display */}
            {(transcription || gloss) && (
                <div className="w-full flex gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex-1 p-4 bg-isl-card rounded-2xl border-b-4 border-isl-secondary/30">
                        <span className="text-[10px] font-bold text-isl-text-secondary uppercase">You Said (English)</span>
                        <p className="text-lg font-semibold text-isl-text-primary mt-1 capitalize">{transcription || '...'}</p>
                    </div>
                    <div className="flex-1 p-4 bg-isl-primary/10 rounded-2xl border-b-4 border-isl-primary/30">
                        <span className="text-[10px] font-bold text-isl-primary uppercase">Interpreter Sees (ISL Gloss)</span>
                        <p className="text-lg font-black text-isl-primary mt-1">
                            {matchedWords && currentWordIndex >= 0
                                ? matchedWords.slice(0, currentWordIndex + 1).join(' ')
                                : gloss || '...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="w-full p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 font-medium">
                    {error}
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col items-center gap-4">
                <button
                    disabled={status === 'PROCESSING'}
                    onClick={toggleListening}
                    className={`group flex items-center gap-4 px-10 py-5 rounded-full text-xl font-black shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${status === 'LISTENING'
                        ? 'bg-red-500 text-white hover:bg-red-600 scale-105 ring-8 ring-red-500/20'
                        : 'bg-isl-primary text-white hover:bg-isl-primary/90 hover:shadow-2xl'
                        }`}
                >
                    {status === 'LISTENING' ? (
                        <>
                            <div className="w-4 h-4 bg-white rounded-sm animate-pulse" />
                            STOP LISTENING
                        </>
                    ) : (
                        <>
                            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </svg>
                            TAP TO SPEAK
                        </>
                    )}
                </button>

            </div>
        </div>
    );
};

export default SpeechInput;
