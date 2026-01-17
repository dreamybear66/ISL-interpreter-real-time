import { FastifyInstance } from 'fastify';

/**
 * Sign Routes
 * 
 * Serving metadata for sign language words.
 * Backend only serves metadata + CDN URLs. No video processing.
 */
export async function signsRoutes(fastify: FastifyInstance) {

    // GET /api/signs - List all signs
    fastify.get('/', {
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            word: { type: 'string' },
                            videoUrl: { type: 'string' },
                            durationMs: { type: 'number' },
                            dominantHand: { type: 'string' }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const signs = await fastify.prisma.sign.findMany({
            select: {
                word: true,
                videoUrl: true,
                durationMs: true,
                dominantHand: true
            }
        });
        return signs;
    });

    // GET /api/signs/:word - Lookup a single sign (case-insensitive)
    fastify.get('/:word', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    word: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        word: { type: 'string' },
                        videoUrl: { type: 'string' },
                        durationMs: { type: 'number' },
                        dominantHand: { type: 'string' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const { word } = request.params as { word: string };
        console.log(`🔍 [API] Fetching sign for: "${word}"`);

        const sign = await fastify.prisma.sign.findFirst({
            where: {
                word: {
                    equals: word.toUpperCase(),
                    mode: 'insensitive'
                }
            }
        });

        if (!sign) {
            console.warn(`❌ [API] Sign for "${word}" NOT FOUND.`);
            return reply.code(404).send({
                error: 'Not Found',
                message: `Sign for word '${word}' not found.`
            });
        }

        console.log(`✅ [API] Found sign for: "${word}"`);
        return sign;
    });
}
