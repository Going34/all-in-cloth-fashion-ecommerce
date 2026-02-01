import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { productsActions } from './productsSlice';
import type { ProductFilters, UserProductFilters, ProductsState } from './productsSlice';
import type { Product } from '@/types';
import type { RootState } from '../../types';

// Helper function to transform API response product from camelCase to snake_case
// Handles both camelCase (from list API) and snake_case (from get by id API) formats
function transformApiProductToProduct(apiProduct: any): Product {
  if (!apiProduct || typeof apiProduct !== 'object') {
    throw new Error('Invalid product data received');
  }
  
  // If already in snake_case format (from get by id), just ensure base_price exists
  if (apiProduct.base_price !== undefined) {
    return {
      ...apiProduct,
      base_price: typeof apiProduct.base_price === 'number' ? apiProduct.base_price : parseFloat(apiProduct.base_price) || 0,
    } as Product;
  }
  
  // If in camelCase format (from list API), transform it
  const { basePrice, createdAt, updatedAt, variantCount, totalStock, ...rest } = apiProduct;
  return {
    ...rest,
    base_price: basePrice !== undefined 
      ? (typeof basePrice === 'number' ? basePrice : parseFloat(basePrice) || 0)
      : (apiProduct.base_price !== undefined 
          ? (typeof apiProduct.base_price === 'number' ? apiProduct.base_price : parseFloat(apiProduct.base_price) || 0)
          : 0),
    created_at: createdAt ?? apiProduct.created_at,
    updated_at: updatedAt ?? apiProduct.updated_at,
    // Preserve variantCount and totalStock from API response for list view
    variantCount: variantCount !== undefined ? variantCount : undefined,
    totalStock: totalStock !== undefined ? totalStock : undefined,
  } as Product;
}

function* fetchProductsSaga(action: ReturnType<typeof productsActions.fetchProductsDataRequest>): Generator<any, void, unknown> {
  try {
    const config = {
      url: '/admin/products',
      method: 'GET' as const,
      params: action.payload || {},
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    // Transform products from API format (camelCase) to Product type (snake_case)
    const products = (transformedData.products || []).map(transformApiProductToProduct);

    yield put(productsActions.fetchProductsDataSuccess({
      products,
      pagination: transformedData.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    }));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(productsActions.fetchProductsDataFailure(processedError.message));
  }
}

function* fetchProductByIdSaga(action: ReturnType<typeof productsActions.fetchProductByIdRequest>): Generator<any, void, unknown> {
  try {
    const productId = action.payload;
    
    // Check if product exists in cache
    const productsState = (yield select((state: RootState) => state.products)) as ProductsState;
    const cachedProduct = productsState.productsCache[productId];
    
    if (cachedProduct) {
      // Product found in cache, use it instead of making API call
      yield put(productsActions.fetchProductByIdSuccess(cachedProduct));
      return;
    }
    
    // Product not in cache, fetch from API
    const config = {
      url: `/admin/products/${productId}`,
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    // Transform product from API format (camelCase) to Product type (snake_case)
    const product = transformApiProductToProduct(transformedData);

    yield put(productsActions.fetchProductByIdSuccess(product));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(productsActions.fetchProductByIdFailure(processedError.message));
  }
}

function* createProductSaga(action: ReturnType<typeof productsActions.createProductRequest>): Generator<any, void, unknown> {
  try {
    const config = {
      url: '/admin/products',
      method: 'POST' as const,
      data: action.payload,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    // Transform product from API format (camelCase) to Product type (snake_case)
    const product = transformApiProductToProduct(transformedData);

    yield put(productsActions.createProductSuccess(product));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(productsActions.createProductFailure(processedError.message));
  }
}

function* updateProductSaga(action: ReturnType<typeof productsActions.updateProductRequest>): Generator<any, void, unknown> {
  try {
    const config = {
      url: `/admin/products/${action.payload.id}`,
      method: 'PUT' as const,
      data: action.payload.data,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    // Transform product from API format (camelCase) to Product type (snake_case)
    const product = transformApiProductToProduct(transformedData);

    yield put(productsActions.updateProductSuccess(product));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(productsActions.updateProductFailure(processedError.message));
  }
}

function* deleteProductSaga(action: ReturnType<typeof productsActions.deleteProductRequest>): Generator<any, void, unknown> {
  try {
    const config = {
      url: `/admin/products/${action.payload}`,
      method: 'DELETE' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    yield call(apiClient.request, interceptedConfig);

    yield put(productsActions.deleteProductSuccess(action.payload));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    // Ensure we have a user-friendly error message
    const errorMessage = processedError.message || 'Failed to delete product. Please try again.';
    yield put(productsActions.deleteProductFailure(errorMessage));
  }
}

function* fetchUserProductsSaga(action: ReturnType<typeof productsActions.fetchUserProductsRequest>): Generator<any, void, unknown> {
  try {
    // Check if products are already loaded in Redux
    const productsState = (yield select((state: RootState) => state.products)) as ProductsState;
    const filters = action.payload || {};
    
    // If products are already loaded and we're just filtering (not fetching new data), skip API call
    if (productsState.productsLoaded && Object.keys(productsState.productsCache).length > 0) {
      // Products already in cache, filter from cache instead of making API call
      const cachedProducts = Object.values(productsState.productsCache) as Product[];
      let filteredProducts = cachedProducts;
      
      // Apply filters to cached products
      if (filters.status) {
        filteredProducts = filteredProducts.filter((p: Product) => p.status === filters.status);
      }
      if (filters.categoryId) {
        filteredProducts = filteredProducts.filter((p: Product) => 
          p.categories?.some((c: { id: string }) => c.id === filters.categoryId)
        );
      }
      if (filters.featured !== undefined) {
        filteredProducts = filteredProducts.filter((p: Product) => p.featured === filters.featured);
      }
      
      // Return filtered products from cache without making API call
      yield put(productsActions.fetchUserProductsSuccess({
        products: filteredProducts,
      }));
      return;
    }
    
    // Products not loaded yet, fetch from API
    const params: Record<string, any> = {};
    
    if (filters.cursor) params.cursor = filters.cursor;
    if (filters.limit) params.limit = filters.limit.toString();
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.featured !== undefined) params.featured = filters.featured.toString();
    if (filters.status) params.status = filters.status;

    const config = {
      url: '/products',
      method: 'GET' as const,
      params,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    // Transform products from API format (camelCase) to Product type (snake_case)
    const productsArray = Array.isArray(transformedData) ? transformedData : [];
    const products = productsArray.map(transformApiProductToProduct);

    yield put(productsActions.fetchUserProductsSuccess({
      products,
    }));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(productsActions.fetchUserProductsFailure(processedError.message));
  }
}

function* fetchUserProductByIdSaga(action: ReturnType<typeof productsActions.fetchUserProductByIdRequest>): Generator<any, void, unknown> {
  try {
    const productId = action.payload;
    
    // Check if product exists in cache
    const productsState = (yield select((state: RootState) => state.products)) as ProductsState;
    const cachedProduct = productsState.productsCache[productId];
    
    if (cachedProduct) {
      // Product found in cache, use it instead of making API call
      yield put(productsActions.fetchUserProductByIdSuccess(cachedProduct));
      return;
    }
    
    // Product not in cache, fetch from API
    const config = {
      url: `/products/${productId}`,
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    // Transform product from API format (camelCase) to Product type (snake_case)
    // This ensures variants and inventory are properly mapped
    const product = transformApiProductToProduct(transformedData);

    yield put(productsActions.fetchUserProductByIdSuccess(product));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(productsActions.fetchUserProductByIdFailure(processedError.message));
  }
}

export function* productsSaga(): Generator<any, void, unknown> {
  yield takeLatest(productsActions.fetchProductsDataRequest.type, fetchProductsSaga);
  yield takeEvery(productsActions.fetchProductByIdRequest.type, fetchProductByIdSaga);
  yield takeEvery(productsActions.createProductRequest.type, createProductSaga);
  yield takeEvery(productsActions.updateProductRequest.type, updateProductSaga);
  yield takeEvery(productsActions.deleteProductRequest.type, deleteProductSaga);
  yield takeLatest(productsActions.fetchUserProductsRequest.type, fetchUserProductsSaga);
  yield takeEvery(productsActions.fetchUserProductByIdRequest.type, fetchUserProductByIdSaga);
}

