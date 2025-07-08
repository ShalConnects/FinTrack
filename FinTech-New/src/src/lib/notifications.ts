import { supabase } from './supabase';
import type { NotificationType } from '../types/index';

export async function createNotification(
  userId: string,
  title: string,
  type: NotificationType = 'info',
  body?: string
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    type,
    body
  });

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Example usage:
// await createNotification(
//   userId,
//   'New Transaction',
//   'success',
//   'A new transaction of $100 has been added to your account'
// ); 