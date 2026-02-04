# Admin Dashboard - Complete Feature Guide

## Overview
The Admin Dashboard has been enhanced with comprehensive site management capabilities, giving administrators full control over the entire platform.

## Main Admin Pages

### 1. **Dashboard** (`/admin`)
- Revenue and sales metrics
- Order tracking
- Product statistics  
- Customer analytics
- Sales charts and category breakdown
- Recent orders overview
- Top vendors list

### 2. **Users** (`/admin/users`)
- View all registered users
- Manage user accounts
- Assign/modify user roles
- User activity monitoring

### 3. **Vendors** (`/admin/vendors`)
- Approve/reject vendor applications
- View vendor details
- Manage vendor verification status
- Monitor vendor performance

### 4. **Products** (`/admin/products`)
- View all platform products
- Approve/reject product listings
- Moderate product content
- Manage product categories

### 5. **Orders** (`/admin/orders`)
- View all platform orders
- Track order status
- Manage order fulfillment
- Handle order disputes

### 6. **Analytics** (`/admin/analytics`)
- Detailed sales reports
- Revenue trends
- User engagement metrics
- Vendor performance analytics

## Advanced Settings & Controls

### 7. **Admin Settings** (`/admin/settings`)

#### General Tab
- Platform name configuration
- Support email settings
- Platform description
- **Quick access to Site Customization page**

#### Notifications Tab
- New order alerts
- Vendor application notifications
- Low stock alerts
- Weekly reports toggle
- User reports & disputes notifications

#### Security Tab
- Two-factor authentication (2FA)
- Session timeout settings
- Login attempt limits
- Password management

#### Platform Tab
- Vendor registration controls
- Vendor verification requirements
- Product review moderation
- Commission rate configuration
- Minimum order value settings

#### **NEW: Maintenance Mode Tab**
- Enable/disable maintenance mode
- Custom maintenance message
- Estimated completion time
- Admin-only access during maintenance

#### **NEW: Backup & Restore Tab**
- Automatic backup scheduling
- Manual backup creation
- Backup frequency settings (Daily/Weekly/Monthly)
- Recent backups list with download/restore options

#### **NEW: System Health Tab**
- Database status monitoring
- API response time tracking
- Storage usage statistics
- Active users count
- Recent activity logs
- Full system log viewer

#### **NEW: API Management Tab**
- Production and test API keys
- API key regeneration
- Monthly API usage tracking
- API access controls
- API documentation link

### 8. **Site Customization** (`/admin/site-customization`) ⭐

A comprehensive page for complete site branding and configuration:

#### Branding Tab
- **Logo Upload**: Upload site logo (200x200px recommended)
- **Site Name**: Configure platform name
- **Tagline**: Set platform tagline
- **Color Customization**:
  - Primary color picker
  - Secondary color picker
- **Favicon**: Upload custom favicon

#### Content Management Tab
- **Homepage Content**:
  - Hero title configuration
  - Hero subtitle editing
  - Featured categories management
- **About Page**:
  - About us content editor
- **Footer Settings**:
  - Support email
  - Support phone
  - Copyright text customization

#### Email Configuration Tab
- **SMTP Settings**:
  - SMTP host configuration
  - SMTP port settings
  - SMTP credentials
- **Email Templates**:
  - Welcome email template
  - Order confirmation template
  - Password reset template
  - Template editing capabilities

#### Payment Settings Tab
- **Payment Gateways**:
  - Paystack integration (enable/disable)
  - Stripe integration (enable/disable)
  - Paystack public key configuration
- **Currency & Tax**:
  - Default currency settings
  - Tax rate configuration

#### SEO Settings Tab
- **Meta Tags**:
  - Meta title
  - Meta description
  - Meta keywords
- **Analytics Integration**:
  - Google Analytics ID
  - Google Tag Manager ID
- **SEO Tools**:
  - Automatic sitemap generation toggle

## Access Control

All admin pages are protected with role-based access control:
- Only users with the `admin` role can access admin dashboard
- Admins have full access to vendor routes as well
- Secure authentication via Supabase RLS policies

## Key Features Summary

### Site-Wide Management
✅ Complete branding control (logo, colors, fonts)
✅ Content management for all pages
✅ Email template customization
✅ Payment gateway configuration
✅ SEO optimization tools

### Operations
✅ Maintenance mode for scheduled updates
✅ Automated database backups
✅ System health monitoring
✅ Activity log tracking

### Integrations
✅ API key management
✅ Third-party integrations
✅ Analytics tools (Google Analytics, GTM)

### Security
✅ Two-factor authentication
✅ Session management
✅ Login attempt limits
✅ Row-level security (RLS)

## How to Navigate

1. **From Admin Dashboard**: 
   - Use the sidebar navigation to access different sections
   
2. **Settings Access**:
   - Click "Settings" in the admin sidebar
   - Choose from 8 different tabs for specific configurations

3. **Site Customization**:
   - Go to Settings > General Tab
   - Click "Customize Site" button
   - OR navigate directly to `/admin/site-customization`

## Future Enhancements (Potential)

- Real-time analytics dashboard
- Advanced reporting with exports
- Bulk product/user management
- Automated email campaigns
- Multi-language support
- Advanced AI-powered insights
- Integration marketplace

---

**Note**: All settings changes are currently demo implementations. To make them functional, integrate with your Supabase database using appropriate tables and RPC functions.
