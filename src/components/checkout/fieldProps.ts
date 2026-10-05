import type React from "react";
import type { CheckoutErrors, CheckoutField, CheckoutForm } from "@/types/checkout";

export interface CheckoutFieldsState {
  form: CheckoutForm;
  errors: CheckoutErrors;
  setField: (field: CheckoutField, value: string) => void;
}

export function checkoutFieldId(field: string): string {
  return `checkout-${field}`;
}

/** Props comuns dos inputs do checkout (id/name estáveis, valor, erro e máscara). */
export function checkoutFieldProps(
  field: CheckoutField,
  { form, errors, setField }: CheckoutFieldsState,
  mask?: (value: string) => string,
) {
  return {
    id: checkoutFieldId(field),
    name: field,
    value: form[field],
    error: errors[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setField(field, mask ? mask(event.target.value) : event.target.value),
  };
}
