import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbPlugin } from './plugins/db';
import { cors as corsPlugin } from './plugins/cors';
import { coursesRoutes } from './routes/courses';
import { lessonsRoutes } from './routes/lessons';
import { progressRoutes } from './routes/progress';
import { signsRoutes } from './routes/signs';
import { supportedSentencesRoutes } from './routes/supported-sentences';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
    logger: true
});

const start = async () => {
    try {
        // Register Plugins
        await fastify.register(dbPlugin);
        await fastify.register(corsPlugin);

        // Serve WLASL Videos
        await fastify.register(fastifyStatic, {
            root: path.join(__dirname, '../public/videos'),
            prefix: '/videos/',
        });

        // Register Routes
        await fastify.register(coursesRoutes, { prefix: '/api/courses' });
        await fastify.register(lessonsRoutes, { prefix: '/api/lessons' });
        await fastify.register(progressRoutes, { prefix: '/api/progress' });
        await fastify.register(signsRoutes, { prefix: '/api/signs' });
        await fastify.register(supportedSentencesRoutes, { prefix: '/api/supported-sentences' });

        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server is running on http://localhost:3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
