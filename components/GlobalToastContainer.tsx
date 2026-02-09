'use client';

import React from 'react';
import { ToastContainer } from '@/components/ui/Toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toastActions } from '@/store/slices/toast/toastSlice';

const GlobalToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.toast.toasts);

  const handleDismiss = (id: string) => {
    dispatch(toastActions.dismissToast(id));
  };

  return <ToastContainer toasts={toasts} onDismiss={handleDismiss} />;
};

export default GlobalToastContainer;
