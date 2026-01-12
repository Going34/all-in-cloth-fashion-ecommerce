import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { authActions } from './authSlice';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

function* fetchAuthDataSaga(): Generator<any, void, unknown> {
  try {
    yield put(authActions.fetchAuthDataRequest());

    const sessionResult = (yield call(
      [supabase.auth, 'getSession']
    )) as { data: { session: any } };

    const session = sessionResult.data?.session;

    if (session?.user) {
      const profileResult = (yield call(
        [supabase.from('users').select('*').eq('id', session.user.id), 'single']
      )) as { data: any; error: any };

      if (profileResult.data && !profileResult.error) {
        const rolesResult = (yield call(
          [supabase.from('user_roles').select('role_id, roles(id, name)').eq('user_id', session.user.id), 'maybeSingle']
        )) as { data: any[] };

        const roles = rolesResult?.data?.flatMap((ur: any) => ur.roles || []).filter(Boolean) || [];

        yield put(authActions.fetchAuthDataSuccess({
          user: { ...profileResult.data, roles },
          session,
        }));
      } else {
        yield put(authActions.fetchAuthDataSuccess({ user: null, session: null }));
      }
    } else {
      yield put(authActions.fetchAuthDataSuccess({ user: null, session: null }));
    }
  } catch (error: any) {
    yield put(authActions.fetchAuthDataFailure(error.message || 'Failed to fetch auth data'));
  }
}

function* loginSaga(action: ReturnType<typeof authActions.loginRequest>): Generator<any, void, unknown> {
  try {
    const result: { data: any; error: any } = (yield call(
      [supabase.auth, 'signInWithPassword'],
      {
        email: action.payload.email,
        password: action.payload.password,
      }
    )) as any;

    if (result.error) {
      yield put(authActions.loginFailure(result.error.message));
      return;
    }

    if (result.data?.user) {
      const profileResult: { data: any; error: any } = (yield call(
        [supabase.from('users').select('*').eq('id', result.data.user.id), 'single']
      )) as any;

      if (profileResult.data && !profileResult.error) {
        const rolesResult: { data: any[] } = (yield call(
          [supabase.from('user_roles').select('role_id, roles(id, name)').eq('user_id', result.data.user.id), 'maybeSingle']
        )) as any;

        const roles = rolesResult?.data?.flatMap((ur: any) => ur.roles || []).filter(Boolean) || [];

        yield put(authActions.loginSuccess({
          user: { ...profileResult.data, roles },
          session: result.data.session,
        }));
      } else {
        yield put(authActions.loginSuccess({
          user: null,
          session: result.data.session,
        }));
      }
    }
  } catch (error: any) {
    yield put(authActions.loginFailure(error.message || 'Login failed'));
  }
}

function* logoutSaga(): Generator<any, void, unknown> {
  try {
    yield call([supabase.auth, 'signOut']);
    yield put(authActions.logoutSuccess());
  } catch (error: any) {
    yield put(authActions.logoutFailure(error.message || 'Logout failed'));
  }
}

function* refreshUserSaga(): Generator<any, void, unknown> {
  try {
    const result: { data: { user: any } } = (yield call([supabase.auth, 'getUser'])) as any;
    const authUser = result.data?.user;

    if (authUser) {
      const profileResult: { data: any; error: any } = (yield call(
        [supabase.from('users').select('*').eq('id', authUser.id), 'single']
      )) as any;

      if (profileResult.data && !profileResult.error) {
        const rolesResult: { data: any[] } = (yield call(
          [supabase.from('user_roles').select('role_id, roles(id, name)').eq('user_id', authUser.id), 'maybeSingle']
        )) as any;

        const roles = rolesResult?.data?.flatMap((ur: any) => ur.roles || []).filter(Boolean) || [];

        yield put(authActions.refreshUserSuccess({ ...profileResult.data, roles }));
      }
    }
  } catch (error: any) {
    yield put(authActions.refreshUserFailure(error.message || 'Failed to refresh user'));
  }
}

export function* authSaga(): Generator<any, void, unknown> {
  yield takeLatest(authActions.fetchAuthDataRequest.type, fetchAuthDataSaga);
  yield takeEvery(authActions.loginRequest.type, loginSaga);
  yield takeEvery(authActions.logoutRequest.type, logoutSaga);
  yield takeEvery(authActions.refreshUserRequest.type, refreshUserSaga);
}

