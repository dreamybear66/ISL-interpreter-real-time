import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fp from 'fastify-plugin';

async function corsPlugin(fastify: FastifyInstance) {
    await fastify.register(fastifyCors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    });
}

export const cors = fp(corsPlugin);
