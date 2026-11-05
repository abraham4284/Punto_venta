import { useEffect, useState, type FormEvent } from "react";
import { useForm } from "@/hooks/useForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { businessFormSchema } from "../../validations/businesses.validations";
import type {
  BusinessType,
  BusinessFormValues,
  BusinessResponse,
  FieldError,
  UpdateBusinessBody,
} from "../../types";
import {
  BUSINESS_TYPE_OPTIONS,
  BUSINESS_TYPE_VALUES,
} from "../../types";

type MutationResult = {
  status: boolean;
  message: string;
  errors?: FieldError[];
};

type Props = {
  isOpen: boolean;
  dataEdit: BusinessResponse | null;
  backendErrors: FieldError[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: UpdateBusinessBody) => Promise<MutationResult>;
};

const initialForm: BusinessFormValues = {
  wholesaleEnabled: false,
  wholesaleMinimumAmount: "",
  name: "",
  slug: "",
  logoUrl: "",
  businessType: "MAXIKIOSCO",
};

const isBusinessType = (value: string | null | undefined): value is BusinessType => {
  return BUSINESS_TYPE_VALUES.some((businessType) => businessType === value);
};

const normalizeBusinessType = (
  value: string | null | undefined,
): BusinessType => {
  if (isBusinessType(value)) {
    return value;
  }

  return "MAXIKIOSCO";
};

const mapErrorsToRecord = (errors: FieldError[]): Record<string, string> => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

export const UpdateBusinessModal = ({
  isOpen,
  dataEdit,
  backendErrors,
  saving,
  onClose,
  onSubmit,
}: Props) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<BusinessFormValues>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (dataEdit) {
        setFormSate({
          wholesaleEnabled: dataEdit.wholesaleEnabled,
          wholesaleMinimumAmount: dataEdit.wholesaleMinimumAmount == null ? "" : String(dataEdit.wholesaleMinimumAmount),
          name: dataEdit.name,
          slug: dataEdit.slug,
          logoUrl: dataEdit.logoUrl ?? "",
          businessType: normalizeBusinessType(dataEdit.businessType),
        });
      } else {
        setFormSate(initialForm);
      }

      setErrors({});
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [dataEdit, isOpen, setFormSate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (backendErrors.length > 0) {
        setErrors(mapErrorsToRecord(backendErrors));
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [backendErrors]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !saving) {
      setErrors({});
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const validation = businessFormSchema.safeParse({
      ...formSate,
      logoUrl: formSate.logoUrl.trim() === "" ? null : formSate.logoUrl,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.issues.reduce<Record<string, string>>(
        (acc, issue) => {
          const field = issue.path[0];

          if (typeof field === "string") {
            acc[field] = issue.message;
          }

          return acc;
        },
        {},
      );

      setErrors(fieldErrors);
      return;
    }

    const result = await onSubmit(validation.data);

    if (!result.status) {
      setErrors({ ...mapErrorsToRecord(result.errors ?? []), form: result.message });
      return;
    }

    onResetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar perfil del negocio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <fieldset disabled={saving} className="grid min-w-0 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              value={formSate.name}
              onChange={onInputChange}
              placeholder="Financiera Norte"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={formSate.slug}
              onChange={onInputChange}
              placeholder="financiera-norte"
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              value={formSate.logoUrl}
              onChange={onInputChange}
              placeholder="https://..."
            />
            {errors.logoUrl && (
              <p className="text-sm text-destructive">{errors.logoUrl}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Tipo de negocio</Label>
            <Select
              value={formSate.businessType}
              onValueChange={(value) => {
                if (isBusinessType(value)) {
                  setFormSate({
                    ...formSate,
                    businessType: value,
                  });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione un tipo de negocio" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.businessType && (
              <p className="text-sm text-destructive">{errors.businessType}</p>
            )}
          </div>

          <section className="grid gap-3 rounded-lg border p-4" aria-label="Configuración mayorista">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="wholesale-enabled">Habilitar precios mayoristas</Label>
              <Switch id="wholesale-enabled" checked={formSate.wholesaleEnabled} onCheckedChange={(checked) => setFormSate((current) => ({ ...current, wholesaleEnabled: checked, wholesaleMinimumAmount: checked ? current.wholesaleMinimumAmount : "" }))} />
            </div>
            {formSate.wholesaleEnabled && <div className="grid gap-2">
              <Label htmlFor="wholesale-minimum">Compra mínima inicial (ARS)</Label>
              <Input id="wholesale-minimum" name="wholesaleMinimumAmount" inputMode="decimal" value={formSate.wholesaleMinimumAmount} onChange={onInputChange} aria-invalid={Boolean(errors.wholesaleMinimumAmount)} aria-describedby="wholesale-minimum-help wholesale-minimum-error" placeholder="Ingresá el mínimo" />
              <p id="wholesale-minimum-help" className="text-xs text-muted-foreground">Mayor a cero y hasta dos decimales con punto. Se exige solo en la primera compra mayorista.</p>
              <p id="wholesale-minimum-error" className="text-sm text-destructive" role="alert">{errors.wholesaleMinimumAmount}</p>
            </div>}
            {!formSate.wholesaleEnabled && <p className="text-xs text-muted-foreground">Las nuevas ventas usarán precios minoristas. El mínimo se guardará vacío.</p>}
          </section>
          {errors.form && <p role="alert" className="text-sm text-destructive">{errors.form}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setErrors({});
                onClose();
              }}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
};
