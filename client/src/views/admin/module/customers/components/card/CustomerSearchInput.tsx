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
      placeholder="Buscar por nombre, teléfono, email o dirección..."
    />
  );
};