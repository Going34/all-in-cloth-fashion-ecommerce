'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { productsActions } from '@/store/slices/products/productsSlice';
import { 
  selectProducts, 
  selectProductsLoading, 
  selectProductsError,
  selectProductsPagination
} from '@/store/slices/products/productsSelectors';
import { Plus, Search, Edit3, Trash2, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';

const AdminProducts: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);
  const pagination = useAppSelector(selectProductsPagination);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const prevLoadingRef = useRef(loading);
  const prevErrorRef = useRef(error);

  useEffect(() => {
    dispatch(productsActions.fetchProductsDataRequest({ 
      page: pagination.page, 
      limit: pagination.limit,
      search: searchTerm || undefined,
      category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
    }));
  }, [dispatch, pagination.page, pagination.limit, searchTerm, selectedCategory]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm && selectedCategory === 'All Categories') {
      return products;
    }
    return products.filter(product => {
      const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.categories && product.categories.some(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase())));
      const categoryNames = product.categories ? product.categories.map(c => c.name) : [];
      const matchesCategory = selectedCategory === 'All Categories' || categoryNames.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const openAddPage = () => {
    router.push('/admin/products/new');
  };

  const openEditPage = (product: Product) => {
    router.push(`/admin/products/${product.id}/edit`);
  };

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
      setDeleteError(null);
    }
  };

  const handleDelete = () => {
    if (deletingProduct && !isDeleting) {
      setIsDeleting(true);
      setDeleteError(null);
      dispatch(productsActions.deleteProductRequest(deletingProduct.id));
    }
  };

  // Monitor deletion failure
  useEffect(() => {
    if (!isDeleting || !deletingProduct) {
      prevErrorRef.current = error;
      return;
    }

    // Check if error changed and we have an error
    if (prevErrorRef.current !== error && error) {
      // Defer state update to avoid cascading renders
      setTimeout(() => {
        setDeleteError(error);
        setIsDeleting(false);
      }, 0);
    }

    prevErrorRef.current = error;
  }, [error, isDeleting, deletingProduct]);

  // Monitor deletion success
  useEffect(() => {
    if (!isDeleting || !deletingProduct) {
      prevLoadingRef.current = loading;
      return;
    }

    // Check if loading transitioned from true to false (deletion completed)
    const loadingFinished = prevLoadingRef.current && !loading && !error;

    if (loadingFinished) {
      // Defer state update to avoid cascading renders
      setTimeout(() => {
        // Check if product was removed from list
        const productStillExists = products.some(p => p.id === deletingProduct.id);
        if (!productStillExists) {
          // Success - close modal and refresh list
          setIsDeleteModalOpen(false);
          setDeletingProduct(null);
          setDeleteError(null);
          setIsDeleting(false);
          
          // Refresh product list to ensure consistency
          dispatch(productsActions.fetchProductsDataRequest({ 
            page: pagination.page, 
            limit: pagination.limit,
            search: searchTerm || undefined,
            category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
          }));
        } else {
          // Product still exists, might be a race condition - reset state
          setIsDeleting(false);
        }
      }, 0);
    }

    prevLoadingRef.current = loading;
  }, [loading, isDeleting, deletingProduct, products, dispatch, pagination.page, pagination.limit, searchTerm, selectedCategory, error]);

  const handlePageChange = (newPage: number) => {
    dispatch(productsActions.fetchProductsDataRequest({ 
      page: newPage, 
      limit: pagination.limit,
      search: searchTerm || undefined,
      category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
    }));
  };

  const generateSKU = (product: Product) => {
    const categoryName = product.categories && product.categories.length > 0 
      ? product.categories[0].name 
      : 'X';
    const prefix = categoryName.charAt(0).toUpperCase();
    const nameCode = product.name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    return `${prefix}-${nameCode}-${product.id.substring(0, 4).toUpperCase()}`;
  };

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categories) {
        p.categories.forEach(c => cats.add(c.name));
      }
    });
    return Array.from(cats);
  }, [products]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">Manage your catalog, variants, and pricing.</p>
        </div>
        <button 
          onClick={openAddPage}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Add New Product</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, category, or SKU..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedCategory('All Categories');
            }}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
            }}
            className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filter by category"
          >
            <option>All Categories</option>
            {allCategories.map(catName => (
              <option key={catName}>{catName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Inventory</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        {loading ? 'Loading products...' : 'No products found'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={product.image || '/placeholder.png'} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col max-w-[200px]">
                              <span className="text-sm font-bold text-slate-900 truncate">{product.name}</span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest">SKU: {generateSKU(product)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            (product.status === 'live' || product.status === 'Live' || !product.status) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {product.status === 'live' ? 'Live' : product.status === 'draft' ? 'Draft' : product.status || 'Live'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {product.categories && product.categories.length > 0 
                            ? product.categories.map(c => c.name).join(', ')
                            : 'Uncategorized'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">
                              {product.totalStock ?? product.variants?.reduce((sum, v) => sum + (v.inventory?.stock || 0), 0) ?? 0} in stock
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {product.variantCount ?? (product.variants ? product.variants.length : 0)} variants
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {formatCurrency(product.base_price ?? 0)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openEditPage(product)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              aria-label={`Edit ${product.name}`}
                              title={`Edit ${product.name}`}
                            >
                              <Edit3 size={18} />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(product)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              aria-label={`Delete ${product.name}`}
                              title={`Delete ${product.name}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
              </p>
              <div className="flex space-x-2">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                Previous
              </button>
              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                Next
              </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-serif text-slate-900 mb-2">Delete Product</h3>
            <p className="text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-bold text-slate-900">{deletingProduct.name}</span>? This action cannot be undone.
            </p>
            
            {deleteError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                {deleteError}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Cancel deletion"
                title="Cancel deletion"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                aria-label="Confirm deletion"
                title="Confirm deletion"
              >
                {isDeleting && <Loader2 className="animate-spin" size={16} />}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
