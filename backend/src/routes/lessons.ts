import { FastifyInstance } from 'fastify';

export async function lessonsRoutes(fastify: FastifyInstance) {
    fastify.get('/', async () => {
        return { lessons: [] };
    });
}
