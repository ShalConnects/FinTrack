import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTriggerSimple() {
  console.log('=== SIMPLE TRIGGER TEST ===\n');
  
  try {
    // Step 1: Get a transaction
    console.log('1. Getting a transaction...');
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('transaction_id, description')
      .limit(1);
    
    if (tError || !transactions || transactions.length === 0) {
      console.log('❌ No transactions found');
      return;
    }
    
    const transaction = transactions[0];
    console.log(`✅ Found transaction: ${transaction.transaction_id}`);
    console.log(`   Description: "${transaction.description}"`);
    
    // Step 2: Count history records before
    console.log('\n2. Counting history records before...');
    const { data: beforeHistory, error: beforeError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', transaction.transaction_id);
    
    if (beforeError) {
      console.log('❌ Cannot count history:', beforeError.message);
      return;
    }
    
    const beforeCount = beforeHistory?.length || 0;
    console.log(`✅ History records before: ${beforeCount}`);
    
    // Step 3: Update the transaction
    console.log('\n3. Updating transaction...');
    const newDescription = transaction.description + ' (TEST ' + Date.now() + ')';
    
    const { data: updateResult, error: updateError } = await supabase
      .from('transactions')
      .update({ description: newDescription })
      .eq('transaction_id', transaction.transaction_id);
    
    if (updateError) {
      console.log('❌ Update failed:', updateError.message);
      return;
    }
    
    console.log('✅ Transaction updated');
    console.log(`   New description: "${newDescription}"`);
    
    // Step 4: Wait and check history
    console.log('\n4. Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: afterHistory, error: afterError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', transaction.transaction_id)
      .order('changed_at', { ascending: false });
    
    if (afterError) {
      console.log('❌ Cannot check after history:', afterError.message);
      return;
    }
    
    const afterCount = afterHistory?.length || 0;
    console.log(`✅ History records after: ${afterCount}`);
    
    // Step 5: Show results
    if (afterCount > beforeCount) {
      console.log('🎉 SUCCESS! Trigger is working!');
      
      const newRecords = afterHistory.slice(0, afterCount - beforeCount);
      console.log('\nNew records:');
      newRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.field_name}: "${record.old_value}" → "${record.new_value}"`);
      });
    } else {
      console.log('❌ FAILURE! No new history records.');
      console.log('   The trigger exists but is not working.');
      
      // Let's check if we can insert manually
      console.log('\n5. Testing manual insert...');
      const { data: manualInsert, error: manualError } = await supabase
        .from('transaction_history')
        .insert({
          transaction_id: transaction.transaction_id,
          field_name: 'manual_test',
          old_value: 'test_old',
          new_value: 'test_new'
        })
        .select();
      
      if (manualError) {
        console.log('❌ Manual insert failed:', manualError.message);
        console.log('   This suggests a permissions or RLS issue.');
      } else {
        console.log('✅ Manual insert worked');
        console.log('   The issue is with the trigger function, not the table.');
      }
    }
    
    // Step 6: Revert
    console.log('\n6. Reverting change...');
    await supabase
      .from('transactions')
      .update({ description: transaction.description })
      .eq('transaction_id', transaction.transaction_id);
    
    console.log('✅ Change reverted');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testTriggerSimple(); 