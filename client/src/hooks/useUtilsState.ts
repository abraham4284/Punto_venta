import { useState } from "react";

export const useUtilsState = <T,>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenModalEdit, setOpenModalEdit] = useState(false);
  const [dataEdit, setDataEdit] = useState<T | null>(null);

  const addDataEdit = (data: T | null) => setDataEdit(data);
  const resetDataEdit = () => setDataEdit(null);

  const toggleModal = () => setIsOpen((prev) => !prev);
  const closeModal = () => setIsOpen(false);

  const openModalEdit = () => setOpenModalEdit((prev) => !prev);
  const closeModalEdit = () => setOpenModalEdit(false);

  const toggleModalAndResetDataEdit = () => {
    resetDataEdit();
    toggleModal();
  };

  return {
    dataEdit,
    isOpen,
    isOpenModalEdit,
    addDataEdit,
    resetDataEdit,
    toggleModal,
    closeModal,
    openModalEdit,
    closeModalEdit,
    setIsOpen,
    setOpenModalEdit,
    toggleModalAndResetDataEdit,
  };
};