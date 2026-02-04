import { User, Vendor, Product, Order, DashboardStats, SalesData, CategoryData } from '@/types/dashboard';

// Mock Users
export const mockUsers: User[] = [
  { id: '1', name: 'Kwame Asante', email: 'kwame@ug.edu.gh', role: 'customer', status: 'active', createdAt: new Date('2024-01-15'), campus: 'University of Ghana' },
  { id: '2', name: 'Ama Serwaa', email: 'ama@knust.edu.gh', role: 'customer', status: 'active', createdAt: new Date('2024-02-20'), campus: 'KNUST' },
  { id: '3', name: 'Kofi Mensah', email: 'kofi@ashesi.edu.gh', role: 'vendor', status: 'active', createdAt: new Date('2024-01-10'), campus: 'Ashesi' },
  { id: '4', name: 'Akua Boateng', email: 'akua@ucc.edu.gh', role: 'customer', status: 'inactive', createdAt: new Date('2024-03-05'), campus: 'UCC' },
  { id: '5', name: 'Yaw Owusu', email: 'yaw@ug.edu.gh', role: 'vendor', status: 'active', createdAt: new Date('2024-02-15'), campus: 'University of Ghana' },
  { id: '6', name: 'Efua Ankrah', email: 'efua@knust.edu.gh', role: 'customer', status: 'suspended', createdAt: new Date('2024-01-25'), campus: 'KNUST' },
];

// Mock Vendors
export const mockVendors: Vendor[] = [
  { id: '1', name: 'TechHub', email: 'tech@ug.edu.gh', description: 'Your one-stop shop for all tech accessories and gadgets.', campus: 'University of Ghana', rating: 4.9, products: 45, totalSales: 15420, verified: true, status: 'active', createdAt: new Date('2024-01-10') },
  { id: '2', name: 'BookWorm', email: 'books@knust.edu.gh', description: 'Academic textbooks and study materials at student-friendly prices.', campus: 'KNUST', rating: 4.7, products: 120, totalSales: 28350, verified: true, status: 'active', createdAt: new Date('2024-01-15') },
  { id: '3', name: 'StyleCo', email: 'style@ug.edu.gh', description: 'Trendy fashion and accessories for the modern student.', campus: 'University of Ghana', rating: 4.8, products: 89, totalSales: 22100, verified: true, status: 'active', createdAt: new Date('2024-02-01') },
  { id: '4', name: 'HealthyBites', email: 'health@ucc.edu.gh', description: 'Organic snacks, energy bars, and healthy meal options.', campus: 'UCC', rating: 4.6, products: 34, totalSales: 8950, verified: false, status: 'pending', createdAt: new Date('2024-02-20') },
  { id: '5', name: 'StudyMart', email: 'study@ashesi.edu.gh', description: 'Stationery, calculators, and everything you need for class.', campus: 'Ashesi', rating: 4.8, products: 67, totalSales: 18200, verified: true, status: 'active', createdAt: new Date('2024-01-25') },
];

// Mock Products
export const mockProducts: Product[] = [
  { id: '1', name: 'Wireless Earbuds Pro', description: 'High-quality wireless earbuds with noise cancellation', price: 89.99, category: 'Electronics', stock: 25, vendorId: '1', vendorName: 'TechHub', status: 'active', createdAt: new Date('2024-01-20') },
  { id: '2', name: 'Calculus Textbook', description: '8th Edition Advanced Calculus', price: 45.00, category: 'Books', stock: 50, vendorId: '2', vendorName: 'BookWorm', status: 'active', createdAt: new Date('2024-01-22') },
  { id: '3', name: 'Vintage Denim Jacket', description: 'Classic vintage style denim jacket', price: 65.00, category: 'Fashion', stock: 15, vendorId: '3', vendorName: 'StyleCo', status: 'active', createdAt: new Date('2024-02-01') },
  { id: '4', name: 'Protein Energy Bars (12pk)', description: 'Healthy protein bars for active students', price: 24.99, category: 'Food', stock: 0, vendorId: '4', vendorName: 'HealthyBites', status: 'out_of_stock', createdAt: new Date('2024-02-10') },
  { id: '5', name: 'Scientific Calculator', description: 'TI-84 Plus scientific calculator', price: 120.00, category: 'Stationery', stock: 30, vendorId: '5', vendorName: 'StudyMart', status: 'active', createdAt: new Date('2024-02-15') },
  { id: '6', name: 'USB-C Hub', description: '7-in-1 USB-C hub for laptops', price: 35.99, category: 'Electronics', stock: 40, vendorId: '1', vendorName: 'TechHub', status: 'active', createdAt: new Date('2024-02-20') },
  { id: '7', name: 'Campus Hoodie', description: 'Comfortable cotton hoodie with university logo', price: 45.00, category: 'Fashion', stock: 8, vendorId: '3', vendorName: 'StyleCo', status: 'active', createdAt: new Date('2024-03-01') },
  { id: '8', name: 'Notebook Set (5pk)', description: 'Premium ruled notebooks for notes', price: 12.99, category: 'Stationery', stock: 100, vendorId: '5', vendorName: 'StudyMart', status: 'active', createdAt: new Date('2024-03-05') },
];

// Mock Orders
export const mockOrders: Order[] = [
  { id: 'ORD-001', customerName: 'Kwame Asante', customerEmail: 'kwame@ug.edu.gh', items: [{ productId: '1', productName: 'Wireless Earbuds Pro', quantity: 1, price: 89.99 }], total: 89.99, status: 'delivered', paymentStatus: 'paid', createdAt: new Date('2024-03-01'), vendorId: '1' },
  { id: 'ORD-002', customerName: 'Ama Serwaa', customerEmail: 'ama@knust.edu.gh', items: [{ productId: '2', productName: 'Calculus Textbook', quantity: 2, price: 45.00 }], total: 90.00, status: 'shipped', paymentStatus: 'paid', createdAt: new Date('2024-03-02'), vendorId: '2' },
  { id: 'ORD-003', customerName: 'Kofi Mensah', customerEmail: 'kofi@ashesi.edu.gh', items: [{ productId: '3', productName: 'Vintage Denim Jacket', quantity: 1, price: 65.00 }, { productId: '7', productName: 'Campus Hoodie', quantity: 2, price: 45.00 }], total: 155.00, status: 'confirmed', paymentStatus: 'paid', createdAt: new Date('2024-03-03'), vendorId: '3' },
  { id: 'ORD-004', customerName: 'Akua Boateng', customerEmail: 'akua@ucc.edu.gh', items: [{ productId: '5', productName: 'Scientific Calculator', quantity: 1, price: 120.00 }], total: 120.00, status: 'pending', paymentStatus: 'pending', createdAt: new Date('2024-03-04'), vendorId: '5' },
  { id: 'ORD-005', customerName: 'Yaw Owusu', customerEmail: 'yaw@ug.edu.gh', items: [{ productId: '6', productName: 'USB-C Hub', quantity: 3, price: 35.99 }], total: 107.97, status: 'delivered', paymentStatus: 'paid', createdAt: new Date('2024-03-05'), vendorId: '1' },
  { id: 'ORD-006', customerName: 'Efua Ankrah', customerEmail: 'efua@knust.edu.gh', items: [{ productId: '8', productName: 'Notebook Set (5pk)', quantity: 4, price: 12.99 }], total: 51.96, status: 'cancelled', paymentStatus: 'refunded', createdAt: new Date('2024-03-06'), vendorId: '5' },
];

// Dashboard Stats
export const adminStats: DashboardStats = {
  totalRevenue: 92820,
  totalOrders: 1247,
  totalProducts: 423,
  totalCustomers: 3892,
  revenueChange: 12.5,
  ordersChange: 8.2,
};

export const vendorStats: DashboardStats = {
  totalRevenue: 15420,
  totalOrders: 187,
  totalProducts: 45,
  totalCustomers: 523,
  revenueChange: 18.3,
  ordersChange: 15.1,
};

// Sales Chart Data
export const salesData: SalesData[] = [
  { name: 'Jan', sales: 4000, orders: 240 },
  { name: 'Feb', sales: 3000, orders: 198 },
  { name: 'Mar', sales: 5000, orders: 320 },
  { name: 'Apr', sales: 4500, orders: 280 },
  { name: 'May', sales: 6000, orders: 390 },
  { name: 'Jun', sales: 5500, orders: 350 },
  { name: 'Jul', sales: 7000, orders: 420 },
];

// Category Distribution
export const categoryData: CategoryData[] = [
  { name: 'Electronics', value: 35, fill: '#3b82f6' }, // Blue
  { name: 'Books', value: 25, fill: '#8b5cf6' }, // Purple
  { name: 'Fashion', value: 20, fill: '#ec4899' }, // Pink
  { name: 'Stationery', value: 12, fill: '#10b981' }, // Green
  { name: 'Food', value: 8, fill: '#f97316' }, // Orange
];
