type HotkeyItem = {
  keyName: string;
  label: string;
};

const hotkeys: HotkeyItem[] = [
  { keyName: "F2", label: "Buscar productos" },
  { keyName: "ENTER", label: "Agregar" },
  { keyName: "F9", label: "Finalizar venta" },
];

export const POSHotkeysLegend = () => {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      {hotkeys.map((hotkey) => (
        <div key={hotkey.keyName} className="flex items-center gap-1.5">
          <kbd className="rounded border bg-background px-2 py-1 font-mono text-[11px] font-semibold text-foreground shadow-sm">
            {hotkey.keyName}
          </kbd>
          <span>{hotkey.label}</span>
        </div>
      ))}
    </div>
  );
};
