import { useState, type ChangeEvent } from "react";

export const useForm = <T extends Record<string, any>>(initialForm: T) => {
  const [formSate, setFormSate] = useState(initialForm);

  const onInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormSate({
      ...formSate,
      [name]: value,
    });
  };

  const onResetForm = () => {
    setFormSate(initialForm);
  };

  const dataForm = {
    ...formSate,
    formSate,
    onInputChange,
    onResetForm,
    setFormSate,
  };

  return {
    ...formSate,
    formSate,
    onInputChange,
    onResetForm,
    setFormSate,
    dataForm,
  };
};
