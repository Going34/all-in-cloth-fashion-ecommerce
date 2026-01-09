import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { inventoryActions } from './inventorySlice';

function* fetchInventorySaga(action: ReturnType<typeof inventoryActions.fetchInventoryDataRequest>) {
  try {
    const config = {
      url: '/admin/inventory',
      method: 'GET' as const,
      params: action.payload || {},
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(inventoryActions.fetchInventoryDataSuccess({
      items: transformedData.items || [],
      pagination: transformedData.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 },
    }));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(inventoryActions.fetchInventoryDataFailure(processedError.message));
  }
}

function* fetchInventoryStatsSaga() {
  try {
    const config = {
      url: '/admin/inventory/stats',
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(inventoryActions.fetchInventoryStatsSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(inventoryActions.fetchInventoryStatsFailure(processedError.message));
  }
}

function* updateStockSaga(action: ReturnType<typeof inventoryActions.updateStockRequest>) {
  try {
    const config = {
      url: `/admin/inventory/${action.payload.variantId}/stock`,
      method: 'PUT' as const,
      data: {
        action: action.payload.action,
        quantity: action.payload.quantity,
      },
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(inventoryActions.updateStockSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(inventoryActions.updateStockFailure(processedError.message));
  }
}

export function* inventorySaga() {
  yield takeLatest(inventoryActions.fetchInventoryDataRequest.type, fetchInventorySaga);
  yield takeEvery(inventoryActions.fetchInventoryStatsRequest.type, fetchInventoryStatsSaga);
  yield takeEvery(inventoryActions.updateStockRequest.type, updateStockSaga);
}

