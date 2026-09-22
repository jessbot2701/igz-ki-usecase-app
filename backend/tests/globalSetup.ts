import { execSync } from 'node:child_process';

// Runs once before the whole test suite: builds the SQLite test schema via Prisma
export default function globalSetup(): void {
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: __dirname + '/..',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit'
  });
}
