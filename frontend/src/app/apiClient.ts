import { API_BASE_URL } from '../shared/constants';

// API Client configuration
export const apiClient = {
    get: async <T = any>(path: string): Promise<T> => {
        try {
            const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
            console.log(`🌐 [API Client] Fetching: ${url}`);

            if (!url.startsWith(API_BASE_URL)) {
                throw new Error(`Security Error: Unauthorized API Request to ${url}`);
            }

            const response = await fetch(url);
            if (!response.ok) {
                console.error(`❌ [API Client] Status ${response.status} for ${url}`);
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            console.log(`✅ [API Client] Success for ${url}`);
            return data as T;
        } catch (error) {
            console.error('❌ [API Client] Error fetching sign:', error);
            throw error;
        }
    },
    post: async <T = any>(path: string, data: any): Promise<T> => {
        try {
            const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

            if (!url.startsWith(API_BASE_URL)) {
                throw new Error(`Security Error: Unauthorized API Request to ${url}`);
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            return await response.json() as T;
        } catch (error) {
            console.error('API Post Error:', error);
            throw error;
        }
    }
};
