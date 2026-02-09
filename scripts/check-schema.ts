
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables manually
const envPath = path.join(process.cwd(), '.env.local');
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...values] = trimmed.split('=');
            const value = values.join('=').trim().replace(/^['"]|['"]$/g, '');
            if (key && value) {
                process.env[key.trim()] = value;
            }
        }
    });
} catch (err) {
    console.warn('⚠️  Could not read .env.local file');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('Checking if Partial COD columns exist in "orders" table...');

    const { data, error } = await supabase
        .from('orders')
        .select('payment_mode, advance_payment_amount, remaining_balance, is_partial_payment')
        .limit(1);

    if (error) {
        if (error.message.includes('does not exist') || error.code === '42703') { // 42703 is undefined_column
            console.log('❌ Partial COD columns do NOT exist yet.');
            console.log('   Please run the migration SQL manually.');
        } else {
            console.error('❌ Error checking schema:', error.message);
        }
    } else {
        console.log('✅ Partial COD columns exist! Migration has been applied.');
    }
}

checkSchema();
