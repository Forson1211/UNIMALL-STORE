# Unimall - Your Campus Marketplace

![Unimall](public/og-image.png)

**Unimall** is a modern, secure, and scalable multi-vendor e-commerce web application designed specifically for tertiary institution students to buy and sell products on campus.

## 🌟 Features

### For Buyers (Students)
- 🛍️ Browse products by category and campus
- 🔍 Advanced search and filtering (price, rating, vendor)
- 🛒 Shopping cart and seamless checkout
- 📦 Order tracking (Pending, Confirmed, Delivered)
- ❤️ Wishlist functionality
- ⭐ Product reviews and ratings
- 📱 Fully responsive mobile-first design

### For Vendors (Student Sellers)
- 🏪 Vendor registration and approval system
- 📊 Comprehensive vendor dashboard
- ➕ Create, edit, and delete products
- 📸 Upload multiple product images
- 📦 Manage stock availability
- 📋 View and update order status
- 📈 Sales analytics (daily, weekly, monthly)
- 💰 Earnings summary
- 🎨 Public vendor store page
- ⏸️ Pause or activate store

### For Admins (Platform Owner)
- 🔐 Secure admin authentication
- 👥 User management (buyers & vendors)
- ✅ Approve, suspend, or delete vendors
- 📦 Manage products and categories
- 📋 View all orders across the platform
- 💵 Commission management
- 📊 Platform analytics (users, sales, revenue)
- 📝 Content management (terms, privacy, FAQs)
- 🔔 System notifications & announcements
- 🎨 **Advanced Site Customization System**

## 🎨 Admin Site Customization

Unimall includes a powerful **Site Customization System** that allows admins to visually manage and customize every part of the website without touching code.

### Customization Features:

#### 1. **Branding Controls**
- Upload and replace site logo
- Change favicon
- Modify site name and slogan
- Preview changes before publishing

#### 2. **Color & Theme Management**
- Customize primary, secondary, and accent colors
- Control background colors for headers, footers, buttons, cards
- Enable light/dark mode
- Save and switch between multiple themes
- Real-time color preview

#### 3. **Background & Media Control**
- Upload background images for hero sections
- Control overlay opacity
- Manage authentication page backgrounds
- Dashboard customization

#### 4. **Typography Settings**
- Choose from multiple font families (Inter, Roboto, Poppins, etc.)
- Adjust base font size
- Live typography preview

#### 5. **Layout Settings**
- Control container widths and spacing
- Toggle rounded corners and shadows
- Enable/disable animations
- Customize button styles

#### 6. **Live Preview Mode**
- Preview all changes before publishing
- One-click publish to apply globally
- Changes persist across all user sessions

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Next.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React Context + TanStack Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with JWT
- **Storage**: Supabase Storage (for images)
- **Real-time**: Supabase Realtime subscriptions
- **API**: RESTful APIs via Supabase

### Development
- **Build Tool**: Vite
- **Language**: TypeScript
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint
- **Package Manager**: npm

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Setup Steps

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd unimall
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run database migrations**

Apply the SQL migrations in the `supabase/migrations` folder to your Supabase project:
- `site_management.sql` - Site settings and CMS tables
- `full_backend_integration.sql` - Core e-commerce tables
- `20260204_unimall_branding.sql` - Unimall branding and customization

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts (via Supabase Auth)
- `user_roles` - Role-based access control
- `profiles` - Extended user profiles
- `products` - Product catalog
- `orders` - Order management
- `order_items` - Order line items
- `categories` - Product categories
- `reviews` - Product reviews and ratings
- `transactions` - Payment transactions
- `coupons` - Discount coupons

### Site Management Tables
- `site_settings` - Global site configuration
- `site_pages` - CMS pages
- `navigation_menus` - Dynamic navigation
- `media_library` - Uploaded media assets
- `email_templates` - Email templates
- `admin_activity_log` - Audit trail
- `site_announcements` - Platform announcements

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Row-level security (RLS) policies
- ✅ Input validation and sanitization
- ✅ SQL injection protection
- ✅ Rate limiting
- ✅ Secure file uploads
- ✅ Admin activity logging

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel/Netlify
The application is optimized for deployment on Vercel or Netlify. Simply connect your Git repository and deploy.

## 📱 Pages & Routes

### Public Pages
- `/` - Landing page
- `/products` - Product listing
- `/products/:id` - Product detail
- `/vendors` - Vendor directory
- `/about` - About Unimall
- `/how-it-works` - Platform guide
- `/contact` - Contact page

### Auth Pages
- `/login` - User login
- `/signup` - User registration

### Buyer Dashboard
- `/account` - Buyer profile
- `/account/orders` - Order history
- `/account/wishlist` - Saved products

### Vendor Dashboard
- `/vendor` - Vendor overview
- `/vendor/products` - Product management
- `/vendor/orders` - Order management
- `/vendor/analytics` - Sales analytics
- `/vendor/settings` - Vendor settings

### Admin Dashboard
- `/admin` - Admin overview
- `/admin/users` - User management
- `/admin/vendors` - Vendor approval
- `/admin/products` - Product moderation
- `/admin/orders` - Order management
- `/admin/analytics` - Platform analytics
- `/admin/site-customization` - **Site Customization**
- `/admin/content` - Content management
- `/admin/settings` - Platform settings

## 🎯 Key Features Implementation

### Real-time Updates
- Live order status updates
- Real-time site settings synchronization
- Instant notifications

### Mobile Money Integration
- MoMo payment support
- Transaction tracking
- Automated reconciliation

### Campus-based Filtering
- Filter products by campus
- Campus-specific vendors
- Location-based search

### PWA Support
- Installable web app
- Offline functionality
- Push notifications

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, email support@unimall.com or join our Discord community.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Made with ❤️ for students, by students**

© 2026 Unimall. All rights reserved.
