import { call, put, takeEvery, takeLatest, select } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { ordersActions } from './ordersSlice';
import { toastActions } from '../toast/toastSlice';
import type { RootState } from '../../types';
import type { AxiosError, AxiosResponse } from 'axios';
import type { Order } from '@/types';
import type { ApiResponse } from '../../api/interceptor';

function* fetchOrdersSaga(action: ReturnType<typeof ordersActions.fetchOrdersDataRequest>): Generator<unknown, void, unknown> {
  try {
    const config = {
      url: '/admin/orders',
      method: 'GET' as const,
      params: action.payload || {},
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = (yield call(apiClient.request, interceptedConfig)) as AxiosResponse;
    const transformedData = apiInterceptor.response(response) as {
      orders?: unknown[];
      pagination?: unknown;
    };

    const pagination =
      transformedData.pagination &&
      typeof transformedData.pagination === 'object' &&
      transformedData.pagination !== null &&
      'page' in transformedData.pagination &&
      'limit' in transformedData.pagination &&
      'total' in transformedData.pagination &&
      'totalPages' in transformedData.pagination
        ? (transformedData.pagination as {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          })
        : { page: 1, limit: 20, total: 0, totalPages: 0 };

    yield put(ordersActions.fetchOrdersDataSuccess({
      orders: (Array.isArray(transformedData.orders) ? transformedData.orders : []) as unknown as Order[],
      pagination,
    }));
  } catch (error: unknown) {
    const processedError = apiInterceptor.error(error as unknown as AxiosError<ApiResponse>);
    yield put(ordersActions.fetchOrdersDataFailure(processedError.message));
  }
}

function* fetchOrderByIdSaga(action: ReturnType<typeof ordersActions.fetchOrderByIdRequest>): Generator<unknown, void, unknown> {
  try {
    const config = {
      url: `/admin/orders/${action.payload}`,
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = (yield call(apiClient.request, interceptedConfig)) as AxiosResponse;
    const transformedData = apiInterceptor.response(response) as unknown;

    yield put(ordersActions.fetchOrderByIdSuccess(transformedData as Order | null));
  } catch (error: unknown) {
    const processedError = apiInterceptor.error(error as unknown as AxiosError<ApiResponse>);
    yield put(ordersActions.fetchOrderByIdFailure(processedError.message));
  }
}

function* updateOrderStatusSaga(action: ReturnType<typeof ordersActions.updateOrderStatusRequest>): Generator<unknown, void, unknown> {
  try {
    const config = {
      url: `/admin/orders/${action.payload.id}/status`,
      method: 'PUT' as const,
      data: {
        status: action.payload.status,
        notes: action.payload.notes,
      },
    };

	    const interceptedConfig = apiInterceptor.request(config);
	    const response = (yield call(apiClient.request, interceptedConfig)) as AxiosResponse;
	    const transformedData = apiInterceptor.response(response) as unknown;

	    yield put(ordersActions.updateOrderStatusSuccess(transformedData));
	    yield put(toastActions.showToast('Order status updated successfully', 'success'));
	  } catch (error: unknown) {
	    const processedError = apiInterceptor.error(error as unknown as AxiosError<ApiResponse>);
	    yield put(ordersActions.updateOrderStatusFailure(processedError.message));
	    yield put(toastActions.showToast(processedError.message || 'Failed to update order status', 'error'));
	  }
}

function* fetchUserOrdersSaga(action: ReturnType<typeof ordersActions.fetchUserOrdersRequest>): Generator<unknown, void, unknown> {
  try {
    const filters = action.payload || {};
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.limit) params.limit = filters.limit.toString();

    const config = {
      url: '/orders/history',
      method: 'GET' as const,
      params,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = (yield call(apiClient.request, interceptedConfig)) as AxiosResponse;
    const transformedData = apiInterceptor.response(response) as {
      orders?: unknown[];
      nextCursor?: string | null;
      hasMore?: boolean;
    };

    yield put(ordersActions.fetchUserOrdersSuccess({
      orders: (Array.isArray(transformedData.orders) ? transformedData.orders : []) as unknown as Order[],
      nextCursor: transformedData.nextCursor || null,
      hasMore: Boolean(transformedData.hasMore),
    }));
  } catch (error: unknown) {
    const processedError = apiInterceptor.error(error as unknown as AxiosError<ApiResponse>);
    yield put(ordersActions.fetchUserOrdersFailure(processedError.message));
  }
}

function* fetchUserOrdersNextPageSaga(): Generator<unknown, void, unknown> {
  try {
    const state = (yield select((s: RootState) => s.orders)) as RootState['orders'] & {
      historyCursor?: string | null;
      filters?: { limit?: number; status?: string };
    };
    const cursor = state.historyCursor || null;
    const limit = state.filters?.limit || 10;
    if (!cursor) {
      yield put(ordersActions.fetchUserOrdersNextPageSuccess({ orders: [], nextCursor: null, hasMore: false }));
      return;
    }

    const params: Record<string, string> = { cursor, limit: String(limit) };
    if (state.filters?.status) params.status = state.filters.status;

    const config = {
      url: '/orders/history',
      method: 'GET' as const,
      params,
    };
    const interceptedConfig = apiInterceptor.request(config);
    const response = (yield call(apiClient.request, interceptedConfig)) as AxiosResponse;
    const transformedData = apiInterceptor.response(response) as {
      orders?: unknown[];
      nextCursor?: string | null;
      hasMore?: boolean;
    };

    yield put(ordersActions.fetchUserOrdersNextPageSuccess({
      orders: (Array.isArray(transformedData.orders) ? transformedData.orders : []) as unknown as Order[],
      nextCursor: transformedData.nextCursor || null,
      hasMore: Boolean(transformedData.hasMore),
    }));
  } catch (error: unknown) {
    const processedError = apiInterceptor.error(error as unknown as AxiosError<ApiResponse>);
    yield put(ordersActions.fetchUserOrdersNextPageFailure(processedError.message));
  }
}

function* fetchUserOrderByIdSaga(action: ReturnType<typeof ordersActions.fetchUserOrderByIdRequest>): Generator<unknown, void, unknown> {
  try {
    const config = {
      url: `/orders/${action.payload}`,
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = (yield call(apiClient.request, interceptedConfig)) as AxiosResponse;
    const transformedData = apiInterceptor.response(response) as unknown;

    yield put(ordersActions.fetchUserOrderByIdSuccess(transformedData as Order | null));
  } catch (error: unknown) {
    const processedError = apiInterceptor.error(error as unknown as AxiosError<ApiResponse>);
    yield put(ordersActions.fetchUserOrderByIdFailure(processedError.message));
  }
}

function* createUserOrderSaga(action: ReturnType<typeof ordersActions.createUserOrderRequest>): Generator<unknown, void, unknown> {
  try {
    const config = {
      url: '/orders',
      method: 'POST' as const,
      data: action.payload,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = (yield call(apiClient.request, interceptedConfig)) as AxiosResponse;
    const transformedData = apiInterceptor.response(response) as unknown;

    yield put(ordersActions.createUserOrderSuccess(transformedData as unknown as Order));
  } catch (error: unknown) {
    const processedError = apiInterceptor.error(error as unknown as AxiosError<ApiResponse>);
    yield put(ordersActions.createUserOrderFailure(processedError.message));
  }
}

export function* ordersSaga(): Generator<unknown, void, unknown> {
  yield takeLatest(ordersActions.fetchOrdersDataRequest.type, fetchOrdersSaga);
  yield takeEvery(ordersActions.fetchOrderByIdRequest.type, fetchOrderByIdSaga);
  yield takeEvery(ordersActions.updateOrderStatusRequest.type, updateOrderStatusSaga);
  yield takeLatest(ordersActions.fetchUserOrdersRequest.type, fetchUserOrdersSaga);
  yield takeEvery(ordersActions.fetchUserOrdersNextPageRequest.type, fetchUserOrdersNextPageSaga);
  yield takeEvery(ordersActions.fetchUserOrderByIdRequest.type, fetchUserOrderByIdSaga);
  yield takeEvery(ordersActions.createUserOrderRequest.type, createUserOrderSaga);
}

