import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const backendRoot = join(__dirname, '..');
const source = join(backendRoot, '..', 'supabase', 'migrations');
const target = join(backendRoot, 'supabase', 'migrations');

if (!existsSync(source)) {
  console.error(`Migration source not found: ${source}`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`Synced migrations to ${target}`);
