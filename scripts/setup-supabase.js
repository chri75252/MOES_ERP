const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigrations() {
  console.log('--- Running SQL Migrations ---');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is missing in .env.local');
    console.error('   Format: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres');
    return false;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  });

  try {
    await client.connect();
    
    const migrationFiles = [
      '001_day1_schema.sql',
      '002_day1_rls.sql',
      '003_storage_policies.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, '../supabase/migrations', file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`▶️ Running ${file}...`);
      await client.query(sql);
      console.log(`✅ ${file} applied.`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    return false;
  } finally {
    await client.end();
  }
}

async function setupStorage() {
  console.log('\n--- Setting up Storage ---');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes('placeholder')) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing/invalid in .env.local');
    return false;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.storage.createBucket('mce-documents', {
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg']
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Bucket "mce-documents" already exists.');
      return true;
    }
    console.error('❌ Storage setup failed:', error.message);
    return false;
  }

  console.log('✅ Bucket "mce-documents" created.');
  return true;
}

async function main() {
  const migrationsOk = await runMigrations();
  const storageOk = await setupStorage();

  if (migrationsOk && storageOk) {
    console.log('\n🎉 Setup complete! You can now run "npm run dev".');
  } else {
    console.log('\n⚠️ Setup completed with errors. Please fix missing variables and try again.');
  }
}

main();
