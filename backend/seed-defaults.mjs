export const DEFAULT_CAMPUSES = [
  { id: 'ug', name: 'University of Ghana', shortName: 'UG', city: 'Accra', active: true },
  { id: 'knust', name: 'Kwame Nkrumah University of Science and Technology', shortName: 'KNUST', city: 'Kumasi', active: true },
  { id: 'ucc', name: 'University of Cape Coast', shortName: 'UCC', city: 'Cape Coast', active: true },
  { id: 'ashesi', name: 'Ashesi University', shortName: 'Ashesi', city: 'Berekuso', active: true },
  { id: 'other', name: 'Other Ghana campus', shortName: 'Other', city: 'Ghana', active: true },
];

// Baseline content only. No invented sellers, listings, orders or payment records.
export const DEFAULT_SETTINGS = {
  general: {
    site_name: 'Unimall', site_tagline: 'Your Campus Marketplace', allow_vendor_registration: true,
    currency: 'GHS', maintenance_mode: false, support_email: '', support_phone: '',
  },
  branding: {
    logo_url: '/LOGO.png', auth_logo_url: '/AUTH LOGO.png', footer_logo_url: '/FOOTER LOGO.png', favicon_url: '/favicon.png',
    primary_color: '#f97316', secondary_color: '#ea580c', accent_color: '#f59e0b',
    font_family: "'Plus Jakarta Sans', sans-serif", dark_mode_enabled: false,
    background_color: '#ffffff', header_bg_color: '#ffffff', footer_bg_color: '#1f2937', footer_text_color: '#ffffff',
  },
  storefront: {
    hero_title: 'Your Campus Marketplace', hero_subtitle: 'Discover products from campus vendors. Pay cash on delivery.',
    hero_cta_text: 'Explore products', hero_cta_link: '/products', announcement_enabled: false,
    announcement_text: '', announcement_link: '/products', campus_directory: DEFAULT_CAMPUSES,
  },
  layout: { container_max_width: '1280px', border_radius: '0.75rem', animations_enabled: true, sticky_navbar_enabled: true, mobile_bottom_bar_enabled: true, show_search_in_header: true },
  social: { facebook_url: '', instagram_url: '', twitter_url: '', whatsapp_number: '' },
};

export const DEFAULT_PAGES = [
  { slug: 'about', title: 'About Unimall', is_published: true,
    content: { html: '<h1>About Unimall</h1><p>Unimall connects buyers and vendors across university campuses. Browse listings, visit vendor storefronts and place cash-on-delivery orders.</p><p>Vendor accounts require staff approval before selling.</p>' } },
  { slug: 'faq', title: 'Frequently asked questions', is_published: true,
    content: { html: '<h1>Frequently asked questions</h1><h2>How do I pay?</h2><p>Checkout currently supports cash on delivery.</p><h2>How do I sell?</h2><p>Register as a vendor, wait for staff approval, then complete your store profile before publishing products.</p><h2>Where can I track my order?</h2><p>Sign in and open your account orders page.</p>' } },
  { slug: 'privacy', title: 'Privacy policy', is_published: false, content: { html: '<h1>Privacy policy</h1><p>Add and review your business privacy policy before publishing this page.</p>' } },
  { slug: 'terms', title: 'Terms of service', is_published: false, content: { html: '<h1>Terms of service</h1><p>Add and review your business terms before publishing this page.</p>' } },
];

export const DEFAULT_MENUS = [
  { menu_name: 'Starter header', menu_location: 'header', is_active: false, menu_items: [
    { label: 'Products', url: '/products' }, { label: 'Vendors', url: '/vendors' }, { label: 'News', url: '/news' },
  ] },
  { menu_name: 'Starter footer', menu_location: 'footer', is_active: false, menu_items: [
    { label: 'About', url: '/about' }, { label: 'FAQ', url: '/faq' }, { label: 'Contact', url: '/contact' },
  ] },
];
