/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                isl: {
                    bg: '#FFF9F2',
                    card: '#FEF0E1',
                    primary: '#E9692C',
                    secondary: '#FBD894',
                    text: {
                        primary: '#4B4B4B',
                        secondary: '#777777',
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
