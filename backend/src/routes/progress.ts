import { FastifyInstance } from 'fastify';

export async function progressRoutes(fastify: FastifyInstance) {
    fastify.get('/', async () => {
        return { progress: {} };
    });
}
