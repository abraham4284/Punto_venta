import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export const OrderSelect = ({ id, label, value, options, placeholder = "Seleccionar", disabled, error, onChange }: {
  id: string; label: string; value: string; options: { value: string; label: string }[];
  placeholder?: string; disabled?: boolean; error?: string; onChange: (value: string) => void;
}) => (
  <div className="min-w-0 space-y-2">
    <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium">{label}</label>
    <Select value={value || "__empty__"} disabled={disabled} onValueChange={(next: string | null) => {
      if (next !== null) onChange(next === "__empty__" ? "" : next);
    }}>
      <SelectTrigger id={id} aria-labelledby={`${id}-label`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className="h-11 w-full min-w-0">
        <span className="flex-1 truncate text-left">{options.find((option) => option.value === value)?.label || placeholder}</span>
      </SelectTrigger>
      <SelectContent>{options.map((option) => <SelectItem key={option.value || "__empty__"} value={option.value || "__empty__"}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
    {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
  </div>
);
