'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { productsActions } from '@/store/slices/products/productsSlice';
import { categoriesActions } from '@/store/slices/categories/categoriesSlice';
import { selectSelectedProduct, selectProductsLoading, selectProductsError } from '@/store/slices/products/productsSelectors';
import { selectCategories, selectCategoriesLoading, selectCategoriesError, selectCategoriesCreating, selectCategoriesCreateError } from '@/store/slices/categories/categoriesSelectors';
import { ArrowLeft, Save, X, Plus, Trash2, Star, Image as ImageIcon, Edit3, Loader2, Upload } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface ProductFormProps {
  productId?: string;
}

interface VariantFormData {
  id: string;
  color: string;
  size: string;
  sku: string;
  price_override: string;
  stock: string;
  is_active: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ productId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const selectedProduct = useAppSelector(selectSelectedProduct);
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);
  const categories = useAppSelector(selectCategories);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);
  const categoriesError = useAppSelector(selectCategoriesError);
  const isEditMode = !!productId;
  
  const [formData, setFormData] = useState({
    name: '',
    base_price: '',
    description: '',
    selectedCategoryIds: [] as string[],
    status: 'Live' as 'Draft' | 'Live',
    featured: false,
    images: [] as string[],
    primaryImageIndex: 0,
    lowStockThreshold: '5',
  });

  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageLoadStatus, setImageLoadStatus] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({});
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantFormData | null>(null);
  const [variantForm, setVariantForm] = useState<VariantFormData>({
    id: '',
    color: '',
    size: '',
    sku: '',
    price_override: '',
    stock: '0',
    is_active: true,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const prevLoadingRef = useRef(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const creatingCategory = useAppSelector(selectCategoriesCreating);
  const categoryCreateError = useAppSelector(selectCategoriesCreateError);
  const prevCreatingCategoryRef = useRef(false);
  const [imageValidationResults, setImageValidationResults] = useState<Array<{ url: string; valid: boolean; error?: string }>>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<number, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(categoriesActions.fetchCategoriesDataRequest());
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && productId) {
      // Reset save success when loading a product for editing
      setSaveSuccess(false);
      setIsSaving(false);
      dispatch(productsActions.fetchProductByIdRequest(productId));
    }
  }, [dispatch, isEditMode, productId]);

  useEffect(() => {
    if (isEditMode && selectedProduct) {
      const productImages = selectedProduct.images || (selectedProduct.image ? [selectedProduct.image] : []);
      
      // Calculate primary image index
      let calculatedPrimaryIndex = 0;
      if (selectedProduct.primaryImageIndex !== undefined && selectedProduct.primaryImageIndex >= 0 && selectedProduct.primaryImageIndex < productImages.length) {
        calculatedPrimaryIndex = selectedProduct.primaryImageIndex;
      } else if (selectedProduct.image && productImages.length > 0) {
        // Find the index of the primary image
        const primaryImageIndex = productImages.findIndex(img => img === selectedProduct.image);
        calculatedPrimaryIndex = primaryImageIndex >= 0 ? primaryImageIndex : 0;
      }

      setFormData({
        name: selectedProduct.name,
        base_price: selectedProduct.base_price.toString(),
        description: selectedProduct.description || '',
        selectedCategoryIds: selectedProduct.categories ? selectedProduct.categories.map(c => c.id) : [],
        status: selectedProduct.status === 'draft' ? 'Draft' : 'Live',
        featured: selectedProduct.featured || false,
        images: productImages,
        primaryImageIndex: calculatedPrimaryIndex,
        lowStockThreshold: '5',
      });

      // Reset image load status - will be updated by onLoad/onError handlers
      setImageLoadStatus({});

      if (selectedProduct.variants) {
        setVariants(selectedProduct.variants.map(v => ({
          id: v.id,
          color: v.color,
          size: v.size,
          sku: v.sku,
          price_override: v.price_override?.toString() || '',
          stock: v.inventory?.stock.toString() || '0',
          is_active: v.is_active ?? true,
        })));
      }
    }
  }, [isEditMode, selectedProduct]);

  // Check if images are already loaded/cached when images change
  useEffect(() => {
    if (formData.images.length > 0) {
      const statusUpdates: Record<number, 'loading' | 'loaded' | 'error'> = {};
      let pendingChecks = 0;
      
      formData.images.forEach((url, index) => {
        pendingChecks++;
        const img = new Image();
        
        img.onload = () => {
          if (img.complete && img.naturalHeight !== 0) {
            statusUpdates[index] = 'loaded';
          }
          pendingChecks--;
          if (pendingChecks === 0) {
            setImageLoadStatus(prev => {
              // Merge with existing status, only update if not already set or still loading
              const merged: Record<number, 'loading' | 'loaded' | 'error'> = { ...prev };
              Object.keys(statusUpdates).forEach(key => {
                const idx = parseInt(key);
                if (!merged[idx] || merged[idx] === 'loading') {
                  merged[idx] = statusUpdates[idx];
                }
              });
              return merged;
            });
          }
        };
        
        img.onerror = () => {
          statusUpdates[index] = 'error';
          pendingChecks--;
          if (pendingChecks === 0) {
            setImageLoadStatus(prev => {
              const merged: Record<number, 'loading' | 'loaded' | 'error'> = { ...prev };
              Object.keys(statusUpdates).forEach(key => {
                const idx = parseInt(key);
                if (!merged[idx] || merged[idx] === 'loading') {
                  merged[idx] = statusUpdates[idx];
                }
              });
              return merged;
            });
          }
        };
        
        // Set loading state initially
        statusUpdates[index] = 'loading';
        
        // Start loading - if cached, onload fires synchronously
        img.src = url;
        
        // Check immediately if already cached
        if (img.complete && img.naturalHeight !== 0) {
          statusUpdates[index] = 'loaded';
          pendingChecks--;
          if (pendingChecks === 0) {
            setImageLoadStatus(prev => {
              const merged: Record<number, 'loading' | 'loaded' | 'error'> = { ...prev };
              Object.keys(statusUpdates).forEach(key => {
                const idx = parseInt(key);
                if (!merged[idx] || merged[idx] === 'loading') {
                  merged[idx] = statusUpdates[idx];
                }
              });
              return merged;
            });
          }
        }
      });
      
      // If no pending checks, update immediately
      if (pendingChecks === 0 && Object.keys(statusUpdates).length > 0) {
        setImageLoadStatus(prev => ({ ...prev, ...statusUpdates }));
      }
    } else {
      // Clear status when no images
      setImageLoadStatus({});
    }
  }, [formData.images]);

  const generateSKU = (productName: string, color: string, size: string): string => {
    const nameCode = productName.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const colorCode = color.substring(0, 3).toUpperCase();
    const sizeCode = size.toUpperCase();
    return `${nameCode}-${colorCode}-${sizeCode}`;
  };

  // Validate image URL format
  const validateImageUrl = (url: string): { valid: boolean; error?: string } => {
    if (!url || !url.trim()) {
      return { valid: false, error: 'URL cannot be empty' };
    }

    try {
      const urlObj = new URL(url.trim());
      // Check if it's http or https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
      }

      // Check for common image extensions (optional, as some URLs may not have extensions)
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
      const hasImageExtension = imageExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      );

      // If no extension, that's okay - might be a dynamic URL
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid URL format' };
    }
  };

  // Check if image is accessible
  const checkImageAccessibility = async (url: string): Promise<{ accessible: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        resolve({ accessible: false, error: 'Image load timeout' });
      }, 10000); // 10 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        resolve({ accessible: true });
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve({ accessible: false, error: 'Image failed to load' });
      };

      img.src = url;
    });
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length === 0) {
      setImageValidationError('Please select valid image files (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    if (validFiles.length !== fileArray.length) {
      setImageValidationError('Some files were skipped. Only image files are allowed.');
    }

    // Upload each file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const uploadIndex = formData.images.length + i;
      
      setUploadingFiles(prev => ({ ...prev, [uploadIndex]: true }));
      setUploadProgress(prev => ({ ...prev, [uploadIndex]: 0 }));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'products');

        const response = await fetch('/api/admin/products/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Add uploaded image URL to form
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, result.data.url],
        }));

        setUploadProgress(prev => ({ ...prev, [uploadIndex]: 100 }));
      } catch (error) {
        setImageValidationError(
          error instanceof Error ? error.message : 'Failed to upload image'
        );
      } finally {
        setUploadingFiles(prev => {
          const newState = { ...prev };
          delete newState[uploadIndex];
          return newState;
        });
        setTimeout(() => {
          setUploadProgress(prev => {
            const newState = { ...prev };
            delete newState[uploadIndex];
            return newState;
          });
        }, 1000);
      }
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    handleFileUpload(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add image with validation
  const addImage = async () => {
    const url = newImageUrl.trim();
    if (!url) {
      setImageValidationError('Please enter an image URL');
      return;
    }

    // Check if URL already exists
    if (formData.images.includes(url)) {
      setImageValidationError('This image URL is already added');
      return;
    }

    setIsValidatingImage(true);
    setImageValidationError(null);

    // Validate URL format
    const formatValidation = validateImageUrl(url);
    if (!formatValidation.valid) {
      setIsValidatingImage(false);
      setImageValidationError(formatValidation.error || 'Invalid URL format');
      return;
    }

    // Check image accessibility
    const accessibilityCheck = await checkImageAccessibility(url);
    if (!accessibilityCheck.accessible) {
      setIsValidatingImage(false);
      setImageValidationError(accessibilityCheck.error || 'Image is not accessible. You can still add it, but it may not display correctly.');
      // Allow user to proceed with warning - we'll show the error but still add it
      // User can remove it if needed
    }

    // Add image to form
    setFormData({
      ...formData,
      images: [...formData.images, url],
    });
    setNewImageUrl('');
    setIsValidatingImage(false);
    setImageValidationError(null);
  };

  // Validate all images before save
  const validateAllImages = async (): Promise<Array<{ url: string; valid: boolean; error?: string }>> => {
    const results: Array<{ url: string; valid: boolean; error?: string }> = [];
    
    for (const url of formData.images) {
      const formatValidation = validateImageUrl(url);
      if (!formatValidation.valid) {
        results.push({ url, valid: false, error: formatValidation.error });
        continue;
      }

      // Quick accessibility check (with shorter timeout for batch validation)
      const accessibilityCheck = await new Promise<{ accessible: boolean; error?: string }>((resolve) => {
        const img = new Image();
        const timeout = setTimeout(() => {
          img.onload = null;
          img.onerror = null;
          resolve({ accessible: false, error: 'Timeout' });
        }, 5000); // Shorter timeout for batch validation

        img.onload = () => {
          clearTimeout(timeout);
          resolve({ accessible: true });
        };

        img.onerror = () => {
          clearTimeout(timeout);
          resolve({ accessible: false, error: 'Failed to load' });
        };

        img.src = url;
      });

      results.push({
        url,
        valid: accessibilityCheck.accessible,
        error: accessibilityCheck.error,
      });
    }

    return results;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.base_price || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.images.length === 0) {
      alert('Please add at least one product image');
      return;
    }

    if (variants.length === 0) {
      alert('Please add at least one variant');
      return;
    }

    if (formData.selectedCategoryIds.length === 0) {
      alert('Please select at least one category');
      return;
    }

    // Validate primaryImageIndex
    if (formData.primaryImageIndex < 0 || formData.primaryImageIndex >= formData.images.length) {
      setFormData({
        ...formData,
        primaryImageIndex: 0, // Auto-correct to valid index
      });
    }

    // Validate all images before saving
    setIsSaving(true);
    const validationResults = await validateAllImages();
    setImageValidationResults(validationResults);
    setIsSaving(false);

    const invalidImages = validationResults.filter(r => !r.valid);
    if (invalidImages.length > 0) {
      // Show validation modal with warnings
      setShowValidationModal(true);
      setPendingSave(true);
      return;
    }

    // All images valid, proceed with save
    proceedWithSave();
  };

  const proceedWithSave = () => {
    setShowValidationModal(false);
    setPendingSave(false);

    const finalProductId = isEditMode ? (productId || `prod-${Date.now()}`) : `prod-${Date.now()}`;
    const lowStockThreshold = parseInt(formData.lowStockThreshold) || 5;

    const productVariants: ProductVariant[] = variants.map(v => ({
      id: v.id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      product_id: finalProductId,
      sku: v.sku || generateSKU(formData.name, v.color, v.size),
      color: v.color,
      size: v.size,
      price_override: v.price_override ? parseFloat(v.price_override) : null,
      is_active: v.is_active,
      inventory: {
        variant_id: v.id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stock: parseInt(v.stock) || 0,
        reserved_stock: 0,
        low_stock_threshold: lowStockThreshold,
      }
    }));

    const selectedCategories = categories.filter(c => formData.selectedCategoryIds.includes(c.id));

    const productData = {
      name: formData.name,
      base_price: parseFloat(formData.base_price),
      description: formData.description,
      category_ids: formData.selectedCategoryIds,
      status: formData.status.toLowerCase() as 'draft' | 'live',
      featured: formData.featured,
      images: formData.images,
      primaryImageIndex: Math.max(0, Math.min(formData.primaryImageIndex, formData.images.length - 1)),
      variants: productVariants.map(v => ({
        id: v.id || undefined, // Include variant ID if editing existing variant
        color: v.color,
        size: v.size,
        sku: v.sku,
        price_override: v.price_override,
        stock: v.inventory?.stock ?? 0,
        low_stock_threshold: lowStockThreshold,
        is_active: v.is_active,
        images: v.images || [], // Include images if available
      })),
    };

    // Mark that we're starting a save operation
    setIsSaving(true);
    setSaveSuccess(false);
    
    if (isEditMode && productId) {
      dispatch(productsActions.updateProductRequest({ id: productId, data: productData }));
    } else {
      dispatch(productsActions.createProductRequest(productData));
    }
  };


  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    let newPrimaryIndex = formData.primaryImageIndex;
    
    if (index === formData.primaryImageIndex) {
      newPrimaryIndex = 0;
    } else if (index < formData.primaryImageIndex) {
      newPrimaryIndex = formData.primaryImageIndex - 1;
    }

    setFormData({
      ...formData,
      images: newImages,
      primaryImageIndex: Math.max(0, Math.min(newPrimaryIndex, newImages.length - 1)),
    });
  };

  const setPrimaryImage = (index: number) => {
    setFormData({
      ...formData,
      primaryImageIndex: index,
    });
  };

  const openAddVariantModal = () => {
    setEditingVariant(null);
    setVariantForm({
      id: '',
      color: '',
      size: '',
      sku: '',
      price_override: '',
      stock: '0',
      is_active: true,
    });
    setIsVariantModalOpen(true);
  };

  const openEditVariantModal = (variant: VariantFormData) => {
    setEditingVariant(variant);
    setVariantForm({ ...variant });
    setIsVariantModalOpen(true);
  };

  const handleVariantSave = () => {
    if (!variantForm.color) {
      alert('Please fill in color');
      return;
    }

    if (parseInt(variantForm.stock) < 0) {
      alert('Stock cannot be negative');
      return;
    }

    // If size is empty, default to "One Size" for non-clothing items
    const finalSize = variantForm.size.trim() || 'One Size';

    // Check for duplicates (case-insensitive)
    const duplicate = variants.find(v => 
      v.color.toLowerCase() === variantForm.color.trim().toLowerCase() && 
      v.size.toLowerCase() === finalSize.toLowerCase() &&
      v.id !== editingVariant?.id
    );
    
    if (duplicate) {
      alert('A variant with this color and size already exists');
      return;
    }

    const sku = variantForm.sku || generateSKU(formData.name, variantForm.color, finalSize);

    if (editingVariant) {
      setVariants(variants.map(v => 
        v.id === editingVariant.id 
          ? { ...variantForm, size: finalSize, sku, id: editingVariant.id }
          : v
      ));
    } else {
      const newVariant: VariantFormData = {
        ...variantForm,
        size: finalSize,
        id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sku,
      };
      setVariants([...variants, newVariant]);
    }

    setIsVariantModalOpen(false);
    setEditingVariant(null);
  };

  const removeVariant = (variantId: string) => {
    setVariants(variants.filter(v => v.id !== variantId));
  };

  const toggleCategorySelection = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategoryIds: prev.selectedCategoryIds.includes(categoryId)
        ? prev.selectedCategoryIds.filter(id => id !== categoryId)
        : [...prev.selectedCategoryIds, categoryId]
    }));
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    dispatch(categoriesActions.createCategoryRequest({ name: newCategoryName.trim() }));
  };

  // Handle successful category creation
  useEffect(() => {
    const wasCreating = prevCreatingCategoryRef.current;
    const justFinished = wasCreating && !creatingCategory;
    
    if (justFinished && !categoryCreateError && newCategoryName) {
      // Find the newly created category
      const newCategory = categories.find(cat => 
        cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      );
      
      if (newCategory) {
        // Auto-select the new category
        if (!formData.selectedCategoryIds.includes(newCategory.id)) {
          setFormData(prev => ({
            ...prev,
            selectedCategoryIds: [...prev.selectedCategoryIds, newCategory.id]
          }));
        }
        // Close modal and reset
        setIsCategoryModalOpen(false);
        setNewCategoryName('');
      }
    }
    
    prevCreatingCategoryRef.current = creatingCategory;
  }, [creatingCategory, categoryCreateError, categories, newCategoryName, formData.selectedCategoryIds]);

  const totalStock = useMemo(() => {
    return variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
  }, [variants]);

  const uniqueColors = useMemo(() => {
    return [...new Set(variants.map(v => v.color))];
  }, [variants]);

  const uniqueSizes = useMemo(() => {
    return [...new Set(variants.map(v => v.size))];
  }, [variants]);

  // Track when save operation completes successfully
  // Only trigger redirect if we actually performed a save operation (isSaving flag)
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    const justFinished = wasLoading && !loading;
    
    // Only process save success if we were actually saving (not just loading product data)
    if (justFinished && !error && isSaving) {
      // Check if this was a successful create or update
      if (isEditMode) {
        // For edit mode, check if selectedProduct was updated
        if (selectedProduct) {
          setSaveSuccess(true);
          setIsSaving(false); // Reset saving flag
        }
      } else {
        // For create mode, if we're not loading and no error, it's a success
        setSaveSuccess(true);
        setIsSaving(false); // Reset saving flag
      }
    }
    
    // If there was an error during save, reset the saving flag
    if (error && isSaving) {
      setIsSaving(false);
    }
    
    prevLoadingRef.current = loading;
  }, [loading, error, selectedProduct, isEditMode, isSaving]);

  // Navigate only after successful save
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        router.push('/admin/products');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, router]);

  // Show loading state only when actively loading and no error yet
  if (isEditMode && loading && !selectedProduct && !error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  // Show error state if product fetch failed in edit mode
  if (isEditMode && error && !selectedProduct && !loading) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <p className="font-bold mb-2">Failed to load product</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => router.push('/admin/products')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}
      {categoriesError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
          <p className="font-bold mb-1">Warning: Failed to load categories</p>
          <p>{categoriesError}</p>
          <p className="mt-2 text-xs">You can still create/edit products, but category selection may be limited.</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/products')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Go back to products list"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-serif text-slate-900">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isEditMode ? 'Update product details and variants' : 'Create a new product listing'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Save Product</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xl font-serif text-slate-900">Basic Information</h2>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Base Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="5"
                />
                <p className="text-xs text-slate-400">Alert when stock falls below this number</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Categories <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                >
                  <Plus size={14} />
                  <span>Add Category</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategorySelection(cat.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      formData.selectedCategoryIds.includes(cat.id)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    aria-label={`Select ${cat.name} category`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Enter detailed product description"
              />
            </div>
          </section>

          {/* Product Images */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xl font-serif text-slate-900">Product Images</h2>
            
            <div className="space-y-4">
              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-indigo-100 rounded-full">
                    <Upload className="text-indigo-600" size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900 mb-1">
                      Drag and drop images here, or click to browse
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports JPEG, PNG, GIF, WebP, SVG (Max 5MB per file)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors cursor-pointer flex items-center space-x-2"
                  >
                    <Upload size={18} />
                    <span>Choose Files</span>
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or</span>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => {
                      setNewImageUrl(e.target.value);
                      setImageValidationError(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isValidatingImage) {
                        addImage();
                      }
                    }}
                    className={`flex-1 bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none ${
                      imageValidationError ? 'ring-2 ring-red-500' : ''
                    }`}
                    placeholder="Enter image URL (http:// or https://)"
                    disabled={isValidatingImage}
                  />
                  <button
                    onClick={addImage}
                    disabled={isValidatingImage || !newImageUrl.trim()}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidatingImage ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        <span>Add URL</span>
                      </>
                    )}
                  </button>
                </div>
                {imageValidationError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                    {imageValidationError}
                  </div>
                )}
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => {
                    const loadStatus = imageLoadStatus[index] || 'loading';
                    const isError = loadStatus === 'error';
                    const isLoading = loadStatus === 'loading';

                    return (
                      <div
                        key={index}
                        className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                          formData.primaryImageIndex === index
                            ? 'border-indigo-600 ring-2 ring-indigo-200'
                            : isError
                            ? 'border-red-300'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="aspect-square bg-slate-100 relative">
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                              <Loader2 className="animate-spin text-indigo-600" size={32} />
                            </div>
                          )}
                          <img
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : isError ? 'opacity-50' : 'opacity-100'}`}
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              // Verify image actually loaded successfully
                              if (img.complete && img.naturalHeight !== 0) {
                                setImageLoadStatus(prev => {
                                  // Only update if still loading or not set
                                  if (!prev[index] || prev[index] === 'loading') {
                                    return { ...prev, [index]: 'loaded' };
                                  }
                                  return prev;
                                });
                              }
                            }}
                            onError={() => {
                              setImageLoadStatus(prev => {
                                // Only update if still loading or not set
                                if (!prev[index] || prev[index] === 'loading') {
                                  return { ...prev, [index]: 'error' };
                                }
                                return prev;
                              });
                            }}
                          />
                          {isError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-4">
                              <ImageIcon className="text-red-400 mb-2" size={32} />
                              <p className="text-xs text-red-600 font-medium text-center mb-2">Failed to load image</p>
                              <button
                                onClick={() => {
                                  setImageLoadStatus(prev => ({ ...prev, [index]: 'loading' }));
                                  // Force reload by updating src
                                  const img = document.querySelector(`img[alt="Product image ${index + 1}"]`) as HTMLImageElement;
                                  if (img) {
                                    img.src = '';
                                    setTimeout(() => {
                                      img.src = image;
                                    }, 100);
                                  }
                                }}
                                className="text-xs text-red-600 hover:text-red-700 underline"
                              >
                                Retry
                              </button>
                            </div>
                          )}
                          {formData.primaryImageIndex === index && !isError && (
                            <div className="absolute top-2 left-2 bg-indigo-600 text-white px-2 py-1 rounded-lg flex items-center space-x-1 text-[10px] font-bold uppercase tracking-widest z-10">
                              <Star size={12} fill="currentColor" />
                              <span>Primary</span>
                            </div>
                          )}
                          {isError && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest z-10">
                              Error
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
                            <div className="flex space-x-2">
                              {formData.primaryImageIndex !== index && (
                                <button
                                  onClick={() => setPrimaryImage(index)}
                                  className="p-2 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors"
                                  title="Set as primary"
                                >
                                  <Star size={18} className="text-indigo-600" />
                                </button>
                              )}
                              <button
                                onClick={() => removeImage(index)}
                                className="p-2 bg-red-500/90 backdrop-blur text-white rounded-lg hover:bg-red-600 transition-colors"
                                title="Remove image"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {formData.images.length === 0 && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
                  <ImageIcon size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-500 font-medium">No images added yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add image URLs above to get started</p>
                </div>
              )}
            </div>
          </section>

          {/* Product Variants */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif text-slate-900">Product Variants</h2>
              <button
                onClick={openAddVariantModal}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <Plus size={16} />
                <span>Add Variant</span>
              </button>
            </div>
            
            {variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">SKU</th>
                      <th className="px-4 py-3">Color</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Price Override</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {variants.map((variant) => (
                      <tr key={variant.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono font-bold text-slate-900">{variant.sku}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{variant.color}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{variant.size}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {variant.price_override ? formatCurrency(parseFloat(variant.price_override)) : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900">{variant.stock}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            variant.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {variant.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => openEditVariantModal(variant)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              aria-label={`Edit ${variant.color} ${variant.size} variant`}
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => removeVariant(variant.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              aria-label={`Remove ${variant.color} ${variant.size} variant`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                <p className="text-slate-500 font-medium">No variants added</p>
                <p className="text-xs text-slate-400 mt-1">Add variants with different colors and sizes</p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Settings */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xl font-serif text-slate-900">Status & Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="product-status" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</label>
                <select
                  id="product-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Draft' | 'Live' })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option>Live</option>
                  <option>Draft</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">Featured Product</p>
                  <p className="text-xs text-slate-500">Show on homepage</p>
                </div>
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="sr-only peer"
                    aria-label="Toggle featured product"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Quick Stats */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-xl font-serif text-slate-900">Quick Stats</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Images</span>
                <span className="text-sm font-bold text-slate-900">{formData.images.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Variants</span>
                <span className="text-sm font-bold text-slate-900">{variants.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Stock</span>
                <span className="text-sm font-bold text-slate-900">{totalStock}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Unique Colors</span>
                <span className="text-sm font-bold text-slate-900">{uniqueColors.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Unique Sizes</span>
                <span className="text-sm font-bold text-slate-900">{uniqueSizes.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Categories</span>
                <span className="text-sm font-bold text-slate-900">{formData.selectedCategoryIds.length}</span>
              </div>
            </div>
          </section>

          {/* Variant Summary */}
          {variants.length > 0 && (
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-xl font-serif text-slate-900">Variant Summary</h2>
              
              {uniqueColors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Colors</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueColors.map((color) => (
                      <span key={color} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {uniqueSizes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sizes</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueSizes.map((size) => (
                      <span key={size} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Variant Modal */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-slate-900">
                {editingVariant ? 'Edit Variant' : 'Add Variant'}
              </h3>
              <button 
                onClick={() => setIsVariantModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                aria-label="Close variant modal"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Color <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={variantForm.color}
                    onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., Midnight"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Size
                  </label>
                  <input
                    type="text"
                    value={variantForm.size}
                    onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., M (Defaults to 'One Size')"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  SKU (Auto-generated if empty)
                </label>
                <input
                  type="text"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  placeholder="Leave empty to auto-generate"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Price Override
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={variantForm.price_override}
                    onChange={(e) => setVariantForm({ ...variantForm, price_override: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Leave empty for base price"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variantForm.stock}
                    onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">Active</p>
                  <p className="text-xs text-slate-500">Show variant for sale</p>
                </div>
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={variantForm.is_active}
                    onChange={(e) => setVariantForm({ ...variantForm, is_active: e.target.checked })}
                    className="sr-only peer"
                    aria-label="Toggle variant active status"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setIsVariantModalOpen(false)}
                className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleVariantSave}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Save size={18} />
                <span>{editingVariant ? 'Update' : 'Add'} Variant</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Creation Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-slate-900">
                Add New Category
              </h3>
              <button 
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setNewCategoryName('');
                }}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                aria-label="Close category modal"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !creatingCategory) {
                      handleCreateCategory();
                    }
                  }}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter category name"
                  disabled={creatingCategory}
                />
              </div>

              {categoryCreateError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                  {categoryCreateError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setNewCategoryName('');
                }}
                className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                disabled={creatingCategory}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingCategory ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Create Category</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-slate-900">
                Image Validation Results
              </h3>
              <button 
                onClick={() => {
                  setShowValidationModal(false);
                  setPendingSave(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                aria-label="Close validation modal"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Some images failed validation. You can proceed with saving, but these images may not display correctly.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {imageValidationResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border ${
                      result.valid
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold mb-1 ${
                          result.valid ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.valid ? '✓ Valid' : '✗ Invalid'}
                        </p>
                        <p className="text-xs text-slate-600 truncate" title={result.url}>
                          {result.url}
                        </p>
                        {result.error && (
                          <p className="text-xs text-red-600 mt-1">{result.error}</p>
                        )}
                      </div>
                      {!result.valid && (
                        <button
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            setFormData({
                              ...formData,
                              images: newImages,
                              primaryImageIndex: formData.primaryImageIndex >= newImages.length 
                                ? Math.max(0, newImages.length - 1)
                                : formData.primaryImageIndex,
                            });
                            setImageValidationResults(
                              imageValidationResults.filter((_, i) => i !== index)
                            );
                          }}
                          className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
                          title="Remove invalid image"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowValidationModal(false);
                  setPendingSave(false);
                }}
                className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  proceedWithSave();
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Save size={18} />
                <span>Save Anyway</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;
