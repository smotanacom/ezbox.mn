import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique identifier for cart item (productId + dimension values)
  productId: string;
  productName: string;
  selectedDimensions: Record<string, string>;
  quantity: number;
  price: number;
  image: string;
  inStock: boolean;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
  getItemById: (itemId: string) => CartItem | undefined;
}

// Generate unique ID for cart item based on product and dimensions
const generateCartItemId = (productId: string, dimensions: Record<string, string>) => {
  const dimensionString = Object.entries(dimensions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  return `${productId}|${dimensionString}`;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => {
        const cartItemId = generateCartItemId(newItem.productId, newItem.selectedDimensions);
        const existingItem = get().items.find(item => item.id === cartItemId);
        
        if (existingItem) {
          // Update quantity if item already exists (only if in stock)
          if (newItem.inStock) {
            set(state => ({
              items: state.items.map(item =>
                item.id === cartItemId
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              )
            }));
          }
        } else {
          // Add new item (only if in stock)
          if (newItem.inStock) {
            set(state => ({
              items: [...state.items, { ...newItem, id: cartItemId }]
            }));
          }
        }
      },
      
      removeItem: (itemId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== itemId)
        }));
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        set(state => ({
          items: state.items.map(item =>
            item.id === itemId
              ? { ...item, quantity: quantity }
              : item
          )
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getItemById: (itemId) => {
        return get().items.find(item => item.id === itemId);
      }
    }),
    {
      name: 'ezbox-cart-storage', // localStorage key
      // Only persist the items array, not the functions
      partialize: (state) => ({ items: state.items }),
    }
  )
);