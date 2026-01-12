import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { customersActions } from './customersSlice';

function* fetchCustomersSaga(action: ReturnType<typeof customersActions.fetchCustomersDataRequest>): Generator<any, void, unknown> {
  try {
    const config = {
      url: '/admin/customers',
      method: 'GET' as const,
      params: action.payload || {},
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    yield put(customersActions.fetchCustomersDataSuccess({
      customers: transformedData.customers || [],
      pagination: transformedData.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    }));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(customersActions.fetchCustomersDataFailure(processedError.message));
  }
}

function* fetchCustomerByIdSaga(action: ReturnType<typeof customersActions.fetchCustomerByIdRequest>): Generator<any, void, unknown> {
  try {
    const config = {
      url: `/admin/customers/${action.payload}`,
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    yield put(customersActions.fetchCustomerByIdSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(customersActions.fetchCustomerByIdFailure(processedError.message));
  }
}

export function* customersSaga(): Generator<any, void, unknown> {
  yield takeLatest(customersActions.fetchCustomersDataRequest.type, fetchCustomersSaga);
  yield takeEvery(customersActions.fetchCustomerByIdRequest.type, fetchCustomerByIdSaga);
}

