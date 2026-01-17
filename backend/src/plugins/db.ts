import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fs from 'fs';
import path from 'path';

// Mocking PrismaClient type and class to resolve generation issues in restricted environments

/**
 * Minimal interface for PrismaClient to maintain basic type safety during mocking.
 */
interface IPrismaClient {
    sign: {
        findMany: (args?: any) => Promise<any[]>;
        findFirst: (args?: any) => Promise<any | null>;
    };
    supportedSentence: {
        findMany: (args?: any) => Promise<any[]>;
    };
    $connect: () => Promise<void>;
    $disconnect: () => Promise<void>;
}

/**
 * Fallback PrismaClient if generation hasn't happened yet.
 */
class PrismaClientMock implements IPrismaClient {
    private signsData: any[] = [];
    private dbLoaded = false;

    private loadData() {
        if (this.dbLoaded) return;
        const dbPath = path.join(process.cwd(), 'backend', 'src', 'data', 'signs.json');
        if (fs.existsSync(dbPath)) {
            try {
                this.signsData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
                console.log(`✅ [Mock DB] Loaded ${this.signsData.length} signs from JSON.`);
            } catch (err) {
                console.error('❌ [Mock DB] Failed to parse signs.json:', err);
            }
        }
        this.dbLoaded = true;
    }

    sign = {
        findMany: async (args?: any) => {
            this.loadData();
            return this.signsData;
        },
        findFirst: async (args?: any) => {
            this.loadData();
            if (args?.where?.word?.equals) {
                const searchWord = args.where.word.equals.toUpperCase();
                return this.signsData.find(s => s.word === searchWord) || null;
            }
            return null;
        },
    };
    supportedSentence = {
        findMany: async () => [],
    };
    $connect = async () => {
        console.warn('⚠️ [Prisma] Using Mock Client: Loading data from local JSON fallback.');
        this.loadData();
    };
    $disconnect = async () => { };
}

declare module 'fastify' {
    interface FastifyInstance {
        prisma: IPrismaClient;
    }
}

async function prismaPlugin(fastify: FastifyInstance) {
    const isProd = process.env.NODE_ENV === 'production';
    let PrismaConstructor: (new () => IPrismaClient) | null = null;

    try {
        // Try to load the generated client dynamically
        // @ts-ignore
        const { PrismaClient } = await import('@prisma/client');
        if (PrismaClient) {
            PrismaConstructor = PrismaClient as unknown as new () => IPrismaClient;
        }
    } catch (err) {
        if (isProd) {
            throw new Error('[Prisma] Database client missing in production environment. Run "npx prisma generate".');
        }
        console.warn('⚠️ [Prisma] Could not load @prisma/client, falling back to mock.');
    }

    if (!PrismaConstructor) {
        PrismaConstructor = PrismaClientMock;
    }

    const prisma = new PrismaConstructor();

    await prisma.$connect();

    fastify.decorate('prisma', prisma);

    fastify.addHook('onClose', async (fastifyInstance) => {
        await fastifyInstance.prisma.$disconnect();
    });
}

export const dbPlugin = fp(prismaPlugin);
