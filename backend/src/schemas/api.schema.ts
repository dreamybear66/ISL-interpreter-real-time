export const apiSchemas = {
    courseSchema: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            title: { type: 'string' },
        },
    },
    lessonSchema: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
        },
    },
};
