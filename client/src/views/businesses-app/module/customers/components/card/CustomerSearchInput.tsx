import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const CustomerSearchInput = ({ value, onChange }: Props) => {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Buscar clientes"
      placeholder="Buscar por nombre, apellido, documento, teléfono o email..."
    />
  );
};
