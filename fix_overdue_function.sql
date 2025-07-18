-- Fix the check_overdue_last_wish function
-- The issue is likely with the function signature or return type

-- Drop the existing function first
DROP FUNCTION IF EXISTS check_overdue_last_wish();

-- Recreate the function with proper return type
CREATE OR REPLACE FUNCTION check_overdue_last_wish()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lws.user_id,
        au.email,
        EXTRACT(DAY FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER as days_overdue
    FROM last_wish_settings lws
    JOIN auth.users au ON lws.user_id = au.id
    WHERE lws.is_enabled = TRUE 
    AND lws.is_active = TRUE
    AND lws.last_check_in IS NOT NULL
    AND NOW() > (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;

-- Test the function
SELECT * FROM check_overdue_last_wish(); 