import { useEffect } from "react";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "@/hooks/useForm";
import type {
  BusinessUser,
  BusinessUserFieldError,
  CreateBusinessUserBody,
  UpdateBusinessUserBody,
} from "../types";

type BusinessUserFormState = {
  name: string;
  username: string;
  email: string;
  password: string;
  role: "ADMIN" | "SELLER" | "DELIVERY";
};

type BusinessUserModalProps = {
  isOpen: boolean;
  dataEdit: BusinessUser | null;
  saving: boolean;
  fieldErrors: BusinessUserFieldError[];
  onClose: () => void;
  onCreate: (body: CreateBusinessUserBody) => Promise<boolean>;
  onUpdate: (idUser: number, body: UpdateBusinessUserBody) => Promise<boolean>;
  onClearErrors: () => void;
};

const initialFormState: BusinessUserFormState = {
  name: "",
  username: "",
  email: "",
  password: "",
  role: "SELLER",
};

const getFieldError = (
  errors: BusinessUserFieldError[],
  field: string,
): string | undefined => {
  return errors.find((error) => error.field === field)?.message;
};

export const BusinessUserModal = ({
  isOpen,
  dataEdit,
  saving,
  fieldErrors,
  onClose,
  onCreate,
  onUpdate,
  onClearErrors,
}: BusinessUserModalProps) => {
  const { formSate, setFormSate, onInputChange, onResetForm } =
    useForm<BusinessUserFormState>(initialFormState);
  const isEdit = Boolean(dataEdit);

  useEffect(() => {
    if (!isOpen) return;

    if (dataEdit) {
      setFormSate({
        name: dataEdit.name,
        username: dataEdit.username,
        email: dataEdit.email ?? "",
        password: "",
        role:
          dataEdit.role === "ADMIN" || dataEdit.role === "DELIVERY"
            ? dataEdit.role
            : "SELLER",
      });
      return;
    }

    setFormSate(initialFormState);
  }, [dataEdit, isOpen, setFormSate]);

  const handleClose = () => {
    onClearErrors();
    onResetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const basePayload = {
      name: formSate.name.trim(),
      username: formSate.username.trim(),
      email: formSate.email.trim() || null,
    };
    const success =
      isEdit && dataEdit
        ? await onUpdate(dataEdit.idUser, basePayload)
        : await onCreate({
            ...basePayload,
            password: formSate.password,
            role: formSate.role,
          });

    if (success) {
      handleClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modificar usuario" : "Nuevo usuario del negocio"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              name="name"
              value={formSate.name}
              onChange={onInputChange}
              placeholder="Ej. Maria Lopez"
            />
            {getFieldError(fieldErrors, "name") ? (
              <p className="text-sm text-destructive">
                {getFieldError(fieldErrors, "name")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              name="username"
              value={formSate.username}
              onChange={onInputChange}
              placeholder="maria_caja"
            />
            {getFieldError(fieldErrors, "username") ? (
              <p className="text-sm text-destructive">
                {getFieldError(fieldErrors, "username")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formSate.email}
              onChange={onInputChange}
              placeholder="usuario@empresa.com"
            />
            {getFieldError(fieldErrors, "email") ? (
              <p className="text-sm text-destructive">
                {getFieldError(fieldErrors, "email")}
              </p>
            ) : null}
          </div>

          {!isEdit ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="password">Contrasena temporal</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formSate.password}
                  onChange={onInputChange}
                  placeholder="Minimo 6 caracteres"
                />
                {getFieldError(fieldErrors, "password") ? (
                  <p className="text-sm text-destructive">
                    {getFieldError(fieldErrors, "password")}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label>Rol inicial</Label>
                <Select
                  value={formSate.role}
                  onValueChange={(value) => {
                    if (value === "ADMIN" || value === "SELLER" || value === "DELIVERY") {
                      setFormSate({ ...formSate, role: value });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="SELLER">Vendedor</SelectItem>
                    <SelectItem value="DELIVERY">Cadete / Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
