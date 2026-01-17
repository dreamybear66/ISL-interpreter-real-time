import { FastifyInstance } from 'fastify';

/**
 * Supported Sentences Routes
 * 
 * Serves mappings for deterministic ISL gloss sentences.
 * Format: { gloss: "GLOSS STRING", words: ["WORD1", "WORD2"] }
 */
export async function supportedSentencesRoutes(fastify: FastifyInstance) {

    fastify.get('/', {
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            gloss: { type: 'string' },
                            words: {
                                type: 'array',
                                items: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const sentences = await fastify.prisma.supportedSentence.findMany({
            select: {
                gloss: true,
                words: true
            }
        });
        return sentences;
    });
}
