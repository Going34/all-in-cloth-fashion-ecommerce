'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../context/AuthContext';
import AdminLayout from '../../../../../components/admin/AdminLayout';
import ProductForm from '../../../../../components/admin/ProductForm';

export default function EditProductPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <ProductForm productId={productId} />
    </AdminLayout>
  );
}

