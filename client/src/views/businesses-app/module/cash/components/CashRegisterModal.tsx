import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cashRegisterFormSchema } from "../validations/cash.validations";
import type {
  CashRegisterResponse,
  CreateCashRegisterBody,
  UpdateCashRegisterBody,
} from "../types";

interface CashRegisterModalProps {
  isOpen: boolean;
  dataEdit: CashRegisterResponse | null;
  saving: boolean;
  onClose: () => void;
  onCreate: (body: CreateCashRegisterBody) => Promise<boolean>;
  onUpdate: (idCashRegister: number, body: UpdateCashRegisterBody) => Promise<boolean>;
}

export const CashRegisterModal = ({
  isOpen,
  dataEdit,
  saving,
  onClose,
  onCreate,
  onUpdate,
}: CashRegisterModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = window.setTimeout(() => {
      setName(dataEdit?.name ?? "");
      setDescription(dataEdit?.description ?? "");
      setIsDefault(dataEdit?.isDefault ?? false);
      setErrors({});
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [dataEdit, isOpen]);

  const handleSubmit = async () => {
    const parsed = cashRegisterFormSchema.safeParse({
      name,
      description,
      isDefault,
    });

    if (!parsed.success) {
      setErrors(
        parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          acc[issue.path.join(".")] = issue.message;
          return acc;
        }, {}),
      );
      return;
    }

    const body = {
      name: parsed.data.name,
      description: parsed.data.description || null,
      isDefault: parsed.data.isDefault,
    };
    const saved = dataEdit
      ? await onUpdate(dataEdit.idCashRegister, body)
      : await onCreate(body);

    if (saved) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dataEdit ? "Editar caja" : "Nueva caja"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="grid gap-2">
            <Label>Descripcion</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
            />
            Marcar como caja predeterminada
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={saving} onClick={handleSubmit}>
            {saving ? "Guardando..." : dataEdit ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
