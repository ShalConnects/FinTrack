import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTriggerWorking() {
  console.log('=== TRIGGER WORKING TEST ===\n');
  
  try {
    // Step 1: Check if trigger exists
    console.log('1. Checking if trigger exists...');
    
    // We'll check by looking for any test records first
    const { data: testRecords, error: testError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('field_name', 'test')
      .limit(5);
    
    if (testError) {
      console.log('❌ Cannot access history table:', testError.message);
      return;
    }
    
    console.log(`✅ History table accessible. Found ${testRecords?.length || 0} test records`);
    
    // Step 2: Get a transaction to test with
    console.log('\n2. Getting a test transaction...');
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('transaction_id, description, amount, category')
      .limit(1);
    
    if (tError || !transactions || transactions.length === 0) {
      console.log('❌ No transactions found:', tError?.message || 'No data');
      return;
    }
    
    const testTransaction = transactions[0];
    console.log(`✅ Found transaction: ${testTransaction.transaction_id}`);
    console.log(`   Description: "${testTransaction.description}"`);
    
    // Step 3: Count records before update
    console.log('\n3. Counting records before update...');
    const { data: beforeHistory, error: beforeError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', testTransaction.transaction_id);
    
    if (beforeError) {
      console.log('❌ Cannot count before history:', beforeError.message);
      return;
    }
    
    const beforeCount = beforeHistory?.length || 0;
    console.log(`✅ Records before update: ${beforeCount}`);
    
    // Step 4: Make a change
    console.log('\n4. Making a change to trigger the function...');
    const newDescription = testTransaction.description + ' (TRIGGER TEST ' + Date.now() + ')';
    
    const { data: updateResult, error: updateError } = await supabase
      .from('transactions')
      .update({ description: newDescription })
      .eq('transaction_id', testTransaction.transaction_id)
      .select();
    
    if (updateError) {
      console.log('❌ Cannot update transaction:', updateError.message);
      return;
    }
    
    console.log('✅ Transaction updated successfully');
    console.log(`   New description: "${newDescription}"`);
    
    // Step 5: Wait and check for new records
    console.log('\n5. Waiting for trigger to fire...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: afterHistory, error: afterError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', testTransaction.transaction_id)
      .order('changed_at', { ascending: false });
    
    if (afterError) {
      console.log('❌ Cannot check after history:', afterError.message);
      return;
    }
    
    const afterCount = afterHistory?.length || 0;
    console.log(`✅ Records after update: ${afterCount}`);
    
    // Step 6: Show results
    if (afterCount > beforeCount) {
      console.log('🎉 SUCCESS! Trigger is working!');
      
      const newRecords = afterHistory.slice(0, afterCount - beforeCount);
      console.log('\nNew records created:');
      newRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. Field: ${record.field_name}`);
        console.log(`      Old: "${record.old_value}"`);
        console.log(`      New: "${record.new_value}"`);
        console.log(`      Time: ${record.changed_at}`);
      });
      
      // Check if we have the test record (function was called)
      const testRecord = newRecords.find(r => r.field_name === 'test');
      if (testRecord) {
        console.log('\n✅ Function is being called (test record found)');
      } else {
        console.log('\n⚠️  Function might not be called (no test record)');
      }
      
    } else {
      console.log('❌ FAILURE! Trigger is not working.');
      console.log('   No new records were created.');
      console.log('   This means the trigger is not firing.');
    }
    
    // Step 7: Revert the change
    console.log('\n6. Reverting the change...');
    const { error: revertError } = await supabase
      .from('transactions')
      .update({ description: testTransaction.description })
      .eq('transaction_id', testTransaction.transaction_id);
    
    if (revertError) {
      console.log('❌ Cannot revert:', revertError.message);
    } else {
      console.log('✅ Change reverted');
    }
    
    // Step 8: Final summary
    console.log('\n=== FINAL RESULT ===');
    if (afterCount > beforeCount) {
      console.log('✅ TRIGGER IS WORKING!');
      console.log('   History tracking is now functional.');
      console.log('   Edit any transaction and check transaction_history table.');
    } else {
      console.log('❌ TRIGGER IS NOT WORKING');
      console.log('   The trigger is not firing when you update transactions.');
      console.log('   Run fix_trigger_guaranteed.sql again.');
    }
    
  } catch (error) {
    console.error('Error in trigger test:', error);
  }
}

testTriggerWorking(); 