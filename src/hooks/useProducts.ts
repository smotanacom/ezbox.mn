import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types/Product';
import { products as productsData } from '../data/products';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setProducts(productsData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setLoading(false);
    }
  }, []);

  const getProductById = useCallback((id: string): Product | undefined => {
    return products.find(product => product.id === id);
  }, [products]);

  const getProductsByCategory = useCallback((category: string): Product[] => {
    return products.filter(product => product.category === category);
  }, [products]);

  const searchProducts = useCallback((query: string): Product[] => {
    const lowercaseQuery = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery) ||
      product.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [products]);

  return {
    products,
    loading,
    error,
    getProductById,
    getProductsByCategory,
    searchProducts
  };
};