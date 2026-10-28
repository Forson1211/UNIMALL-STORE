// Dashboard Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendor' | 'customer';
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  campus?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  description: string;
  campus: string;
  rating: number;
  products: number;
  totalSales: number;
  verified: boolean;
  status: 'active' | 'pending' | 'suspended';
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url?: string;
  vendorId: string;
  vendorName?: string;
  status: 'active' | 'draft' | 'out_of_stock';
  createdAt: Date;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  vendorId?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
}

export interface SalesData {
  name: string;
  sales: number;
  orders: number;
}

export interface CategoryData {
  name: string;
  value: number;
  fill: string;
}
