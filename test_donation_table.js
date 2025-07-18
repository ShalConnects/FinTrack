const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDonationTable() {
  try {
    console.log('Testing donation_saving_records table...');
    
    // Test 1: Check if table exists by trying to select from it
    const { data, error } = await supabase
      .from('donation_saving_records')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing donation_saving_records table:', error);
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    console.log('Current records:', data);
    
    // Test 2: Try to insert a test record
    const testRecord = {
      user_id: 'test-user-id',
      transaction_id: 'test-transaction-id',
      type: 'saving',
      amount: 100,
      mode: 'fixed',
      note: 'Test record'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('donation_saving_records')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.error('Error inserting test record:', insertError);
    } else {
      console.log('✅ Test record inserted successfully:', insertData);
      
      // Clean up test record
      await supabase
        .from('donation_saving_records')
        .delete()
        .eq('transaction_id', 'test-transaction-id');
      console.log('✅ Test record cleaned up');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testDonationTable(); 