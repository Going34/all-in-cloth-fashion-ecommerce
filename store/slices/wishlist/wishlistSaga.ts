import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { wishlistActions } from './wishlistSlice';
import type { Product } from '@/types';

function* fetchWishlistSaga() {
  try {
    const config = {
      url: '/wishlist',
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    const wishlist = Array.isArray(transformedData) ? transformedData : [];

    yield put(wishlistActions.fetchWishlistSuccess(wishlist));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(wishlistActions.fetchWishlistFailure(processedError.message));
  }
}

function* addToWishlistSaga(action: ReturnType<typeof wishlistActions.addToWishlistRequest>) {
  try {
    const config = {
      url: '/wishlist',
      method: 'POST' as const,
      data: {
        product_id: action.payload,
      },
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    // After adding, fetch the updated wishlist to get the full product data
    yield put(wishlistActions.fetchWishlistRequest());
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(wishlistActions.addToWishlistFailure(processedError.message));
  }
}

function* removeFromWishlistSaga(action: ReturnType<typeof wishlistActions.removeFromWishlistRequest>) {
  try {
    const config = {
      url: '/wishlist',
      method: 'DELETE' as const,
      params: {
        product_id: action.payload,
      },
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(wishlistActions.removeFromWishlistSuccess(action.payload));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(wishlistActions.removeFromWishlistFailure(processedError.message));
  }
}

export function* wishlistSaga() {
  yield takeLatest(wishlistActions.fetchWishlistRequest.type, fetchWishlistSaga);
  yield takeEvery(wishlistActions.addToWishlistRequest.type, addToWishlistSaga);
  yield takeEvery(wishlistActions.removeFromWishlistRequest.type, removeFromWishlistSaga);
}
