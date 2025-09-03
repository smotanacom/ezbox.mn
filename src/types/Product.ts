export interface DimensionOption {
  name: string;
  value: string;
}

export interface Dimension {
  name: string;
  options: DimensionOption[];
}

export interface ProductVariant {
  dimensionValues: Record<string, string>;
  image: string;
  price?: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  mainImage: string;
  dimensions: Dimension[];
  variants: ProductVariant[];
  category?: string;
  tags?: string[];
}

export interface CartItem {
  productId: string;
  selectedDimensions: Record<string, string>;
  quantity: number;
  price: number;
}