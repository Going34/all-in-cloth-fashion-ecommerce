import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { profileActions } from './profileSlice';
import type { User } from '@/types';

function* fetchProfileSaga(): Generator<any, void, unknown> {
  try {
    const config = {
      url: '/profile',
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    yield put(profileActions.fetchProfileSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(profileActions.fetchProfileFailure(processedError.message));
  }
}

function* updateProfileSaga(action: ReturnType<typeof profileActions.updateProfileRequest>): Generator<any, void, unknown> {
  try {
    const config = {
      url: '/profile',
      method: 'PUT' as const,
      data: action.payload,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    yield put(profileActions.updateProfileSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(profileActions.updateProfileFailure(processedError.message));
  }
}

export function* profileSaga(): Generator<any, void, unknown> {
  yield takeLatest(profileActions.fetchProfileRequest.type, fetchProfileSaga);
  yield takeEvery(profileActions.updateProfileRequest.type, updateProfileSaga);
}

