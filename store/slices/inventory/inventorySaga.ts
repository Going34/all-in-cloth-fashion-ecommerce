import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import type { AxiosError, AxiosResponse } from 'axios';
import { apiClient } from '../../api/client';
import { apiInterceptor, type ApiResponse } from '../../api/interceptor';
import { inventoryActions } from './inventorySlice';
import { toastActions } from '../toast/toastSlice';
import type {
	InventoryListItem,
	InventoryListResponse,
	InventoryStatsResponse,
} from '@/modules/inventory/inventory.types';

function* fetchInventorySaga(
	action: ReturnType<typeof inventoryActions.fetchInventoryDataRequest>,
): Generator<unknown, void, unknown> {
	try {
		const config = {
			url: '/admin/inventory',
			method: 'GET' as const,
			params: action.payload || {},
		};

		const interceptedConfig = apiInterceptor.request(config);
		const response = (yield call(
			apiClient.request,
			interceptedConfig,
		)) as AxiosResponse<ApiResponse<InventoryListResponse>>;
		const transformedData = apiInterceptor.response<InventoryListResponse>(response);

		yield put(
			inventoryActions.fetchInventoryDataSuccess({
				items: transformedData.items,
				pagination: transformedData.pagination,
			}),
		);
	} catch (error: unknown) {
		const processedError = apiInterceptor.error(error as AxiosError<ApiResponse>);
		yield put(inventoryActions.fetchInventoryDataFailure(processedError.message));
	}
}

function* fetchInventoryStatsSaga(): Generator<unknown, void, unknown> {
	try {
		const config = {
			url: '/admin/inventory/stats',
			method: 'GET' as const,
		};

		const interceptedConfig = apiInterceptor.request(config);
		const response = (yield call(
			apiClient.request,
			interceptedConfig,
		)) as AxiosResponse<ApiResponse<InventoryStatsResponse>>;
		const transformedData = apiInterceptor.response<InventoryStatsResponse>(response);

		yield put(inventoryActions.fetchInventoryStatsSuccess(transformedData));
	} catch (error: unknown) {
		const processedError = apiInterceptor.error(error as AxiosError<ApiResponse>);
		yield put(inventoryActions.fetchInventoryStatsFailure(processedError.message));
	}
}

function* updateStockSaga(
	action: ReturnType<typeof inventoryActions.updateStockRequest>,
): Generator<unknown, void, unknown> {
	try {
		const config = {
			url: `/admin/inventory/${action.payload.variantId}/stock`,
			method: 'PUT' as const,
			data: {
				action: action.payload.action,
				quantity: action.payload.quantity,
			},
		};

		const interceptedConfig = apiInterceptor.request(config);
		const response = (yield call(
			apiClient.request,
			interceptedConfig,
		)) as AxiosResponse<ApiResponse<InventoryListItem>>;
		const transformedData = apiInterceptor.response<InventoryListItem>(response);

		yield put(inventoryActions.updateStockSuccess(transformedData));
		yield put(toastActions.showToast('Stock updated successfully', 'success'));
	} catch (error: unknown) {
		const processedError = apiInterceptor.error(error as AxiosError<ApiResponse>);
		yield put(inventoryActions.updateStockFailure(processedError.message));
		yield put(
			toastActions.showToast(
				processedError.message || 'Failed to update stock',
				'error',
			),
		);
	}
}

export function* inventorySaga(): Generator<unknown, void, unknown> {
  yield takeLatest(inventoryActions.fetchInventoryDataRequest.type, fetchInventorySaga);
  yield takeEvery(inventoryActions.fetchInventoryStatsRequest.type, fetchInventoryStatsSaga);
  yield takeEvery(inventoryActions.updateStockRequest.type, updateStockSaga);
}

