import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ephckfngxzhckrmfvalg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaGNrZm5neHpoY2tybWZ2YWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDAzMzcsImV4cCI6MjA4NTcxNjMzN30.KTqhO7wU29dw3zGqVfTIus7PXsdnqEbgKovYXXEhXJQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnose() {
  // Check all user_roles rows via admin_users_view
  const { data, error } = await supabase
    .from('admin_users_view')
    .select('user_id, email, role, vendor_status')

  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log('All users in admin_users_view:')
    console.table(data)
  }
}

diagnose()
