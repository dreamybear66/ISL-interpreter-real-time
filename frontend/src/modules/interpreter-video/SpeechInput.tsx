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
        <div className="min-h-screen w-full bg-isl-bg dark:bg-slate-900 flex flex-col font-sans selection:bg-isl-primary/20 text-isl-text-primary dark:text-isl-text-light transition-colors duration-500">

            {/* 1. Fixed Navigation Header */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-isl-primary dark:bg-slate-950 shadow-md z-50 flex items-center justify-between px-6 md:px-12 animate-in fade-in slide-in-from-top-4 duration-500">
                {/* Left: Branding */}
                <div className="flex flex-col items-start select-none cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.location.reload()}>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">
                        ISL INTERPRETER
                    </h1>
                    <p className="text-blue-200 dark:text-slate-400 font-bold uppercase tracking-[0.15em] text-[10px] mt-1">
                        Voice to Sign Sequence
                    </p>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-6">
                    {/* Home Tab */}
                    <button
                        onClick={() => window.location.reload()}
                        className="hidden md:flex items-center gap-2 text-sm font-bold text-blue-100 dark:text-slate-300 hover:text-white dark:hover:text-white uppercase tracking-wider transition-colors bg-white/10 px-4 py-2 rounded-full hover:bg-white/20"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Home
                    </button>
                    {/* Dark Mode Toggle Removed as requested */}
                </div>
            </header>

            {/* Main Content Wrapper - Added Top Padding for Fixed Header */}
            <div className="flex-1 w-full pt-28 px-6 md:px-12 pb-12 overflow-y-auto">

                {/* 1.5 Process Flow Indicator - Centered below header */}
                <div className="w-full max-w-3xl mx-auto mb-12 flex items-center justify-between px-4">
                    {/* Step 1 */}
                    <div className={`group flex flex-col items-center gap-2 transition-all duration-300 ${status === 'LISTENING' ? 'scale-110 text-isl-primary dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-slate-600 font-medium'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 shadow-sm transition-colors ${status === 'LISTENING' ? 'bg-isl-primary border-isl-primary text-white' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                            {status === 'LISTENING' ? (
                                <span className="animate-pulse">●</span>
                            ) : 1}
                        </div>
                        <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase">Listening</span>
                    </div>

                    {/* Connector 1 */}
                    <div className="flex-1 h-0.5 mx-4 relative bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`absolute inset-0 bg-isl-secondary transition-all duration-700 ${status === 'PROCESSING' || status === 'PLAYING' ? 'w-full' : 'w-0'}`} />
                    </div>

                    {/* Step 2 */}
                    <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${status === 'PROCESSING' ? 'scale-110 text-isl-primary dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-slate-600 font-medium'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 shadow-sm transition-colors ${status === 'PROCESSING' ? 'bg-isl-primary border-isl-primary text-white' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                            {status === 'PROCESSING' ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : 2}
                        </div>
                        <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase">Processing</span>
                    </div>

                    {/* Connector 2 */}
                    <div className="flex-1 h-0.5 mx-4 relative bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`absolute inset-0 bg-isl-secondary transition-all duration-700 ${status === 'PLAYING' ? 'w-full' : 'w-0'}`} />
                    </div>

                    {/* Step 3 */}
                    <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${status === 'PLAYING' ? 'scale-110 text-isl-primary dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-slate-600 font-medium'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 shadow-sm transition-colors ${status === 'PLAYING' ? 'bg-isl-primary border-isl-primary text-white' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                            {status === 'PLAYING' ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            ) : 3}
                        </div>
                        <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase">Signing</span>
                    </div>
                </div>



                {/* Main Grid Content */}
                <main className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start max-w-[1600px]">

                    {/* 2. Left Section: Controls & Transcripts */}
                    <section className="flex flex-col gap-6 order-2 lg:order-1 justify-start w-full max-w-xl mx-auto lg:mx-0">

                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white tracking-tight">Voice Input</h2>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${status === 'IDLE' ? 'bg-white/10 text-slate-300 border border-white/10' :
                                    status === 'LISTENING' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                        status === 'PROCESSING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${status === 'IDLE' ? 'bg-slate-400' :
                                        status === 'LISTENING' ? 'bg-rose-500 animate-pulse' :
                                            status === 'PROCESSING' ? 'bg-amber-500 animate-bounce' :
                                                'bg-emerald-500'
                                    }`} />
                                {status}
                            </div>
                        </div>

                        {/* Primary Control: Tap to Speak */}
                        <div className="w-full">
                            <button
                                disabled={status === 'PROCESSING'}
                                onClick={toggleListening}
                                className={`group relative flex items-center justify-center gap-3 w-full py-6 rounded-2xl text-xl font-bold shadow-lg shadow-blue-900/10 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-xl ${status === 'LISTENING'
                                    ? 'bg-rose-500 text-white shadow-rose-500/30'
                                    : 'bg-isl-primary text-white hover:bg-blue-700'
                                    }`}
                            >
                                {status === 'LISTENING' ? (
                                    <>
                                        <div className="relative flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                                        </div>
                                        <span className="tracking-widest text-sm uppercase">Listening...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-6 h-6 fill-current opacity-90 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                        </svg>
                                        <span className="tracking-wider">TAP TO SPEAK</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Feedback Cards Stack */}
                        <div className="flex flex-col gap-6">

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    {error}
                                </div>
                            )}

                            {/* Transcription Box (English) */}
                            <div className="group relative p-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 min-h-[140px] flex flex-col transition-all duration-500 hover:shadow-lg hover:border-blue-300 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none font-sans">English Input</span>
                                    <div className="flex gap-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-blue-400 transition-colors duration-300" />
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-blue-400 transition-colors duration-500 delay-75" />
                                    </div>
                                </div>
                                <div className="flex-1 flex items-center relative z-10">
                                    <p className="text-xl md:text-2xl font-medium text-slate-800 capitalize leading-relaxed w-full text-left font-sans tracking-tight">
                                        {transcription ? (
                                            <span className="animate-in fade-in slide-in-from-left-2 duration-500">{transcription}</span>
                                        ) : (
                                            <span className="text-slate-400 font-normal text-lg flex items-center gap-2">
                                                Tap microphone to speak...
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Gloss Box (ISL) */}
                            <div className="group relative p-6 bg-gradient-to-br from-blue-50/80 to-white/90 backdrop-blur-xl rounded-2xl shadow-md border border-blue-100 min-h-[140px] flex flex-col transition-all duration-500 hover:shadow-blue-200/50 hover:border-blue-300 relative overflow-hidden ring-1 ring-transparent hover:ring-blue-100">
                                {/* Decorative Grid Background */}
                                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

                                {/* Decorative Icon */}
                                <div className="absolute -bottom-6 -right-6 text-blue-100 opacity-20 transform rotate-12 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                                    <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M9 11.75c-0.41 0-0.75-0.34-0.75-0.75V7c0-0.55 0.45-1 1-1s1 0.45 1 1v4c0 0.41-0.34 0.75-0.75 0.75zM12.75 11.75c-0.41 0-0.75-0.34-0.75-0.75V5.5c0-0.55 0.45-1 1-1s1 0.45 1 1v5.5c0 0.41-0.34 0.75-0.75 0.75zM16.5 11.75c-0.41 0-0.75-0.34-0.75-0.75V7c0-0.55 0.45-1 1-1s1 0.45 1 1v4c0 0.41-0.34 0.75-0.75 0.75zM21 2H2v20h19V2z m-2 18H5V4h14v16z" /></svg>
                                </div>

                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest select-none flex items-center gap-2 font-sans">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"></span>
                                        Interpreter Output (ISL)
                                    </span>
                                </div>

                                <div className="flex-1 flex items-center relative z-10 w-full pl-1">
                                    <p className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-500 leading-relaxed w-full break-normal text-left font-mono tracking-tight">
                                        {matchedWords && currentWordIndex >= 0 ? (
                                            <>
                                                <span className="opacity-30 blur-[1px] grayscale transition-all duration-300">{matchedWords.slice(0, currentWordIndex).join(' ')}</span>
                                                {' '}
                                                <span className="inline-block relative">
                                                    <span className="absolute -inset-1 bg-blue-100 blur-sm rounded-lg opacity-50 animate-pulse"></span>
                                                    <span className="relative z-10 text-blue-600 border-b-2 border-blue-400 pb-0.5 scale-110 transition-all duration-200 inline-block">{matchedWords[currentWordIndex]}</span>
                                                </span>
                                                {' '}
                                                <span className="opacity-30 blur-[1px] grayscale transition-all duration-300">{matchedWords.slice(currentWordIndex + 1).join(' ')}</span>
                                            </>
                                        ) : (
                                            gloss ? (
                                                <span className="animate-in fade-in slide-in-from-bottom-2 duration-700">{gloss}</span>
                                            ) : (
                                                <span className="text-blue-400/60 font-medium text-lg font-sans">
                                                    Translation will appear here...
                                                </span>
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Supported Sentences Panel */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-blue-100 text-blue-700 p-1 rounded"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></span>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supported Sentences (Demo)</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {['Hello', 'I like computer', 'Where is the library', 'Nice to meet you', 'What is your name', 'Good morning'].map((phrase) => (
                                        <div
                                            key={phrase}
                                            className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm flex items-center justify-between group hover:border-isl-secondary/50 hover:shadow-md transition-all duration-200"
                                        >
                                            <span>"{phrase}"</span>
                                            <span className="text-[10px] text-slate-300 group-hover:text-isl-secondary transition-colors">Try</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Right Section: Video Player */}
                    <section className="order-1 lg:order-2 w-full h-full flex flex-col justify-start lg:pl-0">
                        {/* Video Container */}
                        <div className="w-full aspect-video lg:aspect-[4/3] xl:aspect-video h-auto max-h-[600px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group transition-all duration-500">

                            {/* Inner Video Area */}
                            {status === 'PLAYING' && matchedWords ? (
                                <VideoSequence
                                    words={matchedWords}
                                    videoUrls={videoUrls}
                                    onProgress={handlePlaybackProgress}
                                    onComplete={handlePlaybackComplete}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-colors duration-500">
                                    {status === 'LISTENING' ? (
                                        <div className="space-y-6 animate-in fade-in zoom-in duration-300 text-center">
                                            <div className="relative mx-auto w-24 h-24">
                                                <span className="absolute inset-0 rounded-full animate-ping bg-rose-500/20"></span>
                                                <div className="relative w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center border border-rose-100 dark:border-rose-800">
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="w-1.5 h-6 bg-rose-500 rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: `${i * 100}ms` }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-rose-500 font-bold tracking-wide">Listening to you...</p>
                                        </div>
                                    ) : status === 'PROCESSING' ? (
                                        <div className="space-y-6 animate-in fade-in zoom-in duration-300 text-center">
                                            <div className="w-20 h-20 border-4 border-isl-primary/20 border-t-isl-primary rounded-full animate-spin mx-auto" />
                                            <p className="text-isl-primary dark:text-blue-400 font-bold tracking-wide">Translating...</p>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col justify-center items-start pl-12 md:pl-20 text-left space-y-6 opacity-60 group-hover:opacity-100 transition-all duration-500">
                                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-600 shadow-inner">
                                                <svg className="w-10 h-10 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-slate-800 dark:text-white font-bold text-3xl mb-2 tracking-tight">Ready to Interpret</h3>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-[240px] leading-relaxed">
                                                    Your sign language output will be shown here.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                </main>
            </div>
        </div>
    );

};

export default SpeechInput;
