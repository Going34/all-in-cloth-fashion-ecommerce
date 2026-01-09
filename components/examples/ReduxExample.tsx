'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { productsActions } from '@/store/slices/products/productsSlice';
import { selectProducts, selectProductsLoading, selectProductsError } from '@/store/slices/products/productsSelectors';

export function ReduxExample() {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);

  useEffect(() => {
    dispatch(productsActions.fetchProductsDataRequest({ page: 1, limit: 10 }));
  }, [dispatch]);

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Products (Redux Example)</h2>
      <p>Total products: {products.length}</p>
      <ul>
        {products.slice(0, 5).map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}

