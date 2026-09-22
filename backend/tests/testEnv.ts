// Must run before any module that reads process.env.DATABASE_URL (e.g. config/prisma.ts)
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'mock';
process.env.UPLOAD_DIR = 'tests/tmp-uploads';
