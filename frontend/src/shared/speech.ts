// Web Speech API interfaces for TypeScript
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

/**
 * Normalizes text per project requirements:
 * - lowercase
 * - remove punctuation
 * - trim extra spaces
 */
export const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
};

export const speechService = {
    recognition: SpeechRecognition ? new SpeechRecognition() : null,

    init: (onResult: (text: string) => void, onError: (err: string) => void) => {
        if (!speechService.recognition) {
            onError('Speech Recognition not supported in this browser.');
            return;
        }

        speechService.recognition.continuous = true;
        speechService.recognition.interimResults = true;
        speechService.recognition.lang = 'en-US';

        speechService.recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                onResult(normalizeText(finalTranscript));
            }
        };

        speechService.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            onError(event.error);
        };
    },

    start: () => {
        if (speechService.recognition) {
            try {
                speechService.recognition.start();
            } catch (err) {
                console.error('Speech start error:', err);
            }
        }
    },

    stop: () => {
        if (speechService.recognition) {
            speechService.recognition.stop();
        }
    }
};
