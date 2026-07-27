import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronsUpDown, Search } from "lucide-react";



type SearchBoxProps<T> = {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: T[];
  getKey: (option: T) => number;
  getLabel: (option: T) => string;
  onSearchChange: (value: string) => void;
  onSelect: (option: T) => void;
  error?: string;
};


export const SearchBox = <T,>({
  label,
  required,
  value,
  placeholder,
  options,
  getKey,
  getLabel,
  onSearchChange,
  onSelect,
  error,
}: SearchBoxProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="grid gap-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div
        className="relative"
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 120);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        {isOpen && (
          <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {options.length > 0 ? (
              options.map((option) => (
                <button
                  key={getKey(option)}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                  className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {getLabel(option)}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Sin resultados
              </p>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};