import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { productsActions } from './productsSlice';
import type { ProductFilters, UserProductFilters } from './productsSlice';
import type { Product } from '@/types';

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

function* fetchProductsSaga(action: ReturnType<typeof productsActions.fetchProductsDataRequest>) {
  try {
    const config = {
      url: '/admin/products',
      method: 'GET' as const,
      params: action.payload || {},
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

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

function* fetchProductByIdSaga(action: ReturnType<typeof productsActions.fetchProductByIdRequest>) {
  try {
    const config = {
      url: `/admin/products/${action.payload}`,
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    // Transform product from API format (camelCase) to Product type (snake_case)
    const product = transformApiProductToProduct(transformedData);

    yield put(productsActions.fetchProductByIdSuccess(product));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(productsActions.fetchProductByIdFailure(processedError.message));
  }
}

function* createProductSaga(action: ReturnType<typeof productsActions.createProductRequest>) {
  try {
    const config = {
      url: '/admin/products',
      method: 'POST' as const,
      data: action.payload,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    // Transform product from API format (camelCase) to Product type (snake_case)
    const product = transformApiProductToProduct(transformedData);

    yield put(productsActions.createProductSuccess(product));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(productsActions.createProductFailure(processedError.message));
  }
}

function* updateProductSaga(action: ReturnType<typeof productsActions.updateProductRequest>) {
  try {
    const config = {
      url: `/admin/products/${action.payload.id}`,
      method: 'PUT' as const,
      data: action.payload.data,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    // Transform product from API format (camelCase) to Product type (snake_case)
    const product = transformApiProductToProduct(transformedData);

    yield put(productsActions.updateProductSuccess(product));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(productsActions.updateProductFailure(processedError.message));
  }
}

function* deleteProductSaga(action: ReturnType<typeof productsActions.deleteProductRequest>) {
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

function* fetchUserProductsSaga(action: ReturnType<typeof productsActions.fetchUserProductsRequest>) {
  try {
    const filters = action.payload || {};
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
    const transformedData = apiInterceptor.response(response);

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

function* fetchUserProductByIdSaga(action: ReturnType<typeof productsActions.fetchUserProductByIdRequest>) {
  try {
    const config = {
      url: `/products/${action.payload}`,
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    // Transform product from API format (camelCase) to Product type (snake_case)
    // This ensures variants and inventory are properly mapped
    const product = transformApiProductToProduct(transformedData);

    yield put(productsActions.fetchUserProductByIdSuccess(product));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(productsActions.fetchUserProductByIdFailure(processedError.message));
  }
}

export function* productsSaga() {
  yield takeLatest(productsActions.fetchProductsDataRequest.type, fetchProductsSaga);
  yield takeEvery(productsActions.fetchProductByIdRequest.type, fetchProductByIdSaga);
  yield takeEvery(productsActions.createProductRequest.type, createProductSaga);
  yield takeEvery(productsActions.updateProductRequest.type, updateProductSaga);
  yield takeEvery(productsActions.deleteProductRequest.type, deleteProductSaga);
  yield takeLatest(productsActions.fetchUserProductsRequest.type, fetchUserProductsSaga);
  yield takeEvery(productsActions.fetchUserProductByIdRequest.type, fetchUserProductByIdSaga);
}

