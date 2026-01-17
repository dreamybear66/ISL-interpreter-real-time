// Authentication logic
export const auth = {
    login: async () => {
        console.log('Logging in...');
        return { id: '1', name: 'User' };
    },
    logout: async () => {
        console.log('Logging out...');
    },
    getUser: () => {
        return null;
    },
};
