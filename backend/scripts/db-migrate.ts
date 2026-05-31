import 'dotenv/config';
import {
  applyPendingMigrations,
  baselineMigrations,
  getMigrationStatus,
} from '../src/database/migration-runner';

async function main() {
  const command = process.argv[2] ?? 'migrate';

  if (command === 'status') {
    const rows = await getMigrationStatus();
    if (!rows.length) {
      console.log('No migration files found.');
      return;
    }
    for (const row of rows) {
      const marker = row.applied ? 'applied' : 'pending';
      const at = row.appliedAt ? ` (${row.appliedAt})` : '';
      console.log(`[${marker}] ${row.name}${at}`);
    }
    const pending = rows.filter((row) => !row.applied).length;
    console.log(`\n${rows.length - pending} applied, ${pending} pending.`);
    return;
  }

  if (command === 'baseline') {
    const baselined = await baselineMigrations();
    if (!baselined.length) {
      console.log('All migration files were already baselined.');
      return;
    }
    for (const name of baselined) {
      console.log(`  baselined ${name}`);
    }
    console.log(`\nBaselined ${baselined.length} migration(s) without executing SQL.`);
    return;
  }

  if (command === 'migrate') {
    const ran = await applyPendingMigrations();
    if (!ran.length) {
      console.log('No pending migrations.');
      return;
    }
    for (const name of ran) {
      console.log(`  applied ${name}`);
    }
    console.log(`\nApplied ${ran.length} migration(s).`);
    return;
  }

  console.error('Usage: npm run db:migrate[:baseline|:status]');
  process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
