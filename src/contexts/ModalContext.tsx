'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

export type ModalType =
  | 'newSale'
  | 'addProduct'
  | 'addExpense'
  | 'editProduct'
  | 'editCustomer'
  | 'recordPayment';

export interface ModalState {
  type: ModalType | null;
  data?: any;
}

interface ModalContextType {
  modalState: ModalState;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });

  const openModal = (type: ModalType, data: any = null) => {
    setModalState({ type, data });
  };

  const closeModal = () => {
    setModalState({ type: null, data: null });
  };

  return (
    <ModalContext.Provider value={{ modalState, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
