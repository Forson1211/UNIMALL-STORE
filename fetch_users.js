import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ephckfngxzhckrmfvalg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaGNrZm5neHpoY2tybWZ2YWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDAzMzcsImV4cCI6MjA4NTcxNjMzN30.KTqhO7wU29dw3zGqVfTIus7PXsdnqEbgKovYXXEhXJQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPublicVendorsDiscovery() {
  console.log("=== TESTING PUBLIC VENDORS DISCOVERY ===")
  
  // 1. Fetch products & count per vendor
  const { data: prods } = await supabase.from('products').select('id, name, vendor_id, price')
  const prodCounts = {}
  const vendorSampleProds = {}
  prods?.forEach(p => {
    if (p.vendor_id) {
      prodCounts[p.vendor_id] = (prodCounts[p.vendor_id] || 0) + 1
      if (!vendorSampleProds[p.vendor_id]) vendorSampleProds[p.vendor_id] = p.name
    }
  })

  // 2. Fetch profiles
  const { data: profiles } = await supabase.from('profiles').select('*')
  const profileMap = new Map()
  profiles?.forEach(p => profileMap.set(p.user_id || p.id, p))

  // 3. Fetch vendor_management_view / admin_users_view
  const { data: vView } = await supabase.from('vendor_management_view').select('*')
  const { data: aView } = await supabase.from('admin_users_view').select('*')

  const publicVendorsMap = new Map()

  // Add all approved vendors
  vView?.forEach(v => {
    const prof = profileMap.get(v.user_id) || {}
    const count = prodCounts[v.user_id] || v.product_count || 0
    publicVendorsMap.set(v.user_id, {
      id: v.user_id,
      name: prof.store_name || v.store_name || (v.full_name ? `${v.full_name}'s Store` : 'Campus Vendor'),
      email: v.email,
      campus: prof.campus || 'University of Ghana (Legon)',
      products: count,
      verified: true,
      category: prof.category || 'General'
    })
  })

  // Add all accounts that created products or have a store
  aView?.forEach(u => {
    const count = prodCounts[u.user_id] || 0
    const prof = profileMap.get(u.user_id) || {}
    const isVendorOrHasStore = u.role === 'vendor' || count > 0 || Boolean(u.store_name || prof.store_name)
    
    if (isVendorOrHasStore) {
      const existing = publicVendorsMap.get(u.user_id)
      const storeName = prof.store_name || u.store_name || existing?.name || (u.full_name ? `${u.full_name}'s Store` : 'Campus Store')
      
      publicVendorsMap.set(u.user_id, {
        id: u.user_id,
        name: storeName,
        email: u.email,
        campus: prof.campus || existing?.campus || 'University Campus',
        products: count,
        verified: true,
        category: prof.category || existing?.category || 'General'
      })
    }
  })

  const vendorsList = Array.from(publicVendorsMap.values())
  console.log(`Found ${vendorsList.length} public vendors:`)
  console.table(vendorsList)
}

testPublicVendorsDiscovery()
