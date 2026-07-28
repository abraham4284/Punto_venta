import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BusinessUsersFilters as Filters } from "../types";

type BusinessUsersFiltersProps = {
  filters: Filters;
  onApply: (filters: Partial<Filters>) => void;
};

export const BusinessUsersFilters = ({
  filters,
  onApply,
}: BusinessUsersFiltersProps) => {
  const [search, setSearch] = useState(filters.search);
  const [role, setRole] = useState<Filters["role"]>(filters.role);
  const [status, setStatus] = useState<Filters["status"]>(filters.status);

  const handleApply = () => {
    onApply({ search, role, status });
  };

  const handleClear = () => {
    setSearch("");
    setRole("ALL");
    setStatus("ALL");
    onApply({ search: "", role: "ALL", status: "ALL" });
  };

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_180px_180px_auto_auto]">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nombre, usuario o correo"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <Select
        value={role}
        onValueChange={(value) => setRole((value || "ALL") as Filters["role"])}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Rol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los roles</SelectItem>
          <SelectItem value="OWNER">Propietario</SelectItem>
          <SelectItem value="ADMIN">Administrador</SelectItem>
          <SelectItem value="SELLER">Vendedor</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(value) =>
          setStatus((value || "ALL") as Filters["status"])
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los estados</SelectItem>
          <SelectItem value="ACTIVE">Activos</SelectItem>
          <SelectItem value="INACTIVE">Inactivos</SelectItem>
        </SelectContent>
      </Select>

      <Button type="button" onClick={handleApply}>
        Aplicar filtros
      </Button>
      <Button type="button" variant="outline" onClick={handleClear}>
        Limpiar
      </Button>
    </div>
  );
};

