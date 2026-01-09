import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { addressesActions } from './addressesSlice';
import type { Address, AddressInput } from '@/types';

function* fetchAddressesSaga() {
  try {
    const config = {
      url: '/addresses',
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    const addresses = Array.isArray(transformedData) ? transformedData : [];

    yield put(addressesActions.fetchAddressesSuccess(addresses));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(addressesActions.fetchAddressesFailure(processedError.message));
  }
}

function* fetchDefaultAddressSaga() {
  try {
    const config = {
      url: '/addresses',
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    const addresses = Array.isArray(transformedData) ? transformedData : [];
    const defaultAddress = addresses.find((addr: Address) => addr.is_default) || null;

    yield put(addressesActions.fetchDefaultAddressSuccess(defaultAddress));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(addressesActions.fetchDefaultAddressFailure(processedError.message));
  }
}

function* createAddressSaga(action: ReturnType<typeof addressesActions.createAddressRequest>) {
  try {
    const config = {
      url: '/addresses',
      method: 'POST' as const,
      data: action.payload,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(addressesActions.createAddressSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(addressesActions.createAddressFailure(processedError.message));
  }
}

function* updateAddressSaga(action: ReturnType<typeof addressesActions.updateAddressRequest>) {
  try {
    const config = {
      url: `/addresses/${action.payload.id}`,
      method: 'PUT' as const,
      data: action.payload.updates,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(addressesActions.updateAddressSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(addressesActions.updateAddressFailure(processedError.message));
  }
}

function* deleteAddressSaga(action: ReturnType<typeof addressesActions.deleteAddressRequest>) {
  try {
    const config = {
      url: `/addresses/${action.payload}`,
      method: 'DELETE' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(addressesActions.deleteAddressSuccess(action.payload));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(addressesActions.deleteAddressFailure(processedError.message));
  }
}

function* setDefaultAddressSaga(action: ReturnType<typeof addressesActions.setDefaultAddressRequest>) {
  try {
    const config = {
      url: `/addresses/${action.payload}/default`,
      method: 'PUT' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(addressesActions.setDefaultAddressSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(addressesActions.setDefaultAddressFailure(processedError.message));
  }
}

export function* addressesSaga() {
  yield takeLatest(addressesActions.fetchAddressesRequest.type, fetchAddressesSaga);
  yield takeLatest(addressesActions.fetchDefaultAddressRequest.type, fetchDefaultAddressSaga);
  yield takeEvery(addressesActions.createAddressRequest.type, createAddressSaga);
  yield takeEvery(addressesActions.updateAddressRequest.type, updateAddressSaga);
  yield takeEvery(addressesActions.deleteAddressRequest.type, deleteAddressSaga);
  yield takeEvery(addressesActions.setDefaultAddressRequest.type, setDefaultAddressSaga);
}

