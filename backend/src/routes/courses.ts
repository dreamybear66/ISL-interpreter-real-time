import { FastifyInstance } from 'fastify';

export async function coursesRoutes(fastify: FastifyInstance) {
    fastify.get('/', async () => {
        return { courses: [] };
    });
}
