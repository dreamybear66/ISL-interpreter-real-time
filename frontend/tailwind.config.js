/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                isl: {
                    bg: '#F8FAFC',       // Slate-50: Clean Professional Background
                    card: '#FFFFFF',     // White: Crisp Cards
                    primary: '#1E40AF',  // Blue-800: Royal Blue (Header/Buttons)
                    secondary: '#3B82F6',// Blue-500: Vivid Sky Blue (Accents/Icons)
                    accent: '#60A5FA',   // Blue-400: Soft Highlight
                    text: {
                        primary: '#0F172A',   // Slate-900: Deep Dark Text
                        secondary: '#475569', // Slate-600: Muted Text
                        light: '#F1F5F9'      // Slate-100: Text on Dark Backgrounds
                    }
                }
            },
            borderRadius: {
                '3xl': '1.5rem',
                'xl': '0.75rem',
            }
        },
    },
    plugins: [],
}
