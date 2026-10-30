import { useRef, useState, type FormEvent, type RefObject } from "react";
import { isAxiosError } from "axios";
import { LoaderCircle } from "lucide-react";
import { customerFormSchema } from "../../validations/customer.validation";
import type { Customer, CustomerDocumentType, CustomerFormValues } from "../../types/customers.types";
import { CUSTOMER_DOCUMENT_TYPE_LABELS } from "../../helpers/customer.helpers";
import { useForm } from "@/hooks/useForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  isOpen: boolean;
  customerEdit: Customer | null;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
}

interface CustomerErrorResponse {
  message?: string;
  errors?: { field: string; message: string }[];
}

const textFields = [
  { name: "firstName", label: "Nombre", type: "text", autoComplete: "given-name", maxLength: 120, required: true },
  { name: "lastName", label: "Apellido", type: "text", autoComplete: "family-name", maxLength: 120, required: true },
  { name: "phone", label: "Teléfono", type: "tel", autoComplete: "tel", maxLength: 80, required: false },
  { name: "email", label: "Email", type: "email", autoComplete: "email", maxLength: 160, required: false },
] as const;

// Mount a fresh form for each opening/customer, avoiding effect-driven resets while typing.
const CustomerFormContent = ({ customerEdit, onClose, onSubmit, submittingRef }: Omit<Props, "isOpen"> & { submittingRef: RefObject<boolean> }) => {
  const initialForm: CustomerFormValues = {
    firstName: customerEdit?.firstName ?? "",
    lastName: customerEdit?.lastName ?? "",
    documentType: customerEdit?.documentType ?? "",
    documentNumber: customerEdit?.documentNumber ?? "",
    phone: customerEdit?.phone ?? "",
    email: customerEdit?.email ?? "",
    address: customerEdit?.address ?? "",
    observation: customerEdit?.observation ?? "",
  };
  const { formSate, onInputChange, setFormSate } = useForm<CustomerFormValues>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleDocumentType = (value: string | null) => {
    if (value === null) return;
    const type = value === "NONE" ? "" : value as CustomerDocumentType;
    setFormSate((current) => ({ ...current, documentType: type, documentNumber: type ? current.documentNumber : "" }));
    setErrors((current) => ({ ...current, documentType: "", documentNumber: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const result = customerFormSchema.safeParse(formSate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path.join(".")] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    submittingRef.current = true;
    setSaving(true);
    setErrors({});
    try {
      await onSubmit({ ...formSate, ...result.data });
      onClose();
    } catch (error: unknown) {
      const response = isAxiosError<CustomerErrorResponse>(error) ? error.response?.data : undefined;
      const fieldErrors: Record<string, string> = {};
      response?.errors?.forEach(({ field, message }) => {
        fieldErrors[field || "form"] = message;
      });
      if (Object.keys(fieldErrors).length === 0) {
        fieldErrors.form = response?.message || "No se pudo guardar el cliente. Intentá nuevamente.";
      }
      setErrors(fieldErrors);
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  const fieldError = (name: string) => errors[name] ? (
    <p id={`customer-${name}-error`} role="alert" className="text-sm text-destructive">{errors[name]}</p>
  ) : null;

  return (
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl" showCloseButton={!saving}>
      <DialogHeader>
        <DialogTitle>{customerEdit ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        <DialogDescription>Datos del cliente</DialogDescription>
      </DialogHeader>
      <form noValidate onSubmit={handleSubmit} className="space-y-4" aria-busy={saving}>
        <fieldset disabled={saving} className="grid min-w-0 gap-4 sm:grid-cols-2">
          {textFields.slice(0, 2).map((field) => (
            <div key={field.name} className="grid min-w-0 gap-2">
              <Label htmlFor={`customer-${field.name}`}>{field.label} *</Label>
              <Input {...field} id={`customer-${field.name}`} value={formSate[field.name]} onChange={onInputChange}
                aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `customer-${field.name}-error` : undefined} />
              {fieldError(field.name)}
            </div>
          ))}
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="customer-documentType">Tipo de documento</Label>
            <Select value={formSate.documentType || "NONE"} onValueChange={handleDocumentType} disabled={saving}>
              <SelectTrigger id="customer-documentType" className="w-full" aria-invalid={Boolean(errors.documentType)} aria-describedby={errors.documentType ? "customer-documentType-error" : undefined}>
                <SelectValue>{formSate.documentType ? CUSTOMER_DOCUMENT_TYPE_LABELS[formSate.documentType] : "Sin documento"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin documento</SelectItem>
                {(Object.keys(CUSTOMER_DOCUMENT_TYPE_LABELS) as CustomerDocumentType[]).map((type) => (
                  <SelectItem key={type} value={type}>{CUSTOMER_DOCUMENT_TYPE_LABELS[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("documentType")}
          </div>
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="customer-documentNumber">Número de documento</Label>
            <Input id="customer-documentNumber" name="documentNumber" type="text" value={formSate.documentNumber}
              onChange={onInputChange} aria-invalid={Boolean(errors.documentNumber)}
              aria-describedby={errors.documentNumber ? "customer-documentNumber-error" : undefined} />
            {fieldError("documentNumber")}
          </div>
          {textFields.slice(2).map((field) => (
            <div key={field.name} className="grid min-w-0 gap-2">
              <Label htmlFor={`customer-${field.name}`}>{field.label}</Label>
              <Input {...field} id={`customer-${field.name}`} value={formSate[field.name]} onChange={onInputChange}
                aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `customer-${field.name}-error` : undefined} />
              {fieldError(field.name)}
            </div>
          ))}
          <div className="grid min-w-0 gap-2 sm:col-span-2">
            <Label htmlFor="customer-address">Dirección</Label>
            <Input id="customer-address" name="address" autoComplete="street-address" maxLength={255}
              value={formSate.address} onChange={onInputChange} aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "customer-address-error" : undefined} />
            {fieldError("address")}
          </div>
          <div className="grid min-w-0 gap-2 sm:col-span-2">
            <Label htmlFor="customer-observation">Observación</Label>
            <Textarea id="customer-observation" name="observation" maxLength={255} value={formSate.observation}
              onChange={onInputChange} aria-invalid={Boolean(errors.observation)}
              aria-describedby={errors.observation ? "customer-observation-error" : undefined} />
            {fieldError("observation")}
          </div>
        </fieldset>
        {fieldError("form")}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving && <LoaderCircle className="mr-2 size-4 animate-spin" />}
            {saving ? "Guardando..." : customerEdit ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export const CustomerFormModal = ({ isOpen, customerEdit, onClose, onSubmit }: Props) => {
  const submittingRef = useRef(false);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !submittingRef.current) onClose(); }}>
      {isOpen && <CustomerFormContent key={customerEdit?.idCustomer ?? "new"} customerEdit={customerEdit} onClose={onClose} onSubmit={onSubmit} submittingRef={submittingRef} />}
    </Dialog>
  );
};
