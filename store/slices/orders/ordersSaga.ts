import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { ordersActions } from './ordersSlice';

function* fetchOrdersSaga(action: ReturnType<typeof ordersActions.fetchOrdersDataRequest>) {
  try {
    const config = {
      url: '/admin/orders',
      method: 'GET' as const,
      params: action.payload || {},
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(ordersActions.fetchOrdersDataSuccess({
      orders: transformedData.orders || [],
      pagination: transformedData.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    }));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(ordersActions.fetchOrdersDataFailure(processedError.message));
  }
}

function* fetchOrderByIdSaga(action: ReturnType<typeof ordersActions.fetchOrderByIdRequest>) {
  try {
    const config = {
      url: `/admin/orders/${action.payload}`,
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(ordersActions.fetchOrderByIdSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(ordersActions.fetchOrderByIdFailure(processedError.message));
  }
}

function* updateOrderStatusSaga(action: ReturnType<typeof ordersActions.updateOrderStatusRequest>) {
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
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(ordersActions.updateOrderStatusSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(ordersActions.updateOrderStatusFailure(processedError.message));
  }
}

function* fetchUserOrdersSaga(action: ReturnType<typeof ordersActions.fetchUserOrdersRequest>) {
  try {
    const filters = action.payload || {};
    const params: Record<string, any> = {};
    
    if (filters.status) params.status = filters.status;
    if (filters.limit) params.limit = filters.limit.toString();

    const config = {
      url: '/orders',
      method: 'GET' as const,
      params,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    const orders = Array.isArray(transformedData) ? transformedData : [];

    yield put(ordersActions.fetchUserOrdersSuccess({
      orders,
    }));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(ordersActions.fetchUserOrdersFailure(processedError.message));
  }
}

function* fetchUserOrderByIdSaga(action: ReturnType<typeof ordersActions.fetchUserOrderByIdRequest>) {
  try {
    const config = {
      url: `/orders/${action.payload}`,
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(ordersActions.fetchUserOrderByIdSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(ordersActions.fetchUserOrderByIdFailure(processedError.message));
  }
}

function* createUserOrderSaga(action: ReturnType<typeof ordersActions.createUserOrderRequest>) {
  try {
    const config = {
      url: '/orders',
      method: 'POST' as const,
      data: action.payload,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(ordersActions.createUserOrderSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(ordersActions.createUserOrderFailure(processedError.message));
  }
}

export function* ordersSaga() {
  yield takeLatest(ordersActions.fetchOrdersDataRequest.type, fetchOrdersSaga);
  yield takeEvery(ordersActions.fetchOrderByIdRequest.type, fetchOrderByIdSaga);
  yield takeEvery(ordersActions.updateOrderStatusRequest.type, updateOrderStatusSaga);
  yield takeLatest(ordersActions.fetchUserOrdersRequest.type, fetchUserOrdersSaga);
  yield takeEvery(ordersActions.fetchUserOrderByIdRequest.type, fetchUserOrderByIdSaga);
  yield takeEvery(ordersActions.createUserOrderRequest.type, createUserOrderSaga);
}

