import { call, put, takeEvery } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { teamActions } from './teamSlice';

function* fetchTeamSaga(): Generator<any, void, unknown> {
  try {
    const config = {
      url: '/admin/team',
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    yield put(teamActions.fetchTeamDataSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(teamActions.fetchTeamDataFailure(processedError.message));
  }
}

function* inviteTeamMemberSaga(action: ReturnType<typeof teamActions.inviteTeamMemberRequest>): Generator<any, void, unknown> {
  try {
    const config = {
      url: '/admin/team/invite',
      method: 'POST' as const,
      data: action.payload,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    yield put(teamActions.inviteTeamMemberSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(teamActions.inviteTeamMemberFailure(processedError.message));
  }
}

function* updateTeamMemberRoleSaga(action: ReturnType<typeof teamActions.updateTeamMemberRoleRequest>): Generator<any, void, unknown> {
  try {
    const config = {
      url: `/admin/team/${action.payload.userId}/role`,
      method: 'PUT' as const,
      data: { role: action.payload.role },
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    yield put(teamActions.updateTeamMemberRoleSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(teamActions.updateTeamMemberRoleFailure(processedError.message));
  }
}

function* removeTeamMemberSaga(action: ReturnType<typeof teamActions.removeTeamMemberRequest>): Generator<any, void, unknown> {
  try {
    const config = {
      url: `/admin/team/${action.payload}`,
      method: 'DELETE' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    yield call(apiClient.request, interceptedConfig);

    yield put(teamActions.removeTeamMemberSuccess(action.payload));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(teamActions.removeTeamMemberFailure(processedError.message));
  }
}

export function* teamSaga(): Generator<any, void, unknown> {
  yield takeEvery(teamActions.fetchTeamDataRequest.type, fetchTeamSaga);
  yield takeEvery(teamActions.inviteTeamMemberRequest.type, inviteTeamMemberSaga);
  yield takeEvery(teamActions.updateTeamMemberRoleRequest.type, updateTeamMemberRoleSaga);
  yield takeEvery(teamActions.removeTeamMemberRequest.type, removeTeamMemberSaga);
}

