import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const StockFilter = ({ value, onChange }: Props) => {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Buscar producto por nombre o descripción..."
    />
  );
};