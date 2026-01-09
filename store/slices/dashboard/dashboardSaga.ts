import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { dashboardActions } from './dashboardSlice';

function* fetchDashboardStatsSaga(action: ReturnType<typeof dashboardActions.fetchDashboardStatsRequest>) {
  try {
    const config = {
      url: '/admin/dashboard/stats',
      method: 'GET' as const,
      params: { period: action.payload || '30d' },
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(dashboardActions.fetchDashboardStatsSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(dashboardActions.fetchDashboardStatsFailure(processedError.message));
  }
}

function* fetchSalesChartSaga(action: ReturnType<typeof dashboardActions.fetchSalesChartRequest>) {
  try {
    const config = {
      url: '/admin/dashboard/sales-chart',
      method: 'GET' as const,
      params: {
        period: action.payload.period || '30d',
        granularity: action.payload.granularity || 'day',
      },
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(dashboardActions.fetchSalesChartSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(dashboardActions.fetchSalesChartFailure(processedError.message));
  }
}

function* fetchInventoryAlertsSaga(action: ReturnType<typeof dashboardActions.fetchInventoryAlertsRequest>) {
  try {
    const config = {
      url: '/admin/dashboard/inventory-alerts',
      method: 'GET' as const,
      params: { limit: action.payload || 10 },
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(dashboardActions.fetchInventoryAlertsSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(dashboardActions.fetchInventoryAlertsFailure(processedError.message));
  }
}

export function* dashboardSaga() {
  yield takeLatest(dashboardActions.fetchDashboardStatsRequest.type, fetchDashboardStatsSaga);
  yield takeLatest(dashboardActions.fetchSalesChartRequest.type, fetchSalesChartSaga);
  yield takeLatest(dashboardActions.fetchInventoryAlertsRequest.type, fetchInventoryAlertsSaga);
}

