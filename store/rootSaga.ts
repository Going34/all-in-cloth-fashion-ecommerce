import { all } from 'redux-saga/effects';
import { authSaga } from './slices/auth/authSaga';
import { productsSaga } from './slices/products/productsSaga';
import { ordersSaga } from './slices/orders/ordersSaga';
import { customersSaga } from './slices/customers/customersSaga';
import { inventorySaga } from './slices/inventory/inventorySaga';
import { dashboardSaga } from './slices/dashboard/dashboardSaga';
import { settingsSaga } from './slices/settings/settingsSaga';
import { teamSaga } from './slices/team/teamSaga';
import { categoriesSaga } from './slices/categories/categoriesSaga';
import { cartSaga } from './slices/cart/cartSaga';
import { wishlistSaga } from './slices/wishlist/wishlistSaga';
import { addressesSaga } from './slices/addresses/addressesSaga';
import { profileSaga } from './slices/profile/profileSaga';

export default function* rootSaga() {
  yield all([
    authSaga(),
    productsSaga(),
    ordersSaga(),
    customersSaga(),
    inventorySaga(),
    dashboardSaga(),
    settingsSaga(),
    teamSaga(),
    categoriesSaga(),
    cartSaga(),
    wishlistSaga(),
    addressesSaga(),
    profileSaga(),
  ]);
}

