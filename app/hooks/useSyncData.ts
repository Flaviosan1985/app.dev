'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceSmall?: number;
  category: string;
  image: string;
  isActive: boolean;
  isFeatured: boolean;
  type?: 'product' | 'complement';
}

interface ProductsData {
  products: Product[];
  lastSync: string | null;
  error?: string;
}

export function useProducts(autoRefresh = true, refreshInterval = 10000) {
  const [data, setData] = useState<ProductsData>({
    products: [],
    lastSync: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setData({
        products: [],
        lastSync: null,
        error: 'Erro ao carregar produtos',
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    if (autoRefresh) {
      const interval = setInterval(fetchProducts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    products: data.products,
    lastSync: data.lastSync,
    loading,
    error: data.error,
    refresh: fetchProducts,
  };
}

export function useCustomers(autoRefresh = false, refreshInterval = 30000) {
  const [data, setData] = useState<any>({
    customers: [],
    lastSync: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        cache: 'no-store',
      });
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    if (autoRefresh) {
      const interval = setInterval(fetchCustomers, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    customers: data.customers,
    lastSync: data.lastSync,
    loading,
    refresh: fetchCustomers,
  };
}
