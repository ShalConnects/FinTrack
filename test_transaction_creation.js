import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTransactionCreation() {
  console.log('🧪 TESTING TRANSACTION CREATION AND EDITING\n');
  
  try {
    // Step 1: Check if we can create a transaction
    console.log('=== STEP 1: CREATING A TEST TRANSACTION ===');
    
    // First, let's check if there are any accounts to use
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, currency')
      .limit(1);
    
    if (accountsError) {
      console.log('❌ Error accessing accounts:', accountsError.message);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('❌ No accounts found. Cannot create transaction without an account.');
      return;
    }
    
    const testAccount = accounts[0];
    console.log(`✅ Using account: ${testAccount.name} (${testAccount.currency})`);
    
    // Create a test transaction
    const testTransaction = {
      account_id: testAccount.id,
      amount: 100.00,
      type: 'expense',
      category: 'Food',
      description: 'Test transaction for UUID mismatch diagnosis',
      date: new Date().toISOString().split('T')[0],
      tags: ['test'],
      user_id: 'test-user-id', // This might need to be a real user ID
      transaction_id: 'F1234567' // Test with the new format
    };
    
    console.log('Creating transaction with data:', testTransaction);
    
    const { data: createdTransaction, error: createError } = await supabase
      .from('transactions')
      .insert(testTransaction)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating transaction:', createError.message);
      console.log('This might be due to authentication or missing user_id');
      return;
    }
    
    console.log('✅ Transaction created successfully:', createdTransaction.id);
    
    // Step 2: Test editing the transaction (this is where the error likely occurs)
    console.log('\n=== STEP 2: TESTING TRANSACTION EDITING ===');
    
    const updateData = {
      amount: 150.00,
      description: 'Updated test transaction',
      updated_at: new Date().toISOString()
    };
    
    console.log('Updating transaction with data:', updateData);
    
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', createdTransaction.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Error updating transaction:', updateError.message);
    } else {
      console.log('✅ Transaction updated successfully');
      
      // Step 3: Test the purchase update that's likely causing the UUID mismatch
      console.log('\n=== STEP 3: TESTING PURCHASE UPDATE (LIKELY FAILURE POINT) ===');
      
      console.log(`Testing purchase update with transaction_id: ${createdTransaction.transaction_id}`);
      
      const purchaseUpdateData = {
        item_name: 'Updated test purchase',
        price: 150.00,
        category: 'Food',
        notes: 'Test purchase update',
        updated_at: new Date().toISOString()
      };
      
      const { data: purchaseUpdate, error: purchaseUpdateError } = await supabase
        .from('purchases')
        .update(purchaseUpdateData)
        .eq('transaction_id', createdTransaction.transaction_id);
      
      if (purchaseUpdateError) {
        console.log('❌ PURCHASE UPDATE FAILED:', purchaseUpdateError.message);
        console.log('🎯 THIS IS THE EXACT ERROR YOU\'RE EXPERIENCING!');
        console.log('The UUID/VARCHAR mismatch is happening in the purchase update query.');
      } else {
        console.log('✅ Purchase update successful');
      }
    }
    
    // Step 4: Clean up - delete the test transaction
    console.log('\n=== STEP 4: CLEANING UP ===');
    
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', createdTransaction.id);
    
    if (deleteError) {
      console.log('❌ Error deleting test transaction:', deleteError.message);
    } else {
      console.log('✅ Test transaction deleted successfully');
    }
    
    console.log('\n=== DIAGNOSIS COMPLETE ===');
    console.log('If you saw the purchase update error, that\'s the exact cause of your UUID/VARCHAR mismatch issue.');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testTransactionCreation(); 