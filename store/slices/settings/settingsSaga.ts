import { call, put, takeEvery } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { settingsActions } from './settingsSlice';

function* fetchSettingsSaga() {
  try {
    const config = {
      url: '/admin/settings',
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(settingsActions.fetchSettingsSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(settingsActions.fetchSettingsFailure(processedError.message));
  }
}

function* updateSettingsSaga(action: ReturnType<typeof settingsActions.updateSettingsRequest>) {
  try {
    const config = {
      url: '/admin/settings',
      method: 'PUT' as const,
      data: action.payload,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(settingsActions.updateSettingsSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(settingsActions.updateSettingsFailure(processedError.message));
  }
}

export function* settingsSaga() {
  yield takeEvery(settingsActions.fetchSettingsRequest.type, fetchSettingsSaga);
  yield takeEvery(settingsActions.updateSettingsRequest.type, updateSettingsSaga);
}

