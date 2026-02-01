import { call, put, select, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { userDataActions } from './userDataSlice';
import { addressesActions } from '../addresses/addressesSlice';
import { wishlistActions } from '../wishlist/wishlistSlice';
import { profileActions } from '../profile/profileSlice';
import type { RootState } from '../../types';
import type { UserDataState } from './userDataSlice';
import type { AxiosError, AxiosResponse } from 'axios';
import type { ApiResponse } from '../../api/interceptor';
import type { User, Address, Product } from '@/types';

function* fetchUserDataSaga(): Generator<unknown, void, unknown> {
  try {
    // Check if user data is already loaded
    const userDataState = (yield select((state: RootState) => state.userData)) as UserDataState;
    
    if (userDataState.loaded) {
      // Data already loaded, update individual slices from cache without API call
      if (userDataState.profile) {
        yield put(profileActions.batchUpdateProfile(userDataState.profile));
      }
      if (userDataState.addresses.length > 0) {
        yield put(addressesActions.batchUpdateAddresses(userDataState.addresses));
      }
      if (userDataState.wishlist.length > 0) {
        yield put(wishlistActions.batchUpdateWishlist(userDataState.wishlist));
      }
      return;
    }

    // Data not loaded, fetch from API
    const config = {
      url: '/user-data',
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = (yield call(apiClient.request, interceptedConfig)) as AxiosResponse;
    const transformedData = apiInterceptor.response(response) as {
      profile?: unknown;
      addresses?: unknown[];
      wishlist?: unknown[];
    };

    const { profile, addresses, wishlist } = transformedData;

    // Update userData slice
    yield put(userDataActions.fetchUserDataSuccess({
      profile: (profile as User) || null,
      addresses: (addresses as Address[]) || [],
      wishlist: (wishlist as Product[]) || [],
    }));

    // Update individual slices for backward compatibility
    if (profile) {
      yield put(profileActions.batchUpdateProfile(profile as User));
    }
    if (addresses && addresses.length > 0) {
      yield put(addressesActions.batchUpdateAddresses(addresses as Address[]));
    }
    if (wishlist && wishlist.length > 0) {
      yield put(wishlistActions.batchUpdateWishlist(wishlist as Product[]));
    }
  } catch (error: unknown) {
    const processedError = apiInterceptor.error(error as unknown as AxiosError<ApiResponse>);
    yield put(userDataActions.fetchUserDataFailure(processedError.message));
  }
}

export function* userDataSaga(): Generator<unknown, void, unknown> {
  yield takeLatest(userDataActions.fetchUserDataRequest.type, fetchUserDataSaga);
}




