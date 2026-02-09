
import fs from 'fs';
import path from 'path';

// This script outputs the SQL migration instructions


async function runMigration() {
    const migrationPath = path.join(process.cwd(), 'modules/order/migrations/002_add_partial_cod.sql');

    console.log('\n=== Database Migration Required ===\n');
    console.log('To enable Partial COD support, you need to execute the following SQL migration on your Supabase database:');
    console.log(`\nFile: ${migrationPath}\n`);

    try {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log('--- SQL CONTENT START ---');
        console.log(sql);
        console.log('--- SQL CONTENT END ---\n');
        console.log('Please copy the SQL content above and run it in your Supabase SQL Editor.');
        console.log('Dashboard URL: https://app.supabase.com/project/_/sql\n');
    } catch (error) {
        console.error(`Error reading migration file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

runMigration().catch(console.error);
