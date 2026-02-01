import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { userDataActions } from './userDataSlice';
import { ordersActions } from '../orders/ordersSlice';
import { addressesActions } from '../addresses/addressesSlice';
import { wishlistActions } from '../wishlist/wishlistSlice';
import { profileActions } from '../profile/profileSlice';
import type { RootState } from '../../types';
import type { UserDataState } from './userDataSlice';

function* fetchUserDataSaga(): Generator<any, void, unknown> {
  try {
    // Check if user data is already loaded
    const userDataState = (yield select((state: RootState) => state.userData)) as UserDataState;
    
    if (userDataState.loaded) {
      // Data already loaded, update individual slices from cache without API call
      if (userDataState.profile) {
        yield put(profileActions.batchUpdateProfile(userDataState.profile));
      }
      if (userDataState.orders.length > 0) {
        yield put(ordersActions.batchUpdateOrders(userDataState.orders));
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
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response as any);

    const { profile, orders, addresses, wishlist } = transformedData;

    // Update userData slice
    yield put(userDataActions.fetchUserDataSuccess({
      profile: profile || null,
      orders: orders || [],
      addresses: addresses || [],
      wishlist: wishlist || [],
    }));

    // Update individual slices for backward compatibility
    if (profile) {
      yield put(profileActions.batchUpdateProfile(profile));
    }
    if (orders && orders.length > 0) {
      yield put(ordersActions.batchUpdateOrders(orders));
    }
    if (addresses && addresses.length > 0) {
      yield put(addressesActions.batchUpdateAddresses(addresses));
    }
    if (wishlist && wishlist.length > 0) {
      yield put(wishlistActions.batchUpdateWishlist(wishlist));
    }
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(userDataActions.fetchUserDataFailure(processedError.message));
  }
}

export function* userDataSaga(): Generator<any, void, unknown> {
  yield takeLatest(userDataActions.fetchUserDataRequest.type, fetchUserDataSaga);
}




