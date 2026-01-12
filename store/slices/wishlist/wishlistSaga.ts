import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { wishlistActions } from './wishlistSlice';
import type { Product } from '@/types';

function* fetchWishlistSaga(): Generator<any, void, unknown> {
  try {
    const config = {
      url: '/wishlist',
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    const wishlist = Array.isArray(transformedData) ? transformedData : [];

    yield put(wishlistActions.fetchWishlistSuccess(wishlist));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(wishlistActions.fetchWishlistFailure(processedError.message));
  }
}

function* addToWishlistSaga(action: ReturnType<typeof wishlistActions.addToWishlistRequest>): Generator<any, void, unknown> {
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
    const transformedData = apiInterceptor.response(response as any);

    // After adding, fetch the updated wishlist to get the full product data
    yield put(wishlistActions.fetchWishlistRequest());
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(wishlistActions.addToWishlistFailure(processedError.message));
  }
}

function* removeFromWishlistSaga(action: ReturnType<typeof wishlistActions.removeFromWishlistRequest>): Generator<any, void, unknown> {
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
    const transformedData = apiInterceptor.response(response as any);

    yield put(wishlistActions.removeFromWishlistSuccess(action.payload));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(wishlistActions.removeFromWishlistFailure(processedError.message));
  }
}

export function* wishlistSaga(): Generator<any, void, unknown> {
  yield takeLatest(wishlistActions.fetchWishlistRequest.type, fetchWishlistSaga);
  yield takeEvery(wishlistActions.addToWishlistRequest.type, addToWishlistSaga);
  yield takeEvery(wishlistActions.removeFromWishlistRequest.type, removeFromWishlistSaga);
}
