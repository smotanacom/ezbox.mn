import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OrderItem {
  productName: string;
  selectedDimensions: Record<string, string>;
  quantity: number;
  price: number;
}

export interface Order {
  orderNumber: string;
  items: OrderItem[];
  total: number;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  };
  createdAt: string;
}

interface OrderStore {
  orders: Order[];
  addOrder: (order: Order) => void;
  getOrderById: (orderNumber: string) => Order | undefined;
  getAllOrders: () => Order[];
  getRecentOrders: (limit?: number) => Order[];
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      
      addOrder: (order) => {
        set(state => ({
          orders: [order, ...state.orders] // Add new orders at the beginning
        }));
      },
      
      getOrderById: (orderNumber) => {
        return get().orders.find(order => order.orderNumber === orderNumber);
      },
      
      getAllOrders: () => {
        return get().orders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      
      getRecentOrders: (limit = 10) => {
        return get().getAllOrders().slice(0, limit);
      }
    }),
    {
      name: 'ezbox-order-storage', // localStorage key
      partialize: (state) => ({ orders: state.orders }),
    }
  )
);