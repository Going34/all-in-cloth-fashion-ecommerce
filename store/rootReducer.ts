import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/auth/authSlice';
import productsReducer from './slices/products/productsSlice';
import ordersReducer from './slices/orders/ordersSlice';
import customersReducer from './slices/customers/customersSlice';
import inventoryReducer from './slices/inventory/inventorySlice';
import dashboardReducer from './slices/dashboard/dashboardSlice';
import settingsReducer from './slices/settings/settingsSlice';
import teamReducer from './slices/team/teamSlice';
import categoriesReducer from './slices/categories/categoriesSlice';
import cartReducer from './slices/cart/cartSlice';
import wishlistReducer from './slices/wishlist/wishlistSlice';
import addressesReducer from './slices/addresses/addressesSlice';
import profileReducer from './slices/profile/profileSlice';
import userDataReducer from './slices/userData/userDataSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  orders: ordersReducer,
  customers: customersReducer,
  inventory: inventoryReducer,
  dashboard: dashboardReducer,
  settings: settingsReducer,
  team: teamReducer,
  categories: categoriesReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
  addresses: addressesReducer,
  profile: profileReducer,
  userData: userDataReducer,
});

export default rootReducer;

