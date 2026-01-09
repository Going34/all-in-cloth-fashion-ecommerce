'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { InventoryItem } from '../types';

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  setInventoryItems: (items: InventoryItem[]) => void;
  refreshInventory: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const refreshInventory = () => {
    setInventoryItems([...inventoryItems]);
  };

  return (
    <InventoryContext.Provider
      value={{
        inventoryItems,
        setInventoryItems,
        refreshInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
