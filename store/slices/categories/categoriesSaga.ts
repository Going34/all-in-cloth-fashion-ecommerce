import { call, put, takeEvery } from 'redux-saga/effects';
import { apiClient } from '../../api/client';
import { apiInterceptor } from '../../api/interceptor';
import { categoriesActions } from './categoriesSlice';

function* fetchCategoriesSaga() {
  try {
    const config = {
      url: '/admin/categories',
      method: 'GET' as const,
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(categoriesActions.fetchCategoriesDataSuccess(transformedData));
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(categoriesActions.fetchCategoriesDataFailure(processedError.message));
  }
}

function* createCategorySaga(action: ReturnType<typeof categoriesActions.createCategoryRequest>) {
  try {
    const config = {
      url: '/admin/categories',
      method: 'POST' as const,
      data: {
        name: action.payload.name,
        parent_id: action.payload.parent_id || null,
      },
    };

    const interceptedConfig = apiInterceptor.request(config);
    const response = yield call(apiClient.request, interceptedConfig);
    const transformedData = apiInterceptor.response(response);

    yield put(categoriesActions.createCategorySuccess(transformedData));
    
    // Refresh categories list to ensure consistency
    yield put(categoriesActions.fetchCategoriesDataRequest());
  } catch (error: any) {
    const processedError = apiInterceptor.error(error);
    yield put(categoriesActions.createCategoryFailure(processedError.message));
  }
}

export function* categoriesSaga() {
  yield takeEvery(categoriesActions.fetchCategoriesDataRequest.type, fetchCategoriesSaga);
  yield takeEvery(categoriesActions.createCategoryRequest.type, createCategorySaga);
}

